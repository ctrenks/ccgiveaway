"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

function NewTopicContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const preselectedCategory = searchParams.get("category");

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState(preselectedCategory || "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/forum/categories");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    }
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId || !title.trim() || !content.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/forum/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          title: title.trim(),
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create topic");
      }

      router.push(`/forum/topic/${data.topic.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create topic");
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
            You need to be signed in to create a new topic.
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
          <span className="text-white">New Topic</span>
        </nav>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8">
          <h1 className="text-2xl font-bold text-white mb-6">Create New Topic</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Topic Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                placeholder="Enter a descriptive title for your topic"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                {title.length}/200 characters
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Content *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={10}
                placeholder="Write your topic content here..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                You can use basic HTML formatting for links, bold, italic, etc.
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Link
                href="/forum"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? "Creating..." : "Create Topic"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewTopicPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <NewTopicContent />
    </Suspense>
  );
}

