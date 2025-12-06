import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

async function getCompletedGiveaways() {
  return prisma.giveaway.findMany({
    where: {
      status: "COMPLETED",
      isTest: false, // Hide test giveaways from public
    },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { picks: true, winners: true },
      },
    },
  });
}

export default async function CompletedGiveawaysPage() {
  const giveaways = await getCompletedGiveaways();

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
            <Link href="/giveaways" className="hover:text-purple-400 transition-colors">
              Giveaways
            </Link>
            <span>/</span>
            <span className="text-white">Completed</span>
          </nav>
          <h1 className="text-4xl font-bold text-white mb-4">🏆 Completed Giveaways</h1>
          <p className="text-slate-400 max-w-2xl">
            View past giveaway results and verify winning numbers. All draws are based on the official
            Ohio Lottery Pick 3 Evening drawing for complete transparency.
          </p>
        </div>

        {/* Completed Giveaways Grid */}
        {giveaways.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📜</div>
            <h3 className="text-xl font-bold text-white mb-2">No Completed Giveaways</h3>
            <p className="text-slate-400">Past giveaway results will appear here once draws are completed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {giveaways.map((giveaway) => (
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
                      <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-500/20 text-green-400 border-green-500/30">
                        ✓ Completed
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
                      {giveaway.title}
                    </h3>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Total Picks:</span>
                        <span className="text-white font-medium">{giveaway._count.picks.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Winners:</span>
                        <span className="text-green-400 font-medium">{giveaway._count.winners}</span>
                      </div>
                      {giveaway.pick3Result && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Winning Number:</span>
                          <span className="text-purple-400 font-mono font-bold text-lg">{giveaway.pick3Result}</span>
                        </div>
                      )}
                      {giveaway.pick3Date && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Draw Date:</span>
                          <span className="text-slate-300 text-xs">{new Date(giveaway.pick3Date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-center">
                      <span className="text-purple-400 text-sm group-hover:underline">
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Verification Notice */}
        <div className="mt-12 bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-purple-400 mb-2">🔍 Verify Results</h3>
          <p className="text-slate-300 text-sm">
            All winning numbers are determined by the official Ohio Lottery Pick 3 Evening drawing at 7:30 PM EST.
            You can verify any result at{" "}
            <a
              href="https://www.ohiolottery.com/Games/DrawGames/Pick3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline"
            >
              OhioLottery.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

