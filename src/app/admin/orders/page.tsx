import { prisma } from "@/lib/prisma";
import Link from "next/link";

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

  // Count orders by status for export buttons
  const paidCount = orders.filter((o) => o.status === "PAID").length;
  const processingCount = orders.filter((o) => o.status === "PROCESSING").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Orders</h1>
        
        {/* Export Buttons */}
        <div className="flex gap-3">
          <Link
            href="/api/admin/orders/export?status=PAID"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
          >
            <span>📥</span>
            Export Paid ({paidCount})
          </Link>
          <Link
            href="/api/admin/orders/export?status=PROCESSING"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm"
          >
            <span>📥</span>
            Export Processing ({processingCount})
          </Link>
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 mb-6">
        <h3 className="text-white font-medium mb-2">🚢 Pirate Ship Import</h3>
        <p className="text-slate-400 text-sm">
          Export orders as CSV, then import into{" "}
          <a
            href="https://ship.pirateship.com/ship"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline"
          >
            Pirate Ship
          </a>{" "}
          using their <strong>Import Spreadsheet</strong> feature. After shipping, update order status below.
        </p>
      </div>

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
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
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
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      View
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
