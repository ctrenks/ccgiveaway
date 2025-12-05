import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Unsubscribe from topic notifications via token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const follower = await prisma.forumTopicFollower.findUnique({
      where: { unsubscribeToken: token },
      include: {
        topic: {
          select: { title: true },
        },
      },
    });

    if (!follower) {
      return new NextResponse(
        `
<!DOCTYPE html>
<html>
<head>
  <title>Invalid Link</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0; }
    .container { text-align: center; padding: 2rem; }
    h1 { color: #ef4444; }
    a { color: #8b5cf6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Invalid Unsubscribe Link</h1>
    <p>This unsubscribe link is invalid or has expired.</p>
    <p><a href="/">Go to homepage</a></p>
  </div>
</body>
</html>
        `,
        {
          status: 400,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Disable email notifications for this topic
    await prisma.forumTopicFollower.update({
      where: { id: follower.id },
      data: { emailNotifications: false },
    });

    const topicTitle = follower.topic?.title || "the topic";

    return new NextResponse(
      `
<!DOCTYPE html>
<html>
<head>
  <title>Unsubscribed Successfully</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0; }
    .container { text-align: center; padding: 2rem; max-width: 500px; }
    h1 { color: #22c55e; }
    p { color: #94a3b8; }
    a { color: #8b5cf6; }
    .topic { color: #a78bfa; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✅ Unsubscribed Successfully</h1>
    <p>You will no longer receive email notifications for:</p>
    <p class="topic">"${topicTitle}"</p>
    <p>You can still view the topic and re-enable notifications from your forum settings.</p>
    <p><a href="/forum">Back to Forum</a> | <a href="/">Go to homepage</a></p>
  </div>
</body>
</html>
      `,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return new NextResponse(
      `
<!DOCTYPE html>
<html>
<head>
  <title>Error</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0; }
    .container { text-align: center; padding: 2rem; }
    h1 { color: #ef4444; }
    a { color: #8b5cf6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Something went wrong</h1>
    <p>We couldn't process your unsubscribe request. Please try again later.</p>
    <p><a href="/">Go to homepage</a></p>
  </div>
</body>
</html>
      `,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}

