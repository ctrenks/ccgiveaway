"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface CreditsContextType {
  credits: number;
  refreshCredits: () => Promise<void>;
  deductCredits: (amount: number) => void;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(0);

  const fetchCredits = async () => {
    if (!session?.user?.id) {
      setCredits(0);
      return;
    }

    try {
      const res = await fetch("/api/user/credits");
      const data = await res.json();
      setCredits(data.credits || 0);
    } catch {
      setCredits(0);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [session?.user?.id]);

  const deductCredits = (amount: number) => {
    setCredits(prev => Math.max(0, prev - amount));
  };

  return (
    <CreditsContext.Provider value={{ credits, refreshCredits: fetchCredits, deductCredits }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error("useCredits must be used within CreditsProvider");
  }
  return context;
}

