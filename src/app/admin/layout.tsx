import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROLES } from "@/types/next-auth";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect if not logged in or not admin/moderator
  if (!session?.user || session.user.role < ROLES.MODERATOR) {
    redirect("/auth/signin");
  }

  const isAdmin = session.user.role >= ROLES.ADMIN;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="text-lg font-bold text-purple-400">
                Admin Panel
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/admin/products"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Products
                </Link>
                <Link
                  href="/admin/categories"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Categories
                </Link>
                <Link
                  href="/admin/orders"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Orders
                </Link>
                <Link
                  href="/admin/giveaways"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Giveaways
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/settings"
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Settings
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                {isAdmin ? "Admin" : "Moderator"}
              </span>
              <Link href="/" className="text-sm text-slate-500 hover:text-white">
                ← Back to Store
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

