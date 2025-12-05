import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { formatRelativeTime } from "@/lib/forum-utils";
import ReplyForm from "./ReplyForm";

interface Props {
  params: Promise<{ id: string }>;
}

async function getMessage(messageId: string, userId: string) {
  // Check if user is a participant
  const participant = await prisma.forumMessageParticipant.findUnique({
    where: {
      messageId_userId: {
        messageId,
        userId,
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
    return null;
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

  // Get recipient info (other participant)
  const otherParticipant = participant.message.participants.find(
    (p) => p.userId !== userId
  );
  const recipient = otherParticipant
    ? await prisma.user.findUnique({
        where: { id: otherParticipant.userId },
        select: { id: true, name: true, displayName: true, image: true },
      })
    : null;

  return {
    ...participant.message,
    sender,
    recipient,
    isSentByMe: participant.message.senderId === userId,
  };
}

export default async function ViewMessagePage({ params }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { id } = await params;
  const message = await getMessage(id, session.user.id);

  if (!message) {
    notFound();
  }

  const otherUser = message.isSentByMe ? message.recipient : message.sender;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-purple-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/forum" className="hover:text-purple-400 transition-colors">
            Forum
          </Link>
          <span>/</span>
          <Link href="/forum/messages" className="hover:text-purple-400 transition-colors">
            Messages
          </Link>
          <span>/</span>
          <span className="text-white truncate max-w-xs">{message.subject}</span>
        </nav>

        {/* Message */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-2xl font-bold text-white mb-4">{message.subject}</h1>
            <div className="flex items-center gap-4">
              {otherUser?.image ? (
                <img
                  src={otherUser.image}
                  alt={otherUser.displayName || otherUser.name || "User"}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold">
                  {(otherUser?.displayName || otherUser?.name || "U")[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-slate-300">
                  {message.isSentByMe ? "To: " : "From: "}
                  <span className="text-white font-medium">
                    {otherUser?.displayName || otherUser?.name || "Unknown"}
                  </span>
                </div>
                <div className="text-sm text-slate-500">
                  {formatRelativeTime(new Date(message.createdAt))}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: message.content }}
            />
          </div>
        </div>

        {/* Reply Form */}
        {otherUser && !message.isSentByMe && (
          <ReplyForm recipientId={otherUser.id} recipientName={otherUser.displayName || otherUser.name || "User"} />
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/forum/messages"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            ← Back to Messages
          </Link>
          {otherUser && (
            <Link
              href={`/forum/messages/compose?to=${otherUser.id}`}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition"
            >
              Reply
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

