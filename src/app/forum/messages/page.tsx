import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatRelativeTime } from "@/lib/forum-utils";

async function getMessages(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [participants, total, unreadCount] = await Promise.all([
    prisma.forumMessageParticipant.findMany({
      where: {
        userId,
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
        message: true,
      },
    }),
    prisma.forumMessageParticipant.count({
      where: {
        userId,
        isDeleted: false,
      },
    }),
    prisma.forumMessageParticipant.count({
      where: {
        userId,
        isDeleted: false,
        isRead: false,
      },
    }),
  ]);

  // Get sender info
  const messages = await Promise.all(
    participants.map(async (p) => {
      const sender = await prisma.user.findUnique({
        where: { id: p.message.senderId },
        select: { id: true, name: true, displayName: true, image: true },
      });
      return {
        id: p.message.id,
        subject: p.message.subject,
        sender,
        createdAt: p.message.createdAt,
        isRead: p.isRead,
        isSentByMe: p.message.senderId === userId,
      };
    })
  );

  return {
    messages,
    total,
    unreadCount,
    totalPages: Math.ceil(total / limit),
  };
}

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function MessagesPage({ searchParams }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr || "1");
  const limit = 20;

  const { messages, total, unreadCount, totalPages } = await getMessages(
    session.user.id,
    page,
    limit
  );

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
          <span className="text-white">Messages</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Private Messages</h1>
            <p className="text-slate-400 mt-1">
              {unreadCount > 0 ? (
                <span className="text-purple-400">{unreadCount} unread</span>
              ) : (
                "No unread messages"
              )}{" "}
              • {total} total
            </p>
          </div>
          <Link
            href="/forum/messages/compose"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all"
          >
            ✉️ Compose
          </Link>
        </div>

        {/* Messages List */}
        {messages.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-white mb-2">No messages yet</h2>
            <p className="text-slate-400 mb-6">
              Start a conversation by composing a new message.
            </p>
            <Link
              href="/forum/messages/compose"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition"
            >
              Compose First Message
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            {messages.map((message, index) => (
              <Link
                key={message.id}
                href={`/forum/messages/${message.id}`}
                className={`block p-4 hover:bg-slate-800/50 transition ${
                  index !== messages.length - 1 ? "border-b border-slate-800" : ""
                } ${!message.isRead ? "bg-purple-500/5" : ""}`}
              >
                <div className="flex items-center gap-4">
                  {/* Unread Indicator */}
                  <div className="w-2">
                    {!message.isRead && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    )}
                  </div>

                  {/* Sender Avatar */}
                  {message.sender?.image ? (
                    <img
                      src={message.sender.image}
                      alt={message.sender.displayName || message.sender.name || "User"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {(message.sender?.displayName || message.sender?.name || "U")[0].toUpperCase()}
                    </div>
                  )}

                  {/* Message Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${!message.isRead ? "text-white" : "text-slate-300"}`}>
                        {message.isSentByMe ? "To: " : ""}
                        {message.sender?.displayName || message.sender?.name || "Unknown"}
                      </span>
                      {message.isSentByMe && (
                        <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                          Sent
                        </span>
                      )}
                    </div>
                    <div className={`truncate ${!message.isRead ? "text-slate-200" : "text-slate-400"}`}>
                      {message.subject}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-sm text-slate-500">
                    {formatRelativeTime(new Date(message.createdAt))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={`/forum/messages?page=${page - 1}`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
              >
                ← Previous
              </Link>
            )}
            <span className="px-4 py-2 text-slate-400">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/forum/messages?page=${page + 1}`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

