import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single message
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is a participant
    const participant = await prisma.forumMessageParticipant.findUnique({
      where: {
        messageId_userId: {
          messageId: id,
          userId: session.user.id,
        },
      },
      include: {
        message: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!participant || participant.isDeleted) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Mark as read if not already
    if (!participant.isRead) {
      await prisma.forumMessageParticipant.update({
        where: { id: participant.id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: participant.message.senderId },
      select: { id: true, name: true, displayName: true, image: true },
    });

    // Get all participants info
    const participantsWithUsers = await Promise.all(
      participant.message.participants.map(async (p) => {
        const user = await prisma.user.findUnique({
          where: { id: p.userId },
          select: { id: true, name: true, displayName: true, image: true },
        });
        return { ...p, user };
      })
    );

    return NextResponse.json({
      message: {
        ...participant.message,
        sender,
        participants: participantsWithUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete message (for this user only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const participant = await prisma.forumMessageParticipant.findUnique({
      where: {
        messageId_userId: {
          messageId: id,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Soft delete for this user
    await prisma.forumMessageParticipant.update({
      where: { id: participant.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}

