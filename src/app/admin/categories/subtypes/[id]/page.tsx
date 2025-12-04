"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EditSubTypePage() {
  const params = useParams();
  const router = useRouter();
  const subTypeId = params.id as string;

  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/subtypes/${subTypeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.subType) {
          setName(data.subType.name || "");
        }
      })
      .catch(() => setError("Failed to load subtype"))
      .finally(() => setIsLoading(false));
  }, [subTypeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/subtypes/${subTypeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        router.push("/admin/categories");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update subtype");
      }
    } catch {
      setError("Failed to update subtype");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this subtype? Products using this subtype will have it removed.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/subtypes/${subTypeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/categories");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete subtype");
      }
    } catch {
      setError("Failed to delete subtype");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/categories" className="text-slate-400 hover:text-white">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-white">Edit SubType</h1>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white rounded-lg"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              SubType Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-lg"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

