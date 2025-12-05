import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

async function getGiveaways() {
  return prisma.giveaway.findMany({
    where: {
      status: {
        in: ["OPEN", "FILLING", "CLOSED"],
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { picks: true },
      },
    },
  });
}

async function getCompletedGiveaways() {
  return prisma.giveaway.findMany({
    where: { status: "COMPLETED" },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      _count: {
        select: { picks: true, winners: true },
      },
    },
  });
}

const statusColors: Record<string, string> = {
  OPEN: "bg-green-500/20 text-green-400 border-green-500/30",
  FILLING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  CLOSED: "bg-red-500/20 text-red-400 border-red-500/30",
  COMPLETED: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const statusLabels: Record<string, string> = {
  OPEN: "Open for Picks",
  FILLING: "Draw Date Set!",
  CLOSED: "Awaiting Results",
  COMPLETED: "Completed",
};

export default async function GiveawaysPage() {
  const [activeGiveaways, completedGiveaways] = await Promise.all([
    getGiveaways(),
    getCompletedGiveaways(),
  ]);

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-purple-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white">Giveaways</span>
          </nav>
          <h1 className="text-4xl font-bold text-white mb-4">🎁 Card Giveaways</h1>
          <p className="text-slate-400 max-w-2xl mb-4">
            Pick your lucky numbers for a chance to win sealed products! Every account gets{" "}
            <span className="text-purple-400 font-medium">10 free entries</span> per giveaway.
            Earn more entries by shopping in our store.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
            <span className="text-green-400">✓</span>
            <span className="text-green-300 text-sm font-medium">Guaranteed 5+ active giveaways every month!</span>
          </div>
        </div>

        {/* How It Works - Quick Overview */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="text-white font-medium mb-1">Pick a Slot</h3>
              <p className="text-slate-500 text-sm">Choose which pack/item you want to win (1-36)</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="text-white font-medium mb-1">Pick a Number</h3>
              <p className="text-slate-500 text-sm">Select 000-999 or use auto-pick for best odds</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="text-white font-medium mb-1">Wait for Draw</h3>
              <p className="text-slate-500 text-sm">Draw uses Ohio Lottery Pick 3 (7:30 PM EST)</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-white font-medium mb-1">Win!</h3>
              <p className="text-slate-500 text-sm">Closest to Pick 3 wins each slot</p>
            </div>
          </div>
        </div>

        {/* Detailed Rules - Collapsible */}
        <details className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden group mb-12">
          <summary className="p-6 cursor-pointer flex items-center justify-between hover:bg-slate-800/30 transition-colors">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📖</span> Complete Rules & Details
            </h2>
            <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="px-6 pb-6 space-y-6 text-slate-300 border-t border-slate-800 pt-6">
            {/* Winning */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">🏆 How Winners Are Chosen</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>For each slot, the pick <strong>closest to the Pick 3 number</strong> wins that prize.</li>
                <li>Example: If Pick 3 is <span className="font-mono text-green-400">472</span>, someone with <span className="font-mono">470</span> (2 away) beats <span className="font-mono">475</span> (3 away).</li>
                <li>If there&apos;s a tie (same distance), the <strong>lower number wins</strong>. So 470 beats 474 if Pick 3 is 472.</li>
                <li>Each slot has its own winner - you can win multiple slots if you picked in several!</li>
              </ul>
            </div>

            {/* Entries */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">🎟️ Free Entries & Credits</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong className="text-green-400">10 Free Entries</strong> per person per giveaway - no purchase necessary!</li>
                <li>Want more picks? Use <strong className="text-purple-400">Giveaway Credits</strong> earned from store purchases.</li>
                <li>Credit cost varies by giveaway (shown on each giveaway page).</li>
                <li><strong className="text-amber-400">Box Topper</strong> slots (when available) cost 3x the normal credit amount and cannot use free entries.</li>
              </ul>
            </div>

            {/* Timing */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">⏰ Important Timing</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong>Minimum Picks:</strong> Each giveaway requires a minimum number of picks before a draw is scheduled.</li>
                <li><strong>Draw Scheduling:</strong> Once minimum is reached, the draw is set for the next business day (Mon-Fri).</li>
                <li><strong>Entry Cutoff:</strong> 5:00 PM EST on draw day - no more picks after this!</li>
                <li><strong>Draw Time:</strong> 7:30 PM EST - based on the Ohio Pick 3 Evening drawing.</li>
              </ul>
            </div>

            {/* Pro Tips */}
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <h3 className="text-sm font-semibold text-white mb-2">💡 Pro Tips</h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                <li>Use <strong>Auto-Pick</strong> to find the slot with fewest picks and biggest number gaps.</li>
                <li>Spread your picks across multiple slots to increase your chances of winning something.</li>
                <li>Look for big gaps in the number map - the middle of a gap gives you the best odds!</li>
                <li>Numbers near 000 and 999 can be good choices since people often avoid the edges.</li>
              </ul>
            </div>

            {/* Claiming Prizes */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">📦 Claiming Your Prizes</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong>Shipping Cost:</strong> Flat rate of <span className="text-green-400">$5 for up to 5 packs/items</span>. VIP members can use their monthly free shipping!</li>
                <li><strong>Hold Period:</strong> You can hold your winnings for up to <span className="text-amber-400">90 days</span> to bundle with other wins.</li>
                <li><strong>Important:</strong> If shipping is not paid within 90 days, winnings are <span className="text-red-400">forfeited</span> and returned to Collector Card Giveaway.</li>
              </ul>
            </div>

            {/* Fairness */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <h3 className="text-sm font-semibold text-purple-400 mb-2">🎲 100% Fair & Transparent</h3>
              <p className="text-xs text-slate-400">
                Winners are determined by the official Ohio Lottery Pick 3 Evening drawing - a publicly verifiable,
                independent lottery result. We have no control over the winning numbers, ensuring completely fair results for everyone.
              </p>
            </div>
          </div>
        </details>

        {/* VIP Credits Banner */}
        <div className="mb-6 p-6 bg-gradient-to-r from-amber-900/30 via-orange-900/30 to-amber-900/30 border border-amber-500/30 rounded-2xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-5xl">🎟️</div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2">Want More Giveaway Credits?</h3>
              <p className="text-amber-200/80 mb-3">
                VIP members receive <span className="text-white font-semibold">up to 340 credits every month</span> that never expire!
                Plus discounts on store purchases and free shipping.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 text-xs">
                <span className="px-3 py-1 bg-blue-500/20 rounded-full text-blue-300">Basic: 100 credits/mo</span>
                <span className="px-3 py-1 bg-purple-500/20 rounded-full text-purple-300">Plus: 200 credits/mo</span>
                <span className="px-3 py-1 bg-amber-500/20 rounded-full text-amber-300">Premium: 340 credits/mo</span>
              </div>
            </div>
            <Link
              href="/subscribe"
              className="shrink-0 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              ⭐ Become VIP
            </Link>
          </div>
        </div>

        {/* Referral Program Banner */}
        <div className="mb-12 p-6 bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-purple-900/30 border border-purple-500/30 rounded-2xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-5xl">🔗</div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2">Refer Friends, Earn 100 Credits Each!</h3>
              <p className="text-purple-200/80">
                Share your unique referral link with friends. When they sign up, you get <span className="text-white font-semibold">100 free credits</span> instantly!
                No limit on referrals - invite everyone you know.
              </p>
            </div>
            <Link
              href="/profile"
              className="shrink-0 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              🔗 Get Your Link
            </Link>
          </div>
        </div>

        {/* Active Giveaways */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Active Giveaways</h2>

          {activeGiveaways.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-xl font-bold text-white mb-2">No Active Giveaways</h3>
              <p className="text-slate-400">Check back soon for new giveaways!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeGiveaways.map((giveaway) => {
                const progress = Math.min(
                  100,
                  (giveaway.totalPicks / giveaway.minParticipation) * 100
                );

                return (
                  <Link
                    key={giveaway.id}
                    href={`/giveaways/${giveaway.id}`}
                    className="group block"
                  >
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all">
                      {/* Image */}
                      <div className="aspect-video bg-slate-800 relative">
                        {giveaway.image ? (
                          <Image
                            src={giveaway.image}
                            alt={giveaway.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl">
                            🎁
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              statusColors[giveaway.status]
                            }`}
                          >
                            {statusLabels[giveaway.status]}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                          {giveaway.title}
                        </h3>

                        <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                          <span>📦 {giveaway.slotCount} slots</span>
                          <span>🎫 {giveaway._count.picks} picks</span>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{giveaway.totalPicks.toLocaleString()} picks</span>
                            <span>{giveaway.minParticipation.toLocaleString()} needed</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {giveaway.drawDate && (
                          <div className="text-sm text-amber-400">
                            🗓️ Draw: {new Date(giveaway.drawDate).toLocaleDateString()} at 7:30 PM EST
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Completed Giveaways */}
        {completedGiveaways.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Recent Winners</h2>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                      Giveaway
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                      Picks
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                      Winners
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                      Pick 3
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {completedGiveaways.map((giveaway) => (
                    <tr key={giveaway.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/giveaways/${giveaway.id}`}
                          className="text-white hover:text-purple-400"
                        >
                          {giveaway.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {giveaway._count.picks.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-green-400">
                        {giveaway._count.winners} winners
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-purple-400">
                          {giveaway.pick3Result || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {giveaway.pick3Date
                          ? new Date(giveaway.pick3Date).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
