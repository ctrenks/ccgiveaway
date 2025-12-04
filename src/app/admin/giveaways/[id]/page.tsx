"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  slotCount: number;
  hasBoxTopper: boolean;
  minParticipation: number;
  freeEntriesPerUser: number;
  creditCostPerPick: number;
  status: string;
  totalPicks: number;
  prizeValue: string | null;
  drawDate: string | null;
  entryCutoff: string | null;
  pick3Result: string | null;
  createdAt: string;
}

export default function EditGiveawayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slotCount, setSlotCount] = useState(36);
  const [hasBoxTopper, setHasBoxTopper] = useState(false);
  const [minParticipation, setMinParticipation] = useState(10000);
  const [freeEntriesPerUser, setFreeEntriesPerUser] = useState(10);
  const [creditCostPerPick, setCreditCostPerPick] = useState(1);
  const [prizeValue, setPrizeValue] = useState("");

  useEffect(() => {
    fetch(`/api/giveaways/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.giveaway) {
          const g = data.giveaway;
          setGiveaway(g);
          setTitle(g.title);
          setDescription(g.description || "");
          setSlotCount(g.slotCount);
          setHasBoxTopper(g.hasBoxTopper || false);
          setMinParticipation(g.minParticipation);
          setFreeEntriesPerUser(g.freeEntriesPerUser);
          setCreditCostPerPick(g.creditCostPerPick || 1);
          setPrizeValue(g.prizeValue ? String(g.prizeValue) : "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/giveaways/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          slotCount,
          hasBoxTopper,
          minParticipation,
          freeEntriesPerUser,
          creditCostPerPick,
          prizeValue: prizeValue ? parseFloat(prizeValue) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update giveaway");
      }

      setGiveaway(data.giveaway);
      setSuccess("Giveaway updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!giveaway) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Giveaway not found</h1>
        <Link href="/admin/giveaways" className="text-purple-400 hover:underline">
          Back to giveaways
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    OPEN: "bg-green-500/20 text-green-400",
    FILLING: "bg-amber-500/20 text-amber-400",
    CLOSED: "bg-red-500/20 text-red-400",
    COMPLETED: "bg-blue-500/20 text-blue-400",
    CANCELLED: "bg-slate-500/20 text-slate-400",
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
        <h1 className="text-3xl font-bold text-white">Edit Giveaway</h1>
        <span className={`px-3 py-1 rounded-full text-sm ${statusColors[giveaway.status]}`}>
          {giveaway.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Slot Count</label>
                  <input
                    type="number"
                    value={slotCount}
                    onChange={(e) => setSlotCount(parseInt(e.target.value) || 36)}
                    min={1}
                    max={100}
                    disabled={giveaway.totalPicks > 0}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  />
                  {giveaway.totalPicks > 0 && (
                    <p className="text-xs text-slate-500 mt-1">Cannot change after picks started</p>
                  )}
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasBoxTopper}
                      onChange={(e) => setHasBoxTopper(e.target.checked)}
                      disabled={giveaway.totalPicks > 0}
                      className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-purple-500"
                    />
                    <div>
                      <div className="text-white">Has Box Topper</div>
                      <div className="text-xs text-slate-500">Special bonus slot</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Min Participation</label>
                  <input
                    type="number"
                    value={minParticipation}
                    onChange={(e) => setMinParticipation(parseInt(e.target.value) || 10000)}
                    min={100}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Free Entries Per User</label>
                  <input
                    type="number"
                    value={freeEntriesPerUser}
                    onChange={(e) => setFreeEntriesPerUser(parseInt(e.target.value) || 10)}
                    min={0}
                    max={100}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Credit Cost Per Pick</label>
                  <input
                    type="number"
                    value={creditCostPerPick}
                    onChange={(e) => setCreditCostPerPick(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                    min={1}
                    max={100}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Box topper costs 3x this</p>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Prize Value ($)</label>
                  <input
                    type="number"
                    value={prizeValue}
                    onChange={(e) => setPrizeValue(e.target.value)}
                    step="0.01"
                    min={0}
                    placeholder="Optional"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Picks</span>
                <span className="text-white font-medium">{giveaway.totalPicks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Progress</span>
                <span className="text-white font-medium">
                  {Math.round((giveaway.totalPicks / giveaway.minParticipation) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created</span>
                <span className="text-white">{new Date(giveaway.createdAt).toLocaleDateString()}</span>
              </div>
              {giveaway.drawDate && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Draw Date</span>
                  <span className="text-amber-400">{new Date(giveaway.drawDate).toLocaleDateString()}</span>
                </div>
              )}
              {giveaway.pick3Result && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Pick 3 Result</span>
                  <span className="text-green-400 font-mono">{giveaway.pick3Result}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/giveaways/${giveaway.id}`}
                className="block w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white text-center rounded-lg transition-colors"
              >
                View Public Page
              </Link>
              {giveaway.status === "CLOSED" && (
                <Link
                  href={`/admin/giveaways/${giveaway.id}/draw`}
                  className="block w-full py-2 px-4 bg-green-600 hover:bg-green-500 text-white text-center rounded-lg transition-colors"
                >
                  Enter Draw Result
                </Link>
              )}
              {["OPEN", "FILLING", "CLOSED"].includes(giveaway.status) && (
                <Link
                  href={`/admin/giveaways/${giveaway.id}/cancel`}
                  className="block w-full py-2 px-4 bg-red-600 hover:bg-red-500 text-white text-center rounded-lg transition-colors"
                >
                  Cancel & Refund
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

