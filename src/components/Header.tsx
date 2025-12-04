"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import CartButton from "./CartButton";
import { ROLES } from "@/lib/constants";

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  
  const isAdmin = session?.user?.role === ROLES.ADMIN;
  const isMod = session?.user?.role && session.user.role >= ROLES.MODERATOR;

  // Fetch user credits
  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/user/credits")
        .then((res) => res.json())
        .then((data) => setCredits(data.credits))
        .catch(() => setCredits(0));
    }
  }, [session?.user?.id]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-purple-500/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all group-hover:scale-105">
              <span className="text-xl">✨</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Collector Card
              </span>
              <span className="text-xs text-slate-500 block -mt-1">Giveaway</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/store" className="text-slate-300 hover:text-white transition-colors font-medium">
              Store
            </Link>
            <Link href="/categories" className="text-slate-300 hover:text-white transition-colors font-medium">
              Categories
            </Link>
            <Link href="/giveaways" className="text-slate-300 hover:text-white transition-colors font-medium flex items-center gap-1">
              <span>🎁</span> Giveaways
            </Link>
            {isMod && (
              <Link href="/admin" className="text-purple-400 hover:text-purple-300 transition-colors font-medium flex items-center gap-1">
                <span>⚙️</span> Admin
              </Link>
            )}
          </div>

          {/* Auth & Cart */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <CartButton />

            {/* Auth */}
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-3">
                {/* Giveaway Credits */}
                <Link
                  href="/giveaways"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full hover:bg-amber-500/20 transition-colors"
                  title="Giveaway Credits"
                >
                  <span className="text-amber-400">🎁</span>
                  <span className="text-amber-400 font-bold text-sm">
                    {credits !== null ? credits : "..."}
                  </span>
                </Link>

                {/* User Menu */}
                <Link href="/profile" className="flex items-center gap-3 group">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm text-white font-medium group-hover:text-purple-400 transition-colors">
                      {session.user?.name || session.user?.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-slate-500">View Profile</p>
                  </div>
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-transparent group-hover:ring-purple-500/50 transition-all">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt="Avatar"
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {(session.user?.name || session.user?.email || "U")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </Link>

                <button
                  onClick={() => signOut()}
                  className="px-3 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-purple-500/50 rounded-lg transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800">
            <div className="flex flex-col gap-4">
              {session && (
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <span className="text-amber-400">🎁</span>
                  <span className="text-amber-400 font-bold">{credits ?? 0} credits</span>
                </div>
              )}
              <Link href="/store" className="text-slate-300 hover:text-white transition-colors font-medium">
                Store
              </Link>
              <Link href="/categories" className="text-slate-300 hover:text-white transition-colors font-medium">
                Categories
              </Link>
              <Link href="/giveaways" className="text-slate-300 hover:text-white transition-colors font-medium">
                🎁 Giveaways
              </Link>
              {session && (
                <Link href="/profile" className="text-slate-300 hover:text-white transition-colors font-medium">
                  👤 Profile
                </Link>
              )}
              {isMod && (
                <Link href="/admin" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                  ⚙️ Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
