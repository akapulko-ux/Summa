import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import { storage } from "./storage";
import { User, insertUserSchema, registerSchema, loginSchema } from "@shared/schema";
import nodemailer from "nodemailer";
import { ZodError } from "zod";
import { zValidationErrorToMessage } from "./utils";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

// Temporary storage for magic links
const magicLinks = new Map<string, { email: string, expires: Date }>();

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Create a test SMTP transporter for development
// In production, use a real email service
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "ethereal.user@ethereal.email",
    pass: process.env.SMTP_PASS || "ethereal_pass",
  },
});

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "saasly-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !user.passwordHash || !(await comparePasswords(password, user.passwordHash))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          if (!user.isActive) {
            return done(null, false, { message: "Account is inactive" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Debug admin account
  app.post("/api/debug/create-admin", async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ message: "Only available in development" });
    }

    try {
      const adminUser = await storage.createUser({
        email: "admin@debug.local",
        passwordHash: await hashPassword("admin123"),
        name: "Debug Admin",
        companyName: "Debug Company",
        phone: "",
        role: "admin",
        isActive: true,
      });

      res.status(201).json({ 
        message: "Debug admin created",
        credentials: {
          email: "admin@debug.local",
          password: "admin123"
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate using Zod schema
      const validatedData = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Create the user
      const user = await storage.createUser({
        email: validatedData.email,
        passwordHash: await hashPassword(validatedData.password),
        name: validatedData.name,
        companyName: validatedData.companyName,
        phone: validatedData.phone,
        role: "client", // default role
        isActive: true,
      });

      // Log in the user
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove sensitive data before sending to client
        const { passwordHash, ...userData } = user;
        res.status(201).json(userData);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: zValidationErrorToMessage(error) });
      }
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    try {
      // Validate using Zod schema
      loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: Error, user: User, info: { message: string }) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info.message || "Invalid credentials" });
        
        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          
          // Remove sensitive data before sending to client
          const { passwordHash, ...userData } = user;
          res.status(200).json(userData);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: zValidationErrorToMessage(error) });
      }
      next(error);
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Remove sensitive data before sending to client
    const { passwordHash, ...userData } = req.user;
    res.json(userData);
  });

  // Magic link generation
  app.post("/api/auth/magic-link", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is inactive" });
      }
      
      // Generate a unique token
      const token = uuidv4();
      
      // Store the token with the user's email (valid for 10 minutes)
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 10);
      magicLinks.set(token, { email, expires });
      
      // Build the magic link URL
      const host = req.get('host') || 'localhost:5000';
      const protocol = req.protocol || 'http';
      const magicLink = `${protocol}://${host}/api/auth/verify-magic-link?token=${token}`;
      
      // Send email with the magic link
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"SaaSly" <noreply@saasly.com>',
        to: email,
        subject: "Your Magic Login Link",
        text: `Click this link to log in: ${magicLink} (valid for 10 minutes)`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Login to SaaSly</h2>
            <p>Click the button below to log in to your account. This link will expire in 10 minutes.</p>
            <a href="${magicLink}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0;">
              Login to SaaSly
            </a>
            <p style="color: #666; font-size: 0.9em;">If you didn't request this email, you can safely ignore it.</p>
          </div>
        `,
      });
      
      res.status(200).json({ message: "Magic link sent to your email" });
    } catch (error) {
      console.error("Magic link error:", error);
      res.status(500).json({ message: "Failed to send magic link" });
    }
  });

  // Magic link verification
  app.get("/api/auth/verify-magic-link", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.redirect("/auth?error=invalid-token");
      }
      
      const magicLink = magicLinks.get(token);
      
      if (!magicLink) {
        return res.redirect("/auth?error=expired-token");
      }
      
      const now = new Date();
      if (now > magicLink.expires) {
        magicLinks.delete(token);
        return res.redirect("/auth?error=expired-token");
      }
      
      const user = await storage.getUserByEmail(magicLink.email);
      
      if (!user) {
        return res.redirect("/auth?error=user-not-found");
      }
      
      // Login the user
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect("/auth?error=login-failed");
        }
        
        // Clean up the used token
        magicLinks.delete(token);
        
        // Redirect to the dashboard
        res.redirect("/");
      });
    } catch (error) {
      console.error("Magic link verification error:", error);
      res.redirect("/auth?error=server-error");
    }
  });
}
