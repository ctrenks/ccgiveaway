"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { CartProvider } from "@/lib/cart";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <CartProvider>{children}</CartProvider>
    </NextAuthSessionProvider>
  );
}

