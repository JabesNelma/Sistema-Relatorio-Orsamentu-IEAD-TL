"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, QrCode, Loader2, KeyRound, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext as useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";

export function LoginScreen() {
  const { loginWithQr, loading, error, clearError } = useAuth();
  const [token, setToken] = useState("");
  const [oauthLoading, setOauthLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get("success");
    const err = searchParams.get("error");
    
    if (success) {
      toast.success(success);
      // Clear URL params
      window.history.replaceState({}, "", "/");
      router.refresh();
    } else if (err) {
      toast.error(decodeURIComponent(err));
      // Clear URL params
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams, router]);

  const handleGoogle = async () => {
    setOauthLoading(true);
    // Redirect to Google OAuth flow
    window.location.href = "/api/auth/google";
  };

  const handleQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error("Tama token QR uluk");
      return;
    }
    const ok = await loginWithQr(token.trim());
    if (ok) {
      toast.success("Login QR ho suksessu!");
      setToken("");
      router.refresh();
    } else {
      toast.error("Token QR la validu");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-emerald-50 via-background to-amber-50/40">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-8 px-4 py-10 lg:flex-row lg:gap-16">
        {/* Left: branding */}
        <div className="flex max-w-md flex-col items-start gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Sistema Finansa</h1>
              <p className="text-sm text-muted-foreground">Timor-Leste</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Manejamentu Finansa{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                Rejional &amp; Lokal
              </span>
            </h2>
            <p className="text-muted-foreground">
              Sistema integradu ba Kontrola Pemasukan Keuangan husi Admin Lokal
              (suku), rekapitulasaun husi Admin Regional, ho jeransa totál husi
              Super Admin.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3">
            {[
              { label: "Super Admin", desc: "Google SSO", icon: ShieldCheck },
              { label: "Admin Regional", desc: "QR Login", icon: QrCode },
              { label: "Admin Lokal", desc: "QR Login", icon: KeyRound },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border bg-card p-3 shadow-sm"
              >
                <item.icon className="mb-1.5 h-5 w-5 text-emerald-600" />
                <p className="text-xs font-semibold">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: login card */}
        <Card className="w-full max-w-md border-border/60 shadow-xl shadow-emerald-900/5">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Tama Sistema</CardTitle>
            <CardDescription>
              Hili metodu login: Google SSO ba Super Admin ka QR Token ba Admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="google" className="w-full" onValueChange={clearError}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="google" className="gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Super Admin
                </TabsTrigger>
                <TabsTrigger value="qr" className="gap-1.5">
                  <QrCode className="h-4 w-4" />
                  QR Login
                </TabsTrigger>
              </TabsList>

              {/* Google SSO tab */}
              <TabsContent value="google" className="mt-5 space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-sm">
                  <div className="mb-1 flex items-center gap-1.5 font-medium text-emerald-800">
                    <Lock className="h-3.5 w-3.5" />
                    Google Single Sign-On
                  </div>
                  <p className="text-xs text-emerald-700/80">
                    Super Admin login uza Google OAuth. Sesiya jerkasaun uluk
                    husi Supabase Auth.
                  </p>
                </div>

                <Button
                  onClick={handleGoogle}
                  disabled={oauthLoading}
                  className="h-11 w-full gap-2 bg-white text-slate-700 shadow-sm border border-slate-300 hover:bg-slate-50"
                  size="lg"
                >
                  {oauthLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <GoogleIcon className="h-5 w-5" />
                  )}
                  Login ho Google
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Akun Super Admin: {process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "jabesnelma056@gmail.com"}
                </p>
              </TabsContent>

              {/* QR token tab */}
              <TabsContent value="qr" className="mt-5 space-y-4">
                <form onSubmit={handleQr} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qr-token">Token QR</Label>
                    <Input
                      id="qr-token"
                      placeholder="Tama token QR iha ne'e..."
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      autoComplete="off"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Token ne'e nakamoget husi Super Admin bainaka Admin
                      Regional no Admin Lokal.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !token.trim()}
                    className="h-11 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                    size="lg"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4" />
                        Login ho Token
                      </>
                    )}
                  </Button>
                </form>

                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800">
                  <p className="font-medium">Info:</p>
                  <p className="mt-0.5 text-amber-700/80">
                    Scan QR code ka kopia token husi Super Admin, depois tama iha
                    campo uluk atu login.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
