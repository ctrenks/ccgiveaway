import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminGiveaways() {
  const giveaways = await prisma.giveaway.findMany({
    include: {
      _count: { select: { entries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Giveaways</h1>
        <Link
          href="/admin/giveaways/new"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          🎁 Create Giveaway
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {giveaways.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">🎁</div>
            <div className="text-slate-400">No giveaways yet</div>
            <Link
              href="/admin/giveaways/new"
              className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
            >
              Create your first giveaway
            </Link>
          </div>
        ) : (
          giveaways.map((giveaway) => {
            const isActive =
              giveaway.active && new Date(giveaway.endDate) > new Date();
            const isEnded = new Date(giveaway.endDate) < new Date();

            return (
              <div
                key={giveaway.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
              >
                <div className="h-32 bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
                  <span className="text-5xl">🎁</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {giveaway.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        isActive
                          ? "bg-green-500/20 text-green-400"
                          : isEnded
                          ? "bg-slate-700 text-slate-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {isActive ? "Active" : isEnded ? "Ended" : "Scheduled"}
                    </span>
                  </div>

                  <div className="text-slate-400 text-sm mb-3">
                    {giveaway._count.entries} entries
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-slate-500">
                      Ends: {new Date(giveaway.endDate).toLocaleDateString()}
                    </div>
                    <Link
                      href={`/admin/giveaways/${giveaway.id}`}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

