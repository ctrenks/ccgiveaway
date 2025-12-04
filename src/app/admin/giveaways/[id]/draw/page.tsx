"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Giveaway {
  id: string;
  title: string;
  status: string;
  slotCount: number;
  hasBoxTopper: boolean;
  totalPicks: number;
  drawDate: string | null;
}

export default function DrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pick3Result, setPick3Result] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ winnersCount: number } | null>(null);

  useEffect(() => {
    fetch(`/api/giveaways/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.giveaway) {
          setGiveaway(data.giveaway);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pick3Result || pick3Result.length !== 3) {
      setError("Please enter a valid 3-digit Pick 3 result");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/giveaways/${id}/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pick3Result }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process draw");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process draw");
    } finally {
      setSubmitting(false);
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
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-4">Draw Complete!</h1>
          <p className="text-slate-400 mb-6">
            The Pick 3 result <span className="text-green-400 font-mono font-bold">{pick3Result}</span> has been entered.
          </p>
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
            <div className="text-4xl font-bold text-green-400">
              {result.winnersCount}
            </div>
            <div className="text-slate-400">Winners Determined</div>
          </div>
          <Link
            href={`/giveaways/${id}`}
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
          >
            View Results
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
        <h1 className="text-3xl font-bold text-white">Enter Draw Result</h1>
      </div>

      <div className="max-w-lg">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-2">{giveaway.title}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Status:</span>
              <span className="text-amber-400 ml-2">{giveaway.status}</span>
            </div>
            <div>
              <span className="text-slate-500">Total Picks:</span>
              <span className="text-white ml-2">{giveaway.totalPicks.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500">Slots:</span>
              <span className="text-white ml-2">
                {giveaway.slotCount}{giveaway.hasBoxTopper ? " + Box Topper" : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Potential Winners:</span>
              <span className="text-green-400 ml-2">
                {giveaway.slotCount + (giveaway.hasBoxTopper ? 1 : 0)}
              </span>
            </div>
            {giveaway.drawDate && (
              <div>
                <span className="text-slate-500">Draw Date:</span>
                <span className="text-white ml-2">
                  {new Date(giveaway.drawDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Ohio Lottery Pick 3 Result
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            Enter the Pick 3 result from{" "}
            <a
              href="https://www.ohiolottery.com/Games/Pick-3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline"
            >
              Ohio Lottery
            </a>{" "}
            (7:30 PM EST draw).
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">
              Pick 3 Number (000-999)
            </label>
            <input
              type="text"
              value={pick3Result}
              onChange={(e) => setPick3Result(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="Enter 3 digits"
              maxLength={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-4 text-white text-4xl font-mono text-center tracking-[0.5em] focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
            <p className="text-amber-400 text-sm">
              ⚠️ This action cannot be undone. Make sure you have the correct Pick 3 result before submitting.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || pick3Result.length !== 3}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {submitting ? "Processing..." : "Determine Winners"}
          </button>
        </form>
      </div>
    </div>
  );
}
