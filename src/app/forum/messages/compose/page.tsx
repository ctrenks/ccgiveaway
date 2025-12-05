"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface User {
  id: string;
  name: string | null;
  displayName: string | null;
  image: string | null;
}

function ComposeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const toUserId = searchParams.get("to");

  const [recipient, setRecipient] = useState<User | null>(null);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Load recipient if ID provided
  useEffect(() => {
    async function loadRecipient() {
      if (toUserId) {
        try {
          const res = await fetch(`/api/forum/users?id=${toUserId}`);
          const data = await res.json();
          if (data.user) {
            setRecipient(data.user);
          }
        } catch (err) {
          console.error("Failed to load recipient:", err);
        }
      }
    }
    loadRecipient();
  }, [toUserId]);

  // Search users
  useEffect(() => {
    async function searchUsers() {
      if (recipientSearch.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const res = await fetch(`/api/forum/users?search=${encodeURIComponent(recipientSearch)}`);
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch (err) {
        console.error("Failed to search users:", err);
      }
    }

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [recipientSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipient || !subject.trim() || !content.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/forum/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: recipient.id,
          subject: subject.trim(),
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      router.push("/forum/messages");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-slate-400 mb-6">
            You need to be signed in to send messages.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <span className="text-white">Compose</span>
        </nav>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8">
          <h1 className="text-2xl font-bold text-white mb-6">Compose Message</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                To *
              </label>
              {recipient ? (
                <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                  {recipient.image ? (
                    <img
                      src={recipient.image}
                      alt={recipient.displayName || recipient.name || "User"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {(recipient.displayName || recipient.name || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-white">
                    {recipient.displayName || recipient.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRecipient(null)}
                    className="ml-auto text-slate-400 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={recipientSearch}
                    onChange={(e) => {
                      setRecipientSearch(e.target.value);
                      setShowSearch(true);
                    }}
                    onFocus={() => setShowSearch(true)}
                    placeholder="Search for a user..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  {showSearch && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setRecipient(user);
                            setRecipientSearch("");
                            setShowSearch(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-slate-700 transition text-left"
                        >
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.displayName || user.name || "User"}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                              {(user.displayName || user.name || "U")[0].toUpperCase()}
                            </div>
                          )}
                          <span className="text-white">
                            {user.displayName || user.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                maxLength={200}
                placeholder="Enter message subject"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Message *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={8}
                placeholder="Write your message here..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Link
                href="/forum/messages"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !recipient}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <ComposeContent />
    </Suspense>
  );
}

