import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const SITE_URL =
  process.env.NEXTAUTH_URL || "https://collectorcardgiveaway.com";
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "Collector Card Giveaway <onboarding@resend.dev>";

interface SendPMNotificationParams {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  messageSubject: string;
  messageId: string;
}

interface SendTopicReplyNotificationParams {
  recipientEmail: string;
  recipientName: string;
  replierName: string;
  topicTitle: string;
  topicSlug: string;
  replyContent: string;
  unsubscribeToken: string;
}

export async function sendPMNotification({
  recipientEmail,
  recipientName,
  senderName,
  messageSubject,
  messageId,
}: SendPMNotificationParams) {
  if (!resend) {
    console.warn("Resend not configured, skipping PM notification email");
    return;
  }

  const messageUrl = `${SITE_URL}/forum/messages/${messageId}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📬 New Private Message</h1>
  </div>

  <div style="background: #1E293B; padding: 30px; border: 1px solid #334155; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; margin-bottom: 20px; color: #E2E8F0;">Hi ${recipientName},</p>

    <p style="font-size: 16px; margin-bottom: 20px; color: #CBD5E1;">
      <strong style="color: #A78BFA;">${senderName}</strong> sent you a private message:
    </p>

    <div style="background: #0F172A; border-left: 4px solid #8B5CF6; padding: 20px; margin: 20px 0; border-radius: 5px;">
      <p style="font-weight: bold; color: #A78BFA; margin: 0 0 10px 0;">Subject:</p>
      <p style="font-size: 16px; margin: 0; color: #E2E8F0;">${messageSubject}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${messageUrl}" style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px;">
        📖 Read Message
      </a>
    </div>

    <p style="font-size: 14px; color: #64748B; margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155;">
      You received this email because you have an account on Collector Card Giveaway.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #64748B; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Collector Card Giveaway. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `New Private Message from ${senderName}`,
      html,
    });
    console.log(`PM notification sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending PM notification:", error);
  }
}

export async function sendTopicReplyNotification({
  recipientEmail,
  recipientName,
  replierName,
  topicTitle,
  topicSlug,
  replyContent,
  unsubscribeToken,
}: SendTopicReplyNotificationParams) {
  if (!resend) {
    console.warn(
      "Resend not configured, skipping topic reply notification email"
    );
    return;
  }

  const topicUrl = `${SITE_URL}/forum/topic/${topicSlug}`;
  const unsubscribeUrl = `${SITE_URL}/api/forum/unsubscribe/${unsubscribeToken}`;

  // Strip HTML tags and truncate reply content for preview
  const plainReply = replyContent.replace(/<[^>]*>/g, "").substring(0, 200);
  const replyPreview =
    plainReply.length === 200 ? `${plainReply}...` : plainReply;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">💬 New Reply in Topic</h1>
  </div>

  <div style="background: #1E293B; padding: 30px; border: 1px solid #334155; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; margin-bottom: 20px; color: #E2E8F0;">Hi ${recipientName},</p>

    <p style="font-size: 16px; margin-bottom: 20px; color: #CBD5E1;">
      <strong style="color: #A78BFA;">${replierName}</strong> replied to a topic you're following:
    </p>

    <div style="background: #0F172A; border-left: 4px solid #8B5CF6; padding: 20px; margin: 20px 0; border-radius: 5px;">
      <p style="font-weight: bold; color: #A78BFA; margin: 0 0 10px 0;">Topic:</p>
      <p style="font-size: 18px; margin: 0 0 15px 0; font-weight: bold; color: #E2E8F0;">${topicTitle}</p>

      <p style="font-weight: bold; color: #A78BFA; margin: 15px 0 10px 0;">Reply Preview:</p>
      <p style="font-size: 14px; color: #94A3B8; margin: 0; font-style: italic;">${replyPreview}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${topicUrl}" style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px;">
        📖 Read Full Reply
      </a>
    </div>

    <p style="font-size: 14px; color: #64748B; margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155;">
      You're receiving this because you're following this topic.
      <a href="${unsubscribeUrl}" style="color: #EF4444; text-decoration: underline;">Unsubscribe from this topic</a>
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #64748B; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Collector Card Giveaway. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `New reply in "${topicTitle}"`,
      html,
    });
    console.log(`Topic reply notification sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending topic reply notification:", error);
  }
}

