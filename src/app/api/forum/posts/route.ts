import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTopicReplyNotification } from "@/lib/forum-email";
import { createTopicReplyNotification } from "@/lib/notifications";
import { ROLES } from "@/lib/constants";

// POST - Create new post (reply to topic)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is banned
    if (session.user.role === ROLES.BANNED) {
      return NextResponse.json(
        { error: "Your account is restricted from posting" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { topicId, content } = body;

    if (!topicId || !content) {
      return NextResponse.json(
        { error: "Topic ID and content are required" },
        { status: 400 }
      );
    }

    // Verify topic exists and is not locked
    const topic = await prisma.forumTopic.findUnique({
      where: { id: topicId },
      include: {
        followers: {
          where: {
            emailNotifications: true,
            NOT: {
              userId: session.user.id, // Don't notify the person posting
            },
          },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    if (topic.isLocked) {
      return NextResponse.json({ error: "Topic is locked" }, { status: 403 });
    }

    // Create post and update topic in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create post
      const post = await tx.forumPost.create({
        data: {
          topicId,
          authorId: session.user.id,
          content,
        },
        include: {
          attachments: true,
        },
      });

      // Update topic reply count and last reply info
      await tx.forumTopic.update({
        where: { id: topicId },
        data: {
          replyCount: { increment: 1 },
          lastReplyAt: new Date(),
          lastReplyUserId: session.user.id,
        },
      });

      // Auto-follow the topic for the replier (if not already following)
      await tx.forumTopicFollower.upsert({
        where: {
          topicId_userId: {
            topicId,
            userId: session.user.id,
          },
        },
        create: {
          topicId,
          userId: session.user.id,
          emailNotifications: true,
        },
        update: {}, // Do nothing if already following
      });

      return post;
    });

    // Get author for response
    const author = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, displayName: true, image: true, role: true },
    });

    // Send notifications to followers (asynchronously)
    const replierName = session.user.name || "A forum user";

    for (const follower of topic.followers) {
      try {
        // Get follower details
        const user = await prisma.user.findUnique({
          where: { id: follower.userId },
          select: { id: true, name: true, email: true },
        });

        if (user?.email) {
          // Send email notification
          await sendTopicReplyNotification({
            recipientEmail: user.email,
            recipientName: user.name || "Forum User",
            replierName,
            topicTitle: topic.title,
            topicSlug: topic.slug,
            replyContent: content,
            unsubscribeToken: follower.unsubscribeToken,
          });

          // Create in-app notification
          await createTopicReplyNotification(
            follower.userId,
            replierName,
            topic.title,
            topic.slug
          );
        }
      } catch (error) {
        console.error(
          `Failed to send topic reply notification to follower ${follower.userId}:`,
          error
        );
      }
    }

    return NextResponse.json({ post: { ...result, author } }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
