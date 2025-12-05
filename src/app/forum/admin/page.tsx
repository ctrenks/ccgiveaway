"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ROLES } from "@/lib/constants";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  _count: { topics: number };
}

export default function ForumAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New category form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit category
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editOrder, setEditOrder] = useState(0);
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (
      status === "authenticated" &&
      session?.user?.role !== ROLES.ADMIN &&
      session?.user?.role !== ROLES.MODERATOR
    ) {
      router.push("/forum");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/forum/admin/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/forum/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
          icon: newIcon.trim() || null,
          displayOrder: categories.length,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }

      setNewName("");
      setNewDescription("");
      setNewIcon("");
      setShowNewForm(false);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/forum/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          icon: editIcon.trim() || null,
          displayOrder: editOrder,
          isActive: editActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update category");
      }

      setEditingId(null);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`/api/forum/admin/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category");
      }

      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
    setEditIcon(cat.icon || "");
    setEditOrder(cat.displayOrder);
    setEditActive(cat.isActive);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

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
          <span className="text-white">Admin</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Forum Admin</h1>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition"
          >
            {showNewForm ? "Cancel" : "+ New Category"}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* New Category Form */}
        {showNewForm && (
          <div className="mb-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Create New Category</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Icon (emoji)
                </label>
                <input
                  type="text"
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  placeholder="💬"
                  className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-2xl text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="Category name"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50 transition"
              >
                {isSubmitting ? "Creating..." : "Create Category"}
              </button>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-800/50">
            <h2 className="text-lg font-semibold text-white">Categories</h2>
          </div>

          {categories.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No categories yet. Create one to get started!
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4">
                  {editingId === cat.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Icon</label>
                          <input
                            type="text"
                            value={editIcon}
                            onChange={(e) => setEditIcon(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Order</label>
                          <input
                            type="number"
                            value={editOrder}
                            onChange={(e) => setEditOrder(parseInt(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Description</label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1 text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`active-${cat.id}`}
                          checked={editActive}
                          onChange={(e) => setEditActive(e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor={`active-${cat.id}`} className="text-sm text-slate-300">
                          Active
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(cat.id)}
                          disabled={isSubmitting}
                          className="px-4 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon || "📁"}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{cat.name}</span>
                            {!cat.isActive && (
                              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          {cat.description && (
                            <p className="text-sm text-slate-400">{cat.description}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            {cat._count.topics} topics • Order: {cat.displayOrder}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(cat)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={cat._count.topics > 0}
                          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title={cat._count.topics > 0 ? "Cannot delete category with topics" : "Delete category"}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

