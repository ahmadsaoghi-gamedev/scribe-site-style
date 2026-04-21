import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SCHOOL, getSession } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { SmartLoader } from "@/components/SmartLoader";
import {
  clearLoginDebugEntries,
  pushLoginDebug,
  readLoginDebugEntries,
  subscribeLoginDebug,
  type LoginDebugEntry,
} from "@/lib/loginDebug";
import { LogIn, ShieldCheck, UserCheck } from "lucide-react";
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
  const [debugEntries, setDebugEntries] = useState<LoginDebugEntry[]>([]);

  useEffect(() => {
    pushLoginDebug("login: mounted");
    setDebugEntries(readLoginDebugEntries());
    const unsubscribe = subscribeLoginDebug(setDebugEntries);

    const onBeforeUnload = () => pushLoginDebug("login: beforeunload");
    const onPageHide = () => pushLoginDebug("login: pagehide");
    const onVisibilityChange = () =>
      pushLoginDebug("login: visibilitychange", { state: document.visibilityState });

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      unsubscribe();
      pushLoginDebug("login: unmounted");
    };
  }, []);

  useEffect(() => {
    if (!isLoggingIn) {
      pushLoginDebug("login: isLoggingIn false");
      setLoginStalled(false);
      return;
    }

    pushLoginDebug("login: isLoggingIn true");
    const timer = window.setTimeout(() => {
      setLoginStalled(true);
      pushLoginDebug("login: stalled timeout");
      toast.error("Login terlalu lama. Kemungkinan browser masih memakai cache versi lama.");
    }, 12000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isLoggingIn]);

  const submitLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    pushLoginDebug("login: submit click", { email: normalizedEmail });
    if (!normalizedEmail || !password) {
      pushLoginDebug("login: validation failed", {
        hasEmail: !!normalizedEmail,
        hasPassword: !!password,
      });
      toast.error("Email dan kata sandi wajib diisi.");
      return;
    }

    try {
      await login({ email: normalizedEmail, password });
    } catch (e) {
      // Error is already handled by hook (toasts)
    }
  };

  const handleQuickLogin = async (nextEmail: string, nextPassword: string) => {
    pushLoginDebug("login: quick login", { email: nextEmail });
    setEmail(nextEmail);
    setPassword(nextPassword);

    try {
      await login({ email: nextEmail, password: nextPassword });
    } catch (e) {
      // Error handled by hook
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
            onClick={() => {
              void submitLogin();
            }}
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
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  pushLoginDebug("login: manual reload");
                  window.location.reload();
                }}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-accent"
              >
                Muat Ulang Halaman
              </button>
              <button
                type="button"
                onClick={() => {
                  clearLoginDebugEntries();
                  setDebugEntries([]);
                }}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-accent"
              >
                Hapus Log Debug
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Login Debug
            </p>
            <button
              type="button"
              onClick={() => {
                clearLoginDebugEntries();
                setDebugEntries([]);
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground underline"
            >
              Clear
            </button>
          </div>
          <div className="max-h-44 overflow-auto rounded-lg bg-background/70 p-3 font-mono text-[10px] leading-5 text-foreground">
            {debugEntries.length === 0 ? (
              <p>Belum ada log.</p>
            ) : (
              debugEntries.map((entry, index) => (
                <p key={`${entry.at}-${index}`}>
                  [{new Date(entry.at).toLocaleTimeString("id-ID", { hour12: false })}]{" "}
                  {entry.message}
                  {entry.detail ? ` :: ${entry.detail}` : ""}
                </p>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-dashed border-border/60">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] text-center mb-4">
              Akses Uji Coba
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={isLoggingIn}
                onClick={() => {
                  void handleQuickLogin("admin@maswh.id", "admin123");
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight">Admin System</p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Manajemen Terpusat
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-primary opacity-30 group-hover:opacity-100 transition-opacity">
                  GUNAKAN
                </span>
              </button>

              <button
                type="button"
                disabled={isLoggingIn}
                onClick={() => {
                  void handleQuickLogin("petugas@maswh.id", "petugas123");
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-accent/30 hover:bg-accent/50 border border-border/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight">Petugas Kelas</p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Input Absensi Harian
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity">
                  GUNAKAN
                </span>
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
