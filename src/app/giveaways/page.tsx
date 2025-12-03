"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

// Sample giveaways data
const giveaways = [
  {
    id: "1",
    title: "Charizard 1st Edition Base Set",
    description: "Win this iconic Charizard 1st Edition from the original Base Set. One of the most sought-after cards in the Pokémon TCG!",
    image: null,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    entries: 1234,
    value: "$15,000",
    active: true,
  },
  {
    id: "2",
    title: "Magic Power Nine Mystery Box",
    description: "A mystery box guaranteed to contain one Power Nine card! Could be a Black Lotus, Mox, or Time Walk.",
    image: null,
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    entries: 5678,
    value: "$10,000+",
    active: true,
  },
  {
    id: "3",
    title: "Blue-Eyes White Dragon Collection",
    description: "Complete set of Blue-Eyes White Dragon cards including the original LOB-001!",
    image: null,
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    entries: 892,
    value: "$2,500",
    active: true,
  },
];

function GiveawayCard({ giveaway }: { giveaway: typeof giveaways[0] }) {
  const { data: session } = useSession();
  const [entered, setEntered] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const endDate = new Date(giveaway.endDate);
  const now = new Date();
  const timeLeft = endDate.getTime() - now.getTime();
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setEntered(true);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-purple-900/20 rounded-3xl overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all">
      {/* Image/Preview */}
      <div className="relative h-48 bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
        <span className="text-6xl">🎁</span>
        {/* Value Badge */}
        <div className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white font-bold shadow-lg">
          {giveaway.value}
        </div>
        {/* Time Badge */}
        <div className="absolute bottom-4 left-4 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm">
          ⏰ {daysLeft}d {hoursLeft}h left
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2">{giveaway.title}</h3>
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{giveaway.description}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{giveaway.entries.toLocaleString()} entries</span>
          </div>
        </div>

        {/* Entry Form */}
        {entered ? (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-center">
            <span className="text-green-400 font-medium">✓ You&apos;re entered! Good luck!</span>
          </div>
        ) : session ? (
          <button
            onClick={() => setEntered(true)}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg transition-all"
          >
            Enter Giveaway
          </button>
        ) : (
          <form onSubmit={handleEnter} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email to participate"
              required
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Entering..." : "Enter Giveaway"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function GiveawaysPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <nav className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-purple-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Giveaways</span>
          </nav>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30 mb-6">
            <span className="text-2xl">🎁</span>
            <span className="text-purple-400 font-medium">Free Entry</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Active Giveaways</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Enter for a chance to win rare and valuable collector cards.
            New giveaways are added weekly – it&apos;s completely free to enter!
          </p>
        </div>

        {/* Giveaways Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {giveaways.map((giveaway) => (
            <GiveawayCard key={giveaway.id} giveaway={giveaway} />
          ))}
        </div>

        {/* How It Works */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-white text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "📧",
                title: "Enter Your Email",
                description: "Simply enter your email address to participate in any giveaway.",
              },
              {
                icon: "🎲",
                title: "Random Selection",
                description: "Winners are randomly selected using a verified fair draw system.",
              },
              {
                icon: "🏆",
                title: "Win & Receive",
                description: "Winners are notified by email and prizes are shipped worldwide.",
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Past Winners */}
        <section className="mt-20 bg-slate-900/50 rounded-3xl border border-slate-800 p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Recent Winners 🏆</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "J***n M.", prize: "Charizard VMAX", date: "Nov 2024" },
              { name: "S***a K.", prize: "Black Lotus Proxy", date: "Nov 2024" },
              { name: "M***e T.", prize: "Pikachu Collection", date: "Oct 2024" },
              { name: "A***x R.", prize: "Yu-Gi-Oh! Bundle", date: "Oct 2024" },
            ].map((winner, index) => (
              <div key={index} className="bg-slate-800/50 rounded-xl p-4 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                  🏅
                </div>
                <p className="text-white font-medium">{winner.name}</p>
                <p className="text-purple-400 text-sm">{winner.prize}</p>
                <p className="text-slate-500 text-xs mt-1">{winner.date}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
