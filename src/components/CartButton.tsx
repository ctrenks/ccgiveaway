"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function CartButton() {
  const { itemCount, total } = useCart();

  return (
    <Link
      href="/cart"
      className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
    >
      <svg
        className="w-5 h-5 text-slate-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {itemCount > 0 && (
        <>
          <span className="text-white font-medium">{itemCount}</span>
          <span className="text-slate-400 text-sm hidden sm:inline">
            (${total.toFixed(2)})
          </span>
        </>
      )}
    </Link>
  );
}

