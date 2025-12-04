"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  slotCount: number;
  hasBoxTopper: boolean;
  minParticipation: number;
  freeEntriesPerUser: number;
  status: string;
  totalPicks: number;
  drawDate: string | null;
  entryCutoff: string | null;
  pick3Result: string | null;
  slotCounts: Record<number, number>;
  winners: Array<{
    slot: number;
    pickNumber: string;
    distance: number;
    userName: string | null;
  }>;
}

interface UserPick {
  slot: number;
  pickNumber: string;
  isFreeEntry: boolean;
}

interface SlotData {
  takenNumbers: string[];
  totalTaken: number;
  totalAvailable: number;
  largestGaps: Array<{ start: number; end: number; size: number }>;
}

export default function GiveawayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [userPicks, setUserPicks] = useState<UserPick[]>([]);
  const [freeEntriesRemaining, setFreeEntriesRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState("");

  // Pick form state
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [pickNumber, setPickNumber] = useState("");
  const [useFreeEntry, setUseFreeEntry] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Slot data for showing taken numbers
  const [slotData, setSlotData] = useState<SlotData | null>(null);
  const [loadingSlot, setLoadingSlot] = useState(false);

  // Fetch giveaway data
  useEffect(() => {
    fetch(`/api/giveaways/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.giveaway) {
          setGiveaway(data.giveaway);
          setUserPicks(data.userPicks || []);
          setFreeEntriesRemaining(data.freeEntriesRemaining || 0);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Fetch slot data when slot is selected
  useEffect(() => {
    if (selectedSlot === null || !giveaway) {
      setSlotData(null);
      return;
    }

    setLoadingSlot(true);
    fetch(`/api/giveaways/${id}/slot/${selectedSlot}`)
      .then((res) => res.json())
      .then((data) => {
        setSlotData(data);
        setLoadingSlot(false);
      })
      .catch(() => setLoadingSlot(false));
  }, [selectedSlot, id, giveaway]);

  // Countdown timer
  useEffect(() => {
    if (!giveaway?.entryCutoff) return;

    const updateCountdown = () => {
      const cutoff = new Date(giveaway.entryCutoff!).getTime();
      const now = Date.now();
      const diff = cutoff - now;

      if (diff <= 0) {
        setCountdown("Entries closed");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [giveaway?.entryCutoff]);

  const handleAutoPick = async () => {
    try {
      const res = await fetch(`/api/giveaways/${id}/auto-pick`);
      const data = await res.json();
      if (data.slot && data.pickNumber) {
        setSelectedSlot(data.slot);
        setPickNumber(data.pickNumber);
        setSuccess(`Auto-pick: Slot ${data.slot}, Number ${data.pickNumber}`);
      }
    } catch {
      setError("Failed to get auto-pick suggestion");
    }
  };

  const handleSubmitPick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlot === null || !pickNumber) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/giveaways/${id}/pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot: selectedSlot,
          pickNumber,
          useFreeEntry: useFreeEntry && freeEntriesRemaining > 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit pick");
      } else {
        setSuccess(`Pick submitted: Slot ${selectedSlot}, Number ${pickNumber}`);
        // Refresh data
        const refreshRes = await fetch(`/api/giveaways/${id}`);
        const refreshData = await refreshRes.json();
        if (refreshData.giveaway) {
          setGiveaway(refreshData.giveaway);
          setUserPicks(refreshData.userPicks || []);
          setFreeEntriesRemaining(refreshData.freeEntriesRemaining || 0);
        }
        setPickNumber("");
      }
    } catch {
      setError("Failed to submit pick");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!giveaway) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Giveaway not found</h1>
          <Link href="/giveaways" className="text-purple-400 hover:underline">
            Back to giveaways
          </Link>
        </div>
      </div>
    );
  }

  const progress = Math.min(100, (giveaway.totalPicks / giveaway.minParticipation) * 100);
  const canPick = ["OPEN", "FILLING"].includes(giveaway.status);

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-purple-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/giveaways" className="hover:text-purple-400 transition-colors">
            Giveaways
          </Link>
          <span>/</span>
          <span className="text-white">{giveaway.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              {giveaway.image && (
                <div className="aspect-video relative">
                  <Image
                    src={giveaway.image}
                    alt={giveaway.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h1 className="text-3xl font-bold text-white mb-2">{giveaway.title}</h1>
                {giveaway.description && (
                  <p className="text-slate-400">{giveaway.description}</p>
                )}

                {/* Progress */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>{giveaway.totalPicks.toLocaleString()} picks</span>
                    <span>{giveaway.minParticipation.toLocaleString()} needed for draw</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Countdown */}
                {giveaway.entryCutoff && canPick && (
                  <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400">⏱️ Entries close in:</span>
                      <span className="text-2xl font-bold text-white font-mono">
                        {countdown}
                      </span>
                    </div>
                  </div>
                )}

                {giveaway.status === "COMPLETED" && giveaway.pick3Result && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                    <div className="text-slate-400 mb-1">Winning Pick 3 Number</div>
                    <div className="text-4xl font-bold text-green-400 font-mono">
                      {giveaway.pick3Result}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Slot Grid */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Select a Slot ({giveaway.slotCount}{giveaway.hasBoxTopper ? " + Box Topper" : ""})
              </h2>

              {/* Box Topper Slot (Slot 0) */}
              {giveaway.hasBoxTopper && (
                <div className="mb-4">
                  {(() => {
                    const pickCount = giveaway.slotCounts[0] || 0;
                    const isSelected = selectedSlot === 0;
                    const userHasPick = userPicks.some((p) => p.slot === 0);
                    const winner = giveaway.winners.find((w) => w.slot === 0);

                    return (
                      <button
                        onClick={() => canPick && setSelectedSlot(0)}
                        disabled={!canPick}
                        className={`
                          relative w-full py-3 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
                          ${
                            winner
                              ? "bg-green-500/20 border-2 border-green-500 text-green-400"
                              : isSelected
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 border-2 border-amber-400 text-white"
                              : userHasPick
                              ? "bg-amber-500/20 border border-amber-500/50 text-amber-400"
                              : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 hover:border-amber-500/50"
                          }
                          ${!canPick ? "cursor-default" : "cursor-pointer"}
                        `}
                      >
                        <span>⭐</span>
                        <span>Box Topper</span>
                        {pickCount > 0 && (
                          <span className="bg-slate-700 text-xs px-2 py-0.5 rounded-full">
                            {pickCount} picks
                          </span>
                        )}
                      </button>
                    );
                  })()}
                </div>
              )}

              <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-2">
                {Array.from({ length: giveaway.slotCount }, (_, i) => i + 1).map(
                  (slot) => {
                    const pickCount = giveaway.slotCounts[slot] || 0;
                    const isSelected = selectedSlot === slot;
                    const userHasPick = userPicks.some((p) => p.slot === slot);
                    const winner = giveaway.winners.find((w) => w.slot === slot);

                    return (
                      <button
                        key={slot}
                        onClick={() => canPick && setSelectedSlot(slot)}
                        disabled={!canPick}
                        className={`
                          relative aspect-square rounded-lg font-bold text-sm transition-all
                          ${
                            winner
                              ? "bg-green-500/20 border-2 border-green-500 text-green-400"
                              : isSelected
                              ? "bg-purple-500 border-2 border-purple-400 text-white"
                              : userHasPick
                              ? "bg-purple-500/20 border border-purple-500/50 text-purple-400"
                              : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-purple-500/50"
                          }
                          ${!canPick ? "cursor-default" : "cursor-pointer"}
                        `}
                      >
                        {slot}
                        {pickCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-slate-700 text-[10px] px-1 rounded">
                            {pickCount}
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
              <div className="flex gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-purple-500 rounded"></span> Selected
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-purple-500/20 border border-purple-500/50 rounded"></span> Your picks
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-500/20 border border-green-500 rounded"></span> Winner
                </span>
              </div>
            </div>

            {/* Taken Numbers Visualization */}
            {selectedSlot !== null && slotData && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  Slot {selectedSlot === 0 ? "Box Topper" : selectedSlot} - Number Map
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  {slotData.totalTaken} taken, {slotData.totalAvailable} available.
                  <span className="text-red-500 ml-2">■</span> = Taken
                  <span className="text-slate-700 ml-2">■</span> = Available
                  <span className="text-slate-500 ml-2">(Hover for number)</span>
                </p>

                {/* Visual grid showing exact positions */}
                <div className="space-y-1">
                  {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((rangeStart) => {
                    const takenSet = new Set(slotData.takenNumbers.map((n) => parseInt(n)));
                    const takenInRange = slotData.takenNumbers.filter((n) => {
                      const num = parseInt(n);
                      return num >= rangeStart && num < rangeStart + 100;
                    });

                    return (
                      <div key={rangeStart} className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-14 font-mono shrink-0">
                          {String(rangeStart).padStart(3, "0")}-{String(rangeStart + 99).padStart(3, "0")}
                        </span>
                        <div className="flex-1 flex h-5 bg-slate-800/50 rounded overflow-hidden">
                          {Array.from({ length: 100 }, (_, i) => {
                            const num = rangeStart + i;
                            const isTaken = takenSet.has(num);
                            return (
                              <div
                                key={num}
                                className={`flex-1 border-r border-slate-900/20 last:border-r-0 cursor-pointer transition-all ${
                                  isTaken
                                    ? "bg-red-500 hover:bg-red-400"
                                    : "bg-slate-700/30 hover:bg-green-500/50"
                                }`}
                                title={`${String(num).padStart(3, "0")}${isTaken ? " (TAKEN)" : " (Available)"}`}
                                onClick={() => !isTaken && setPickNumber(String(num).padStart(3, "0"))}
                              />
                            );
                          })}
                        </div>
                        <span className="text-[10px] text-slate-500 w-8 text-right font-mono shrink-0">
                          {takenInRange.length}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Quick reference for taken numbers */}
                {slotData.totalTaken > 0 && (
                  <details className="mt-4">
                    <summary className="text-sm text-purple-400 cursor-pointer hover:text-purple-300">
                      List all {slotData.totalTaken} taken numbers
                    </summary>
                    <div className="mt-2 max-h-32 overflow-y-auto bg-slate-800/50 rounded-lg p-3">
                      <div className="flex flex-wrap gap-1">
                        {slotData.takenNumbers.map((num) => (
                          <span
                            key={num}
                            className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs font-mono rounded"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* Winners List */}
            {giveaway.status === "COMPLETED" && giveaway.winners.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">🏆 Winners</h2>
                <div className="space-y-2">
                  {giveaway.winners.map((winner) => (
                    <div
                      key={winner.slot}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div>
                        <span className="text-purple-400 font-medium">Slot {winner.slot}</span>
                        <span className="text-slate-500 mx-2">•</span>
                        <span className="text-white">{winner.userName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-green-400">{winner.pickNumber}</span>
                        {winner.distance > 0 && (
                          <span className="text-slate-500 text-sm ml-2">
                            ({winner.distance} away)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Pick Form */}
          <div className="space-y-6">
            {/* Pick Form */}
            {canPick && session?.user && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-4">Make a Pick</h2>

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

                <form onSubmit={handleSubmitPick} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Selected Slot
                    </label>
                    <div className="text-2xl font-bold text-purple-400">
                      {selectedSlot !== null ? (selectedSlot === 0 ? "⭐ Box Topper" : `Slot ${selectedSlot}`) : "Click a slot above"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Your Number (000-999)
                    </label>
                    <input
                      type="text"
                      value={pickNumber}
                      onChange={(e) => setPickNumber(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      placeholder="Enter 3 digits"
                      maxLength={3}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-2xl font-mono text-center tracking-widest focus:outline-none focus:border-purple-500"
                    />
                    {/* Show if number is taken */}
                    {pickNumber.length === 3 && slotData && (
                      <div className={`mt-2 text-sm ${
                        slotData.takenNumbers.includes(pickNumber.padStart(3, "0"))
                          ? "text-red-400"
                          : "text-green-400"
                      }`}>
                        {slotData.takenNumbers.includes(pickNumber.padStart(3, "0"))
                          ? "❌ This number is already taken"
                          : "✓ This number is available"}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoPick}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm"
                  >
                    🎲 Auto-Pick (Best Odds)
                  </button>

                  {/* Slot Info Panel */}
                  {selectedSlot !== null && slotData && (
                    <div className="bg-slate-800/50 rounded-lg p-3 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Numbers taken:</span>
                        <span className="text-white font-medium">{slotData.totalTaken}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Available:</span>
                        <span className="text-green-400 font-medium">{slotData.totalAvailable}</span>
                      </div>

                      {slotData.largestGaps.length > 0 && (
                        <div>
                          <div className="text-xs text-slate-500 mb-2">Best gaps (click to use):</div>
                          <div className="flex flex-wrap gap-1">
                            {slotData.largestGaps.slice(0, 3).map((gap, i) => {
                              const midpoint = String(Math.floor((gap.start + gap.end) / 2)).padStart(3, "0");
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setPickNumber(midpoint)}
                                  className="px-2 py-1 bg-slate-700 hover:bg-purple-600 rounded text-xs font-mono text-white transition-colors"
                                  title={`Gap: ${String(gap.start).padStart(3, "0")} - ${String(gap.end).padStart(3, "0")} (${gap.size} numbers)`}
                                >
                                  {midpoint}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {loadingSlot && (
                    <div className="text-center text-slate-500 text-sm">
                      Loading slot data...
                    </div>
                  )}

                  {/* Entry Type */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        checked={useFreeEntry}
                        onChange={() => setUseFreeEntry(true)}
                        disabled={freeEntriesRemaining <= 0}
                        className="text-purple-500"
                      />
                      <div>
                        <div className="text-white">Free Entry</div>
                        <div className="text-slate-500 text-sm">
                          {freeEntriesRemaining} of {giveaway.freeEntriesPerUser} remaining
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        checked={!useFreeEntry}
                        onChange={() => setUseFreeEntry(false)}
                        className="text-purple-500"
                      />
                      <div>
                        <div className="text-white">Use Credit</div>
                        <div className="text-slate-500 text-sm">1 credit per pick</div>
                      </div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={selectedSlot === null || !pickNumber || pickNumber.length < 1 || submitting}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
                  >
                    {submitting ? "Submitting..." : "Submit Pick"}
                  </button>
                </form>
              </div>
            )}

            {/* Login Prompt */}
            {canPick && !session?.user && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Make a Pick</h2>
                <p className="text-slate-400 mb-4">
                  Sign in to enter this giveaway with your 10 free entries!
                </p>
                <Link
                  href="/auth/signin"
                  className="block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl text-center transition-all"
                >
                  Sign In to Enter
                </Link>
              </div>
            )}

          </div>
        </div>

        {/* Your Picks - Full Width Below, Grouped by Slot */}
        {userPicks.length > 0 && (() => {
          // Group picks by slot and sort
          const picksBySlot: Record<number, typeof userPicks> = {};
          userPicks.forEach((pick) => {
            if (!picksBySlot[pick.slot]) {
              picksBySlot[pick.slot] = [];
            }
            picksBySlot[pick.slot].push(pick);
          });

          // Sort picks within each slot by number
          Object.values(picksBySlot).forEach((picks) => {
            picks.sort((a, b) => parseInt(a.pickNumber) - parseInt(b.pickNumber));
          });

          // Get sorted slot numbers (box topper first if exists)
          const sortedSlots = Object.keys(picksBySlot)
            .map(Number)
            .sort((a, b) => a - b);

          return (
            <div className="mt-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Your Picks ({userPicks.length})
              </h2>
              <div className="space-y-4">
                {sortedSlots.map((slot) => (
                  <div key={slot}>
                    <div className="flex items-center gap-2 mb-2">
                      {slot === 0 ? (
                        <span className="text-amber-400 font-medium">⭐ Box Topper</span>
                      ) : (
                        <span className="text-slate-400 font-medium">Slot {slot}</span>
                      )}
                      <span className="text-slate-600 text-sm">
                        ({picksBySlot[slot].length} {picksBySlot[slot].length === 1 ? "pick" : "picks"})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {picksBySlot[slot].map((pick, i) => (
                        <div
                          key={i}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                            slot === 0
                              ? "bg-amber-500/10 border border-amber-500/30"
                              : "bg-slate-800/50"
                          }`}
                        >
                          <span className={`font-mono font-bold ${
                            slot === 0 ? "text-amber-400" : "text-purple-400"
                          }`}>
                            {pick.pickNumber}
                          </span>
                          {pick.isFreeEntry && (
                            <span className="text-[10px] text-green-400 bg-green-500/20 px-1 rounded">
                              FREE
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
