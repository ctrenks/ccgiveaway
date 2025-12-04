import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminGiveaways() {
  const giveaways = await prisma.giveaway.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { picks: true, winners: true },
      },
    },
  });

  const statusColors: Record<string, string> = {
    OPEN: "bg-green-500/20 text-green-400",
    FILLING: "bg-amber-500/20 text-amber-400",
    CLOSED: "bg-red-500/20 text-red-400",
    COMPLETED: "bg-blue-500/20 text-blue-400",
    CANCELLED: "bg-slate-500/20 text-slate-400",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Giveaways</h1>
        <Link
          href="/admin/giveaways/new"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          + Create Giveaway
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Title
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Slots
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Picks
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Min Required
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Status
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Draw Date
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {giveaways.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No giveaways yet.{" "}
                  <Link href="/admin/giveaways/new" className="text-purple-400 hover:underline">
                    Create one
                  </Link>
                </td>
              </tr>
            ) : (
              giveaways.map((giveaway) => (
                <tr key={giveaway.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{giveaway.title}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{giveaway.slotCount}</td>
                  <td className="px-4 py-3">
                    <span className="text-purple-400">{giveaway._count.picks}</span>
                    {giveaway._count.winners > 0 && (
                      <span className="text-green-400 ml-2">
                        ({giveaway._count.winners} winners)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {giveaway.minParticipation.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        statusColors[giveaway.status]
                      }`}
                    >
                      {giveaway.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {giveaway.drawDate
                      ? new Date(giveaway.drawDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/giveaways/${giveaway.id}`}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        Edit
                      </Link>
                      {giveaway.status === "CLOSED" && (
                        <Link
                          href={`/admin/giveaways/${giveaway.id}/draw`}
                          className="text-green-400 hover:text-green-300 text-sm"
                        >
                          Enter Result
                        </Link>
                      )}
                      {["OPEN", "FILLING", "CLOSED"].includes(giveaway.status) && (
                        <Link
                          href={`/admin/giveaways/${giveaway.id}/cancel`}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Cancel
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
