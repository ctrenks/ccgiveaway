import { NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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

// Detect gibberish/spam content
function isGibberish(text: string): boolean {
  // Check for very short messages (often spam)
  if (text.trim().length < 10) return true;

  // Check for random character strings (like "zyyUmchW")
  // Pattern: mostly consonants, weird capitalization, no spaces in long words
  const words = text.split(/\s+/);
  for (const word of words) {
    // Skip short words
    if (word.length < 6) continue;

    // Count vowels vs consonants
    const vowels = (word.match(/[aeiouAEIOU]/g) || []).length;
    const ratio = vowels / word.length;

    // Normal English words have ~35-40% vowels
    // Random strings often have very few vowels
    if (ratio < 0.15 && word.length > 5) {
      return true;
    }
  }

  // Check for excessive special characters (spam often has weird chars)
  const specialCharRatio = (text.match(/[^a-zA-Z0-9\s.,!?'"()-]/g) || []).length / text.length;
  if (specialCharRatio > 0.2) return true;

  // Check for repeated characters (like "aaaaaaa")
  if (/(.)\1{4,}/i.test(text)) return true;

  return false;
}

// Check if email domain looks suspicious
function isSuspiciousEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;

  // Known disposable email domains (add more as needed)
  const disposableDomains = [
    "tempmail.com", "throwaway.com", "mailinator.com", "guerrillamail.com",
    "10minutemail.com", "temp-mail.org", "fakeinbox.com", "trashmail.com"
  ];

  if (disposableDomains.some(d => domain.includes(d))) return true;

  // Check for gibberish in domain
  const domainName = domain.split(".")[0];
  if (domainName && domainName.length > 10) {
    const vowels = (domainName.match(/[aeiou]/g) || []).length;
    if (vowels / domainName.length < 0.15) return true;
  }

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

    // Check for spam/gibberish content
    const isSpamMessage = isGibberish(message) || isGibberish(name);
    const isSuspiciousSender = isSuspiciousEmail(email);

    if (isSpamMessage) {
      console.log("🚫 Spam detected - gibberish content:", { name, message: message.substring(0, 50) });
      // Return success to not alert the spammer
      return NextResponse.json({ success: true });
    }

    // Check if Resend is configured
    if (!resend) {
      console.error("RESEND_API_KEY is not configured");
      return NextResponse.json(
        { error: "Email service is not configured. Please try again later." },
        { status: 500 }
      );
    }

    const contactEmail = process.env.CONTACT_EMAIL || "contact@collectorcardgiveaway.com";
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Collector Card Giveaway <onboarding@resend.dev>";

    console.log("📧 Contact Form Config:", {
      to: contactEmail,
      from: fromEmail,
      hasResendKey: !!resend,
    });

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: contactEmail,
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
      console.error("Resend error:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 500 }
      );
    }

    console.log("✅ Contact email sent successfully:", data?.id);

    // Send confirmation email to user (skip for suspicious emails to prevent bounces)
    if (isSuspiciousSender) {
      console.log("⚠️ Skipping confirmation email for suspicious sender:", email);
      return NextResponse.json({ success: true });
    }

    const { data: confirmData, error: confirmError } = await resend.emails.send({
      from: fromEmail,
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

    if (confirmError) {
      console.error("⚠️ Confirmation email failed:", JSON.stringify(confirmError, null, 2));
      // Don't fail the whole request - main email was sent
    } else {
      console.log("✅ Confirmation email sent:", confirmData?.id);
    }

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
