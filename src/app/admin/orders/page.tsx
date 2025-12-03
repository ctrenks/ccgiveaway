import { prisma } from "@/lib/prisma";

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    PAID: "bg-blue-500/20 text-blue-400",
    PROCESSING: "bg-purple-500/20 text-purple-400",
    SHIPPED: "bg-cyan-500/20 text-cyan-400",
    DELIVERED: "bg-green-500/20 text-green-400",
    CANCELLED: "bg-red-500/20 text-red-400",
    REFUNDED: "bg-slate-500/20 text-slate-400",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Orders</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Order
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Customer
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Items
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Total
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Credits
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Status
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No orders yet
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="text-white font-mono text-sm">
                      {order.orderNumber.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white">{order.user.name || "Guest"}</div>
                    <div className="text-slate-500 text-sm">{order.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-white">{order.items.length}</td>
                  <td className="px-4 py-3 text-green-400 font-medium">
                    ${Number(order.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-amber-400">🎁 {order.creditsEarned}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        statusColors[order.status] || "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {new Date(order.createdAt).toLocaleDateString()}
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

