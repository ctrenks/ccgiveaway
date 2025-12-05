"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatRelativeTime, isForumAdmin, isSuperAdmin } from "@/lib/forum-utils";
import { ROLES } from "@/lib/constants";

interface Author {
  id: string;
  name: string | null;
  displayName: string | null;
  image: string | null;
  role: number;
}

interface Post {
  id: string;
  content: string;
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
  author: Author | null;
  authorId: string;
  attachments: Array<{
    id: string;
    url: string;
    filename: string;
    mimeType: string;
  }>;
}

interface Topic {
  id: string;
  title: string;
  slug: string;
  isPinned: boolean;
  isLocked: boolean;
  authorId: string;
  author: Author | null;
}

interface TopicViewProps {
  topic: Topic;
  posts: Post[];
  pagination: { page: number; total: number; totalPages: number };
  session: { user?: { id: string; role?: number; name?: string | null } } | null;
}

export default function TopicView({
  topic,
  posts,
  pagination,
  session,
}: TopicViewProps) {
  const router = useRouter();
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState("");

  const userRole = session?.user?.role ?? 0;
  const isAdmin = isForumAdmin(userRole);
  const canPost = session?.user && userRole !== ROLES.BANNED;

  const handleTogglePin = async () => {
    try {
      const response = await fetch(`/api/forum/topics/${topic.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !topic.isPinned }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to toggle pin");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle pin");
    }
  };

  const handleToggleLock = async () => {
    try {
      const response = await fetch(`/api/forum/topics/${topic.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: !topic.isLocked }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to toggle lock");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle lock");
    }
  };

  const handleEditPost = async (postId: string) => {
    if (!editContent.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update post");
      }

      setEditingPostId(null);
      setEditContent("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete post");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyContent.trim()) {
      setError("Please enter a reply");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topic.id,
          content: replyContent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to post reply");
      }

      setReplyContent("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* Admin Controls */}
      {isAdmin && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <h3 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
            ⚙️ Admin Controls
          </h3>
          <div className="flex gap-3">
            <button
              onClick={handleTogglePin}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                topic.isPinned
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-slate-800 text-amber-400 border border-amber-500/30 hover:bg-slate-700"
              }`}
            >
              {topic.isPinned ? "📌 Unpin Topic" : "📌 Pin Topic"}
            </button>
            <button
              onClick={handleToggleLock}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                topic.isLocked
                  ? "bg-slate-600 text-white hover:bg-slate-500"
                  : "bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700"
              }`}
            >
              {topic.isLocked ? "🔓 Unlock Topic" : "🔒 Lock Topic"}
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden"
          >
            <div className="flex flex-col md:flex-row">
              {/* Author Info */}
              <div className="md:w-48 bg-slate-800/50 p-4 border-b md:border-b-0 md:border-r border-slate-700">
                <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-2">
                  {post.author?.image ? (
                    <Image
                      src={post.author.image}
                      alt={post.author.displayName || post.author.name || "User"}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                      {(post.author?.displayName || post.author?.name || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-white">
                      {post.author?.displayName || post.author?.name || "Anonymous"}
                    </div>
                    {post.author?.role === ROLES.ADMIN && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded mt-1 inline-block">
                        Admin
                      </span>
                    )}
                    {post.author?.role === ROLES.MODERATOR && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded mt-1 inline-block">
                        Moderator
                      </span>
                    )}
                  </div>
                </div>
                {session?.user && session.user.id !== post.authorId && (
                  <Link
                    href={`/forum/messages/compose?to=${post.authorId}`}
                    className="mt-3 text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-500 transition block text-center"
                  >
                    📧 Send PM
                  </Link>
                )}
              </div>

              {/* Post Content */}
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-sm text-slate-500">
                    {formatRelativeTime(new Date(post.createdAt))}
                    {post.isEdited && (
                      <span className="ml-2 text-xs text-slate-600">(edited)</span>
                    )}
                  </div>
                  {session?.user &&
                    (session.user.id === post.authorId || isAdmin) && (
                      <div className="flex gap-2">
                        <button
                          className="text-xs text-purple-400 hover:text-purple-300"
                          onClick={() => {
                            setEditingPostId(post.id);
                            setEditContent(post.content);
                          }}
                        >
                          Edit
                        </button>
                        {index !== 0 && (
                          <button
                            className="text-xs text-red-400 hover:text-red-300"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                </div>

                {editingPostId === post.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                      rows={8}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPost(post.id)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition text-sm font-semibold"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setEditingPostId(null);
                          setEditContent("");
                        }}
                        className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition text-sm font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                )}

                {/* Attachments */}
                {post.attachments && post.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {post.attachments.map((attachment) => (
                      <div key={attachment.id}>
                        {attachment.mimeType.startsWith("image/") ? (
                          <img
                            src={attachment.url}
                            alt={attachment.filename}
                            className="max-w-full rounded-lg"
                            style={{ maxHeight: "400px" }}
                          />
                        ) : (
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:underline"
                          >
                            📎 {attachment.filename}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Form */}
      {session?.user ? (
        topic.isLocked ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p className="text-amber-400">
              🔒 This topic is locked and cannot accept new replies.
            </p>
          </div>
        ) : userRole === ROLES.BANNED ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400">
              Your account is restricted from posting in the forum.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Post a Reply</h3>
            <form onSubmit={handleReply}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                rows={6}
                placeholder="Write your reply here..."
                disabled={isSubmitting}
              />
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-slate-500">
                  You can use basic HTML formatting
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? "Posting..." : "Post Reply"}
                </button>
              </div>
            </form>
          </div>
        )
      ) : (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-blue-300">
            <Link href="/auth/signin" className="font-semibold underline hover:text-blue-200">
              Sign in
            </Link>{" "}
            to reply to this topic.
          </p>
        </div>
      )}
    </div>
  );
}

