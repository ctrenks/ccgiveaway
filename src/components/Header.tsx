"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                Collector Care
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
          </div>

          {/* Auth & Cart */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                0
              </span>
            </button>

            {/* Auth */}
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm text-white font-medium">{session.user?.name || session.user?.email?.split("@")[0]}</p>
                  <p className="text-xs text-slate-500">{session.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-purple-500/50 rounded-lg transition-all"
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
              <Link href="/store" className="text-slate-300 hover:text-white transition-colors font-medium">
                Store
              </Link>
              <Link href="/categories" className="text-slate-300 hover:text-white transition-colors font-medium">
                Categories
              </Link>
              <Link href="/giveaways" className="text-slate-300 hover:text-white transition-colors font-medium">
                🎁 Giveaways
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
