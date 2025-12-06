"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Winner {
  id: string;
  slot: number;
  pickNumber: string;
  createdAt: string;
  usedVipFreeShipping: boolean;
  giveaway: {
    title: string;
    image: string | null;
  };
  user: {
    name: string | null;
    displayName: string | null;
    email: string | null;
    shippingName: string | null;
    shippingAddress: string | null;
    shippingCity: string | null;
    shippingState: string | null;
    shippingZip: string | null;
    shippingCountry: string | null;
    subscriptionTier: string | null;
    freeShippingUsedAt: string | null;
  };
}

export default function GiveawayWinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [useVipFreeShipping, setUseVipFreeShipping] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      const res = await fetch("/api/admin/giveaways/winners");
      const data = await res.json();
      setWinners(data.winners || []);
    } catch (error) {
      console.error("Failed to fetch winners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsShipped = async () => {
    if (!selectedWinner) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/giveaways/winners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerId: selectedWinner.id,
          trackingNumber,
          usedVipFreeShipping: useVipFreeShipping,
        }),
      });

      if (res.ok) {
        alert("Winner marked as shipped!");
        setSelectedWinner(null);
        setTrackingNumber("");
        setUseVipFreeShipping(false);
        fetchWinners();
      } else {
        alert("Failed to mark as shipped");
      }
    } catch (error) {
      console.error("Failed to ship:", error);
      alert("Failed to mark as shipped");
    } finally {
      setSubmitting(false);
    }
  };

  const canUseFreeShipping = (winner: Winner) => {
    if (!winner.user.subscriptionTier) return false;
    if (!winner.user.freeShippingUsedAt) return true;
    
    // Check if used this month
    const usedDate = new Date(winner.user.freeShippingUsedAt);
    const now = new Date();
    const monthsAgo = (now.getFullYear() - usedDate.getFullYear()) * 12 + (now.getMonth() - usedDate.getMonth());
    return monthsAgo >= 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Giveaway Winners - Shipping</h1>
          <Link
            href="/admin"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            ← Back to Admin
          </Link>
        </div>

        {winners.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400">No unclaimed winners</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {winners.map((winner) => (
              <div
                key={winner.id}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-purple-500/30 transition-colors"
              >
                <div className="flex gap-6">
                  {winner.giveaway.image && (
                    <div className="w-24 h-24 relative flex-shrink-0">
                      <Image
                        src={winner.giveaway.image}
                        alt={winner.giveaway.title}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{winner.giveaway.title}</h3>
                        <p className="text-slate-400 text-sm">
                          Slot {winner.slot} • Pick #{winner.pickNumber} • Won {new Date(winner.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {winner.user.subscriptionTier && (
                        <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-full text-xs font-semibold">
                          VIP {winner.user.subscriptionTier}
                        </span>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase mb-1">Winner</p>
                        <p className="text-white">{winner.user.displayName || winner.user.name || "No name"}</p>
                        <p className="text-slate-400 text-sm">{winner.user.email}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-slate-500 uppercase mb-1">Shipping Address</p>
                        {winner.user.shippingAddress ? (
                          <>
                            <p className="text-white text-sm">{winner.user.shippingName}</p>
                            <p className="text-slate-400 text-sm">{winner.user.shippingAddress}</p>
                            <p className="text-slate-400 text-sm">
                              {winner.user.shippingCity}, {winner.user.shippingState} {winner.user.shippingZip}
                            </p>
                          </>
                        ) : (
                          <p className="text-red-400 text-sm">No address on file</p>
                        )}
                      </div>
                    </div>

                    {canUseFreeShipping(winner) && (
                      <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-400 text-sm">✓ Eligible for VIP free shipping</p>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setSelectedWinner(winner);
                        setUseVipFreeShipping(canUseFreeShipping(winner));
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Mark as Shipped
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shipping Modal */}
        {selectedWinner && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-4">Mark as Shipped</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Tracking Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    placeholder="1Z999AA10123456784"
                  />
                </div>

                {selectedWinner.user.subscriptionTier && (
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="vipShipping"
                      checked={useVipFreeShipping}
                      onChange={(e) => setUseVipFreeShipping(e.target.checked)}
                      disabled={!canUseFreeShipping(selectedWinner)}
                      className="w-5 h-5"
                    />
                    <label htmlFor="vipShipping" className="text-white text-sm">
                      Use VIP free shipping (1x/month)
                      {!canUseFreeShipping(selectedWinner) && (
                        <span className="block text-xs text-red-400 mt-1">Already used this month</span>
                      )}
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedWinner(null);
                    setTrackingNumber("");
                    setUseVipFreeShipping(false);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAsShipped}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
                >
                  {submitting ? "Saving..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

