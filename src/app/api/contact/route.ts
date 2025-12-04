import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple rate limiting - store IPs and timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5; // Max 5 requests per hour per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];
  
  // Filter out old requests
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return true;
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  return false;
}

export async function POST(request: Request) {
  try {
    // Get IP for rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0] || "unknown";
    
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Validate lengths
    if (name.length > 100) {
      return NextResponse.json(
        { error: "Name is too long" },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    // Send email using Resend
    const { error } = await resend.emails.send({
      from: "Collector Card Giveaway <noreply@collectorcardgiveaway.com>",
      to: process.env.CONTACT_EMAIL || "contact@collectorcardgiveaway.com",
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">New Contact Form Submission</h2>
          
          <div style="background-color: #1E293B; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #94A3B8;"><strong style="color: #E2E8F0;">From:</strong> ${escapeHtml(name)}</p>
            <p style="margin: 0 0 10px 0; color: #94A3B8;"><strong style="color: #E2E8F0;">Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color: #8B5CF6;">${escapeHtml(email)}</a></p>
            <p style="margin: 0; color: #94A3B8;"><strong style="color: #E2E8F0;">Subject:</strong> ${escapeHtml(subject)}</p>
          </div>
          
          <div style="background-color: #0F172A; padding: 20px; border-radius: 8px; border: 1px solid #334155;">
            <h3 style="color: #E2E8F0; margin-top: 0;">Message:</h3>
            <p style="color: #CBD5E1; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
          </div>
          
          <p style="color: #64748B; font-size: 12px; margin-top: 20px;">
            This message was sent from the contact form on collectorcardgiveaway.com
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 500 }
      );
    }

    // Send confirmation email to user
    await resend.emails.send({
      from: "Collector Card Giveaway <noreply@collectorcardgiveaway.com>",
      to: email,
      subject: "We received your message!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Thanks for contacting us, ${escapeHtml(name)}!</h2>
          
          <p style="color: #CBD5E1; line-height: 1.6;">
            We've received your message and will get back to you within 24-48 hours.
          </p>
          
          <div style="background-color: #1E293B; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #94A3B8;"><strong style="color: #E2E8F0;">Subject:</strong> ${escapeHtml(subject)}</p>
            <p style="margin: 0; color: #94A3B8;"><strong style="color: #E2E8F0;">Your message:</strong></p>
            <p style="color: #CBD5E1; white-space: pre-wrap; margin-top: 10px;">${escapeHtml(message)}</p>
          </div>
          
          <p style="color: #CBD5E1; line-height: 1.6;">
            In the meantime, feel free to browse our <a href="https://collectorcardgiveaway.com/store" style="color: #8B5CF6;">store</a> 
            or check out our <a href="https://collectorcardgiveaway.com/giveaways" style="color: #8B5CF6;">giveaways</a>!
          </p>
          
          <p style="color: #64748B; font-size: 12px; margin-top: 30px;">
            This is an automated confirmation. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// Helper to escape HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

