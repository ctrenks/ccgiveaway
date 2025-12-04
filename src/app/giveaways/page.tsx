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
          <p className="text-slate-400 max-w-2xl">
            Pick your lucky numbers for a chance to win sealed products! Every account gets{" "}
            <span className="text-purple-400 font-medium">10 free entries</span> per giveaway.
            Earn more entries by shopping in our store.
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-12">
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
