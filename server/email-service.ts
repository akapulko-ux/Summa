import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email service configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true, // SSL/TLS
  auth: {
    user: 'no_replay@summapay.ru',
    pass: 'cOvr83FSVrdYyDCsrLq9'
  }
});

// Secret for signing magic link tokens
const MAGIC_LINK_SECRET = process.env.MAGIC_LINK_SECRET || 'default-magic-link-secret-key';
const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds

export interface MagicLinkToken {
  email: string;
  timestamp: number;
  signature: string;
}

export function generateMagicLinkToken(email: string): string {
  const timestamp = Date.now();
  const data = `${email}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', MAGIC_LINK_SECRET)
    .update(data)
    .digest('hex');
  
  const token = Buffer.from(JSON.stringify({
    email,
    timestamp,
    signature
  })).toString('base64url');
  
  return token;
}

export function verifyMagicLinkToken(token: string): { valid: boolean; email?: string; error?: string } {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString());
    const { email, timestamp, signature } = decoded as MagicLinkToken;
    
    // Check if token is expired
    if (Date.now() - timestamp > MAGIC_LINK_EXPIRY) {
      return { valid: false, error: 'Token expired' };
    }
    
    // Verify signature
    const data = `${email}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', MAGIC_LINK_SECRET)
      .update(data)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    return { valid: true, email };
  } catch (error) {
    return { valid: false, error: 'Invalid token format' };
  }
}

export async function sendMagicLink(email: string, baseUrl: string): Promise<void> {
  const token = generateMagicLinkToken(email);
  const magicLink = `${baseUrl}/auth?token=${token}`;
  
  const htmlTemplate = `
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
            <strong>Важно:</strong> Эта ссылка действительна в течение 15 минут и может быть использована только один раз.
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
  `;

  const mailOptions = {
    from: {
      name: 'Summa',
      address: 'no_replay@summapay.ru'
    },
    to: email,
    subject: 'Вход в Summa - Магическая ссылка',
    html: htmlTemplate,
    text: `
Здравствуйте!

Вы запросили вход в систему Summa. Перейдите по ссылке ниже, чтобы войти в свою учетную запись:

${magicLink}

Важно: Эта ссылка действительна в течение 15 минут и может быть использована только один раз.

Если вы не запрашивали этот вход, просто проигнорируйте это письмо.

С уважением,
Команда Summa
    `.trim()
  };

  await transporter.sendMail(mailOptions);
}

// Send system notification email
export async function sendNotificationEmail(
  email: string, 
  subject: string, 
  message: string,
  userName?: string
): Promise<boolean> {
  try {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { color: #2563eb; font-size: 24px; font-weight: bold; }
          .content { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .message { white-space: pre-line; font-size: 16px; line-height: 1.5; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Summa</div>
            <h1>${subject}</h1>
          </div>
          
          <div class="content">
            ${userName ? `<p>Здравствуйте, ${userName}!</p>` : '<p>Здравствуйте!</p>'}
            <div class="message">${message}</div>
          </div>
          
          <div class="footer">
            <p>С уважением,<br>Команда Summa</p>
            <p style="font-size: 12px;">Это автоматическое сообщение, не отвечайте на него.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: {
        name: 'Summa',
        address: 'no_replay@summapay.ru'
      },
      to: email,
      subject: subject,
      html: htmlTemplate,
      text: `
${userName ? `Здравствуйте, ${userName}!` : 'Здравствуйте!'}

${message}

С уважением,
Команда Summa
      `.trim()
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}

// Test email configuration
export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}