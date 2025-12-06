"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

interface GiveawayWin {
  id: string;
  slot: number;
  pickNumber: string;
  distance: number;
  claimed: boolean;
  shippedAt: string | null;
  trackingNumber: string | null;
  usedVipFreeShipping: boolean;
  createdAt: string;
  giveaway: {
    id: string;
    title: string;
    image: string | null;
  };
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [wins, setWins] = useState<GiveawayWin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchWins();
    }
  }, [session]);

  const fetchWins = async () => {
    try {
      const res = await fetch("/api/user/wins");
      const data = await res.json();
      setWins(data.wins || []);
    } catch (error) {
      console.error("Failed to fetch wins:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in</h1>
          <Link href="/api/auth/signin" className="text-purple-400 hover:underline">
            Sign in to view your profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-slate-400">
            {session.user.displayName || session.user.name || session.user.email}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium">
            Giveaway Wins
          </button>
          <Link
            href="/profile/settings"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Settings
          </Link>
        </div>

        {/* Giveaway Wins */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">🏆 My Giveaway Wins</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            </div>
          ) : wins.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">You haven't won any giveaways yet</p>
              <Link
                href="/giveaways"
                className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
              >
                Enter a Giveaway
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {wins.map((win) => (
                <div
                  key={win.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex gap-6">
                    {win.giveaway.image && (
                      <div className="w-24 h-24 relative flex-shrink-0">
                        <Image
                          src={win.giveaway.image}
                          alt={win.giveaway.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {win.giveaway.title}
                          </h3>
                          <p className="text-slate-400 text-sm">
                            Slot {win.slot} • Pick #{win.pickNumber} • Distance: {win.distance}
                          </p>
                          <p className="text-slate-500 text-xs mt-1">
                            Won on {new Date(win.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Shipping Status */}
                        {win.shippedAt ? (
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-xs font-semibold mb-2">
                              ✓ Shipped
                            </span>
                            {win.trackingNumber && (
                              <p className="text-slate-400 text-xs">
                                Tracking: {win.trackingNumber}
                              </p>
                            )}
                            {win.usedVipFreeShipping && (
                              <p className="text-amber-400 text-xs mt-1">
                                VIP Free Shipping
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-full text-xs font-semibold mb-2">
                              ⏳ Awaiting Shipping
                            </span>
                            {session.user.subscriptionTier ? (
                              <p className="text-amber-400 text-xs">
                                VIP Free Shipping Available
                                <br />
                                <span className="text-slate-500">(20th-28th of month)</span>
                              </p>
                            ) : (
                              <Link
                                href={`/profile/wins/${win.id}/shipping`}
                                className="block mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg transition-colors"
                              >
                                Purchase Shipping
                              </Link>
                            )}
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/giveaways/${win.giveaway.id}`}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        View Giveaway →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* VIP Info */}
        {session.user.subscriptionTier && (
          <div className="mt-6 bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-amber-400 mb-3">
              🌟 VIP {session.user.subscriptionTier} Member
            </h3>
            <p className="text-slate-300 text-sm">
              You receive free shipping on giveaway wins once per month between the 20th-28th.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
