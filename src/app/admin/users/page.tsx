import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ROLE_NAMES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { 
          orders: {
            where: {
              status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
            },
          },
        },
      },
    },
  });

  const roleColors: Record<number, string> = {
    0: "bg-slate-500/20 text-slate-400",
    1: "bg-red-500/20 text-red-400",
    5: "bg-blue-500/20 text-blue-400",
    9: "bg-purple-500/20 text-purple-400",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Users</h1>
        <div className="text-slate-400">
          {users.length} total users
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                User
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Email
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Role
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Credits
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Orders
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Joined
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No users yet
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                          {(user.displayName || user.name || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-white font-medium">
                          {user.displayName || user.name || "No name"}
                        </div>
                        <div className="text-slate-500 text-xs font-mono">
                          {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {user.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        roleColors[user.role] || roleColors[0]
                      }`}
                    >
                      {ROLE_NAMES[user.role] || "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-amber-400 font-medium">
                      🎁 {user.giveawayCredits}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {user._count.orders}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      Edit
                    </Link>
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
