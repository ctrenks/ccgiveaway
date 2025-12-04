"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewGiveawayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    slotCount: 36,
    minParticipation: 10000,
    freeEntriesPerUser: 10,
    prizeValue: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Upload image if provided
      let imageUrl = null;
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }
      }

      // Create giveaway
      const res = await fetch("/api/admin/giveaways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          image: imageUrl,
          prizeValue: formData.prizeValue ? parseFloat(formData.prizeValue) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create giveaway");
      }

      router.push("/admin/giveaways");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create giveaway");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/giveaways"
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-white">Create Giveaway</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Ikoria Booster Box"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Describe what winners will receive..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Box Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Number of Slots *
              </label>
              <input
                type="number"
                value={formData.slotCount}
                onChange={(e) =>
                  setFormData({ ...formData, slotCount: parseInt(e.target.value) || 36 })
                }
                min={1}
                max={100}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Usually 36 for booster box
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Minimum Picks to Draw *
              </label>
              <input
                type="number"
                value={formData.minParticipation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minParticipation: parseInt(e.target.value) || 10000,
                  })
                }
                min={100}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Draw scheduled when reached
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Free Entries Per User
              </label>
              <input
                type="number"
                value={formData.freeEntriesPerUser}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    freeEntriesPerUser: parseInt(e.target.value) || 10,
                  })
                }
                min={0}
                max={100}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Prize Value ($)
              </label>
              <input
                type="number"
                value={formData.prizeValue}
                onChange={(e) =>
                  setFormData({ ...formData, prizeValue: e.target.value })
                }
                step="0.01"
                min={0}
                placeholder="Optional"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Creating..." : "Create Giveaway"}
          </button>
          <Link
            href="/admin/giveaways"
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
