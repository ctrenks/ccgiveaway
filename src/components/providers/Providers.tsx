"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { CartProvider } from "@/lib/cart";
import { CreditsProvider } from "@/lib/credits-context";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <CreditsProvider>
        <CartProvider>{children}</CartProvider>
      </CreditsProvider>
    </NextAuthSessionProvider>
  );
}

