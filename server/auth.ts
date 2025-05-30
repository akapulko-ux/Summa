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
    // Расширяем интерфейс User для Express, чтобы включить роль и ID пользователя
    interface User {
      id: number;
      role: string;
      email: string;
      username: string;
      telegramChatId?: string | null;
      phone?: string | null;
    }
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
  host: 'smtp.mail.ru',
  port: 465,
  secure: true, // SSL/TLS
  auth: {
    user: 'no_replay@summapay.ru',
    pass: 'cOvr83FSVrdYyDCsrLq9',
  },
});

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "summa-secret-key-change-in-production",
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
          console.log("Login attempt:", email);
          const user = await storage.getUserByEmail(email);
          console.log("User found:", !!user);
          if (!user || !user.passwordHash || !(await comparePasswords(password, user.passwordHash))) {
            console.log("Authentication failed");
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
        from: {
          name: 'Summa',
          address: 'no_replay@summapay.ru'
        },
        to: email,
        subject: 'Вход в Summa - Магическая ссылка',
        text: `
Здравствуйте!

Вы запросили вход в систему Summa. Перейдите по ссылке ниже, чтобы войти в свою учетную запись:

${magicLink}

Важно: Эта ссылка действительна в течение 10 минут и может быть использована только один раз.

Если вы не запрашивали этот вход, просто проигнорируйте это письмо.

С уважением,
Команда Summa
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Вход в Summa</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { color: #2563eb; font-size: 24px; font-weight: bold; }
    .content { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .button:hover { background: #1d4ed8; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
    .warning { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; color: #92400e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Summa</div>
      <h1>Вход в систему</h1>
    </div>
    
    <div class="content">
      <p>Здравствуйте!</p>
      <p>Вы запросили вход в систему Summa. Нажмите на кнопку ниже, чтобы войти в свою учетную запись:</p>
      
      <div style="text-align: center;">
        <a href="${magicLink}" class="button">Войти в Summa</a>
      </div>
      
      <div class="warning">
        <strong>Важно:</strong> Эта ссылка действительна в течение 10 минут и может быть использована только один раз.
      </div>
      
      <p>Если вы не запрашивали этот вход, просто проигнорируйте это письмо.</p>
      
      <p>Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:</p>
      <p style="word-break: break-all; color: #2563eb; font-size: 14px;">${magicLink}</p>
    </div>
    
    <div class="footer">
      <p>С уважением,<br>Команда Summa</p>
      <p style="font-size: 12px;">Это автоматическое сообщение, не отвечайте на него.</p>
    </div>
  </div>
</body>
</html>
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
