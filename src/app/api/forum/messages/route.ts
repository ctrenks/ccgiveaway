import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPMNotification } from "@/lib/forum-email";
import { createPMNotification } from "@/lib/notifications";
import { ROLES } from "@/lib/constants";

// GET - Get user's messages (inbox)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Get messages where user is a participant
    const [participants, total] = await Promise.all([
      prisma.forumMessageParticipant.findMany({
        where: {
          userId: session.user.id,
          isDeleted: false,
        },
        orderBy: {
          message: {
            createdAt: "desc",
          },
        },
        skip,
        take: limit,
        include: {
          message: {
            include: {
              participants: {
                include: {
                  // We'll get user info separately
                },
              },
            },
          },
        },
      }),
      prisma.forumMessageParticipant.count({
        where: {
          userId: session.user.id,
          isDeleted: false,
        },
      }),
    ]);

    // Get full message details with sender info
    const messages = await Promise.all(
      participants.map(async (p) => {
        const sender = await prisma.user.findUnique({
          where: { id: p.message.senderId },
          select: { id: true, name: true, displayName: true, image: true },
        });
        return {
          id: p.message.id,
          subject: p.message.subject,
          senderId: p.message.senderId,
          sender,
          createdAt: p.message.createdAt,
          isRead: p.isRead,
          readAt: p.readAt,
        };
      })
    );

    // Count unread
    const unreadCount = await prisma.forumMessageParticipant.count({
      where: {
        userId: session.user.id,
        isDeleted: false,
        isRead: false,
      },
    });

    return NextResponse.json({
      messages,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Send new message
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is banned
    if (session.user.role === ROLES.BANNED) {
      return NextResponse.json(
        { error: "Your account is restricted from sending messages" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { recipientId, subject, content } = body;

    if (!recipientId || !subject || !content) {
      return NextResponse.json(
        { error: "Recipient, subject, and content are required" },
        { status: 400 }
      );
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, email: true },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Can't send to yourself
    if (recipientId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot send a message to yourself" },
        { status: 400 }
      );
    }

    // Create message with participants
    const message = await prisma.forumPrivateMessage.create({
      data: {
        senderId: session.user.id,
        subject,
        content,
        participants: {
          create: [
            {
              userId: session.user.id,
              isRead: true, // Sender has "read" it
              readAt: new Date(),
            },
            {
              userId: recipientId,
              isRead: false,
            },
          ],
        },
      },
    });

    // Send notifications
    const senderName = session.user.name || "A user";

    try {
      // Email notification
      if (recipient.email) {
        await sendPMNotification({
          recipientEmail: recipient.email,
          recipientName: recipient.name || "User",
          senderName,
          messageSubject: subject,
          messageId: message.id,
        });
      }

      // In-app notification
      await createPMNotification(recipientId, senderName, message.id, subject);
    } catch (error) {
      console.error("Failed to send PM notification:", error);
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

