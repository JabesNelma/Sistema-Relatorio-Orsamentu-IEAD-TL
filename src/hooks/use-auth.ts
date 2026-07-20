"use client";

import { useCallback, useEffect, useState } from "react";
import type { SessionUser } from "@/lib/types";

type AuthState = {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
};

/**
 * Hook that manages the current session. On mount it fetches /api/auth/me.
 * Provides login helpers and a logout function.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setState({ user: data.user ?? null, loading: false, error: null });
    } catch {
      setState({ user: null, loading: false, error: "Gagal memuat sesi" });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loginWithQr = useCallback(async (token: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/auth/qr-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login QR gagal");
      await refresh();
      return true;
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Login QR gagal",
      }));
      return false;
    }
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setState({ user: null, loading: false, error: null });
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    refresh,
    loginWithQr,
    logout,
    clearError: () => setState((s) => ({ ...s, error: null })),
  };
}
