"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Giveaway {
  id: string;
  title: string;
  status: string;
  totalPicks: number;
  _count: {
    picks: number;
  };
}

export default function CancelGiveawayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [creditPicks, setCreditPicks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    totalCreditsRefunded: number;
    usersRefunded: number;
  } | null>(null);

  useEffect(() => {
    // Fetch giveaway details
    fetch(`/api/giveaways/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.giveaway) {
          setGiveaway(data.giveaway);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch credit pick count
    fetch(`/api/admin/giveaways/${id}/stats`)
      .then((res) => res.json())
      .then((data) => {
        if (data.creditPicks !== undefined) {
          setCreditPicks(data.creditPicks);
        }
      })
      .catch(() => {});
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/giveaways/${id}/cancel`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel giveaway");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancelling(false);
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

  if (result) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-white mb-4">Giveaway Cancelled</h1>
          <p className="text-slate-400 mb-6">
            The giveaway has been cancelled and credits have been refunded.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">
                {result.totalCreditsRefunded}
              </div>
              <div className="text-slate-400 text-sm">Credits Refunded</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">
                {result.usersRefunded}
              </div>
              <div className="text-slate-400 text-sm">Users Refunded</div>
            </div>
          </div>
          <p className="text-slate-500 text-sm mb-6">
            Note: Free entries are not refunded. Users will get new free entries on future giveaways.
          </p>
          <Link
            href="/admin/giveaways"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
          >
            Back to Giveaways
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/giveaways"
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-white">Cancel Giveaway</h1>
      </div>

      <div className="max-w-lg">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-red-400 mb-2">⚠️ Warning</h2>
          <p className="text-slate-300">
            You are about to cancel this giveaway. This action cannot be undone.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">{giveaway.title}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-white">{giveaway.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Picks:</span>
              <span className="text-white">{giveaway.totalPicks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Credit Picks (to refund):</span>
              <span className="text-green-400">{creditPicks}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
          <h4 className="text-white font-medium mb-2">What happens:</h4>
          <ul className="text-slate-400 text-sm space-y-1">
            <li>• Giveaway status will be set to CANCELLED</li>
            <li>• All credit picks will be refunded to users</li>
            <li>• Free entries will NOT be refunded (users get new ones on new giveaways)</li>
            <li>• No winners will be determined</li>
          </ul>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {cancelling ? "Cancelling..." : "Cancel Giveaway & Refund Credits"}
          </button>
          <Link
            href="/admin/giveaways"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </Link>
        </div>
      </div>
    </div>
  );
}

