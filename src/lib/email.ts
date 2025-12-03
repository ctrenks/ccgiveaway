import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { SendVerificationRequestParams } from "next-auth/providers/email";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Create nodemailer transporter as fallback
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationRequest({
  identifier: email,
  url,
  provider: { from },
}: SendVerificationRequestParams) {
  const { host } = new URL(url);

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign in to Collector Care Giveaway</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f0f; margin: 0; padding: 40px 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">✨ Collector Care Giveaway</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Your Gateway to Rare Cards</p>
          </div>
          <div style="padding: 40px 30px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 22px;">Sign in to your account</h2>
            <p style="color: #a0a0a0; margin: 0 0 30px 0; line-height: 1.6;">
              Click the magic button below to securely sign in to your account. This link will expire in 24 hours.
            </p>
            <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 30px -10px rgba(102, 126, 234, 0.5);">
              🔮 Sign In Now
            </a>
            <p style="color: #666; margin: 30px 0 0 0; font-size: 12px;">
              If you didn't request this email, you can safely ignore it.
            </p>
          </div>
          <div style="background: rgba(0,0,0,0.2); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
            <p style="color: #666; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} Collector Care Giveaway • ${host}
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const emailText = `Sign in to Collector Care Giveaway\n\nClick here to sign in: ${url}\n\nIf you didn't request this email, you can safely ignore it.`;

  // Try Resend first, fall back to nodemailer
  if (resend) {
    await resend.emails.send({
      from: from || "Collector Care Giveaway <noreply@collectorcaredgiveaway.com>",
      to: email,
      subject: `🔮 Sign in to Collector Care Giveaway`,
      html: emailHtml,
      text: emailText,
    });
  } else {
    await transporter.sendMail({
      from: from || process.env.EMAIL_FROM,
      to: email,
      subject: `🔮 Sign in to Collector Care Giveaway`,
      html: emailHtml,
      text: emailText,
    });
  }
}

// Utility function for sending general emails
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const from = process.env.EMAIL_FROM || "Collector Care Giveaway <noreply@collectorcaredgiveaway.com>";

  if (resend) {
    return await resend.emails.send({ from, to, subject, html, text });
  } else {
    return await transporter.sendMail({ from, to, subject, html, text });
  }
}
