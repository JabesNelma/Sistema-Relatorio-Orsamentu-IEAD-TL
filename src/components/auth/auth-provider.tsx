"use client";

import { createContext, useContext, useMemo } from "react";
import { useAuth as useAuthInternal } from "@/hooks/use-auth";
import type { SessionUser } from "@/lib/types";

type AuthContextValue = ReturnType<typeof useAuthInternal>;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthInternal();
  // Memoise so consumers don't re-render unnecessarily when nothing changed.
  const value = useMemo(
    () => auth,
    [auth]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}

export type { SessionUser };
