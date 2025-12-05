"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReplyFormProps {
  recipientId: string;
  recipientName: string;
}

export default function ReplyForm({ recipientId, recipientName }: ReplyFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/forum/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          subject: `Re: Reply`,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reply");
      }

      setContent("");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <div className="mt-6">
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all"
        >
          ✉️ Quick Reply
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Reply to {recipientName}
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Write your reply..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50 transition"
          >
            {isSubmitting ? "Sending..." : "Send Reply"}
          </button>
        </div>
      </form>
    </div>
  );
}

