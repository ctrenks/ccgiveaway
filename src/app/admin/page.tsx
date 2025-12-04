import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  // Fetch stats
  const [productCount, categoryCount, orderCount, userCount, giveawayCount, subscriptionCount] =
    await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.giveaway.count({ where: { status: { in: ["OPEN", "FILLING"] } } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
    ]);

  const stats = [
    { label: "Products", value: productCount, href: "/admin/products", icon: "📦" },
    { label: "Categories", value: categoryCount, href: "/admin/categories", icon: "🏷️" },
    { label: "Orders", value: orderCount, href: "/admin/orders", icon: "🛒" },
    { label: "Users", value: userCount, href: "/admin/users", icon: "👥" },
    { label: "Active Giveaways", value: giveawayCount, href: "/admin/giveaways", icon: "🎁" },
    { label: "Subscribers", value: subscriptionCount, href: "/admin/subscriptions", icon: "⭐" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-purple-500/50 transition-all"
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
            <div className="text-slate-400 text-sm">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/products/new"
          className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition-all group"
        >
          <div className="text-2xl mb-2">➕</div>
          <div className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
            Add Product
          </div>
          <div className="text-slate-400 text-sm">Manually add a new product</div>
        </Link>

        <Link
          href="/admin/products/import"
          className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/50 transition-all group"
        >
          <div className="text-2xl mb-2">🔗</div>
          <div className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            Import from TCGPlayer
          </div>
          <div className="text-slate-400 text-sm">Import card via URL</div>
        </Link>

        <Link
          href="/admin/giveaways/new"
          className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-6 hover:border-amber-500/50 transition-all group"
        >
          <div className="text-2xl mb-2">🎁</div>
          <div className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
            Create Giveaway
          </div>
          <div className="text-slate-400 text-sm">Start a new giveaway</div>
        </Link>
      </div>
    </div>
  );
}

