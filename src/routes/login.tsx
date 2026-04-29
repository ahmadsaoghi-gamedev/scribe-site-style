import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SCHOOL, getSession } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { SmartLoader } from "@/components/SmartLoader";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    const s = getSession();
    if (s) {
      if (s.role === "admin") throw redirect({ to: "/admin" });
      if (s.role === "petugas") throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Otentikasi — Digital Attendance System" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginStalled, setLoginStalled] = useState(false);

  useEffect(() => {
    if (!isLoggingIn) {
      setLoginStalled(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setLoginStalled(true);
      toast.error("Login terlalu lama. Kemungkinan browser masih memakai cache versi lama.");
    }, 12000);

    return () => window.clearTimeout(timer);
  }, [isLoggingIn]);

  const submitLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      toast.error("Email dan kata sandi wajib diisi.");
      return;
    }

    try {
      await login({ email: normalizedEmail, password });
    } catch (e) {
      // Error is already handled by hook (toasts)
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-accent/20 px-4 py-8 flex items-center justify-center">
      <Card className="w-full max-w-md p-8 shadow-2xl border-none ring-1 ring-border/50 bg-background relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <div className="pointer-events-none absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
            <img
              src={SCHOOL.logo}
              alt="Institution Logo"
              className="h-28 w-28 rounded-full object-cover ring-4 ring-background shadow-xl relative z-10"
            />
          </div>
          <h1 className="text-2xl font-black text-foreground leading-tight tracking-tighter uppercase">
            {SCHOOL.name}
          </h1>
          <p className="text-xs font-bold text-muted-foreground mt-2 tracking-widest uppercase opacity-70">
            Sistem Kehadiran Digital
          </p>
        </div>

        <div className="relative z-[110] space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1"
            >
              Email Institusi
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submitLogin();
                }
              }}
              placeholder="nama@domain.sch.id"
              className="h-12 bg-accent/30 border-none ring-1 ring-border/50 focus-visible:ring-primary focus-visible:bg-background transition-all"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="password"
              title="Kata Sandi"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1"
            >
              Kata Sandi
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submitLogin();
                }
              }}
              className="h-12 bg-accent/30 border-none ring-1 ring-border/50 focus-visible:ring-primary focus-visible:bg-background transition-all"
              autoComplete="current-password"
            />
          </div>

          <button
            type="button"
            disabled={isLoggingIn}
            onClick={() => void submitLogin()}
            className="relative z-[120] flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 h-12 text-base font-black tracking-widest uppercase text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoggingIn ? (
              <SmartLoader size="sm" className="mr-2" />
            ) : (
              <LogIn className="h-5 w-5 mr-2" />
            )}
            {isLoggingIn ? "MEMPROSES..." : "MASUK"}
          </button>

          {loginStalled && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-accent"
            >
              Muat Ulang Halaman
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
