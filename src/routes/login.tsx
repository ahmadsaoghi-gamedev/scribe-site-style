import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SCHOOL, getSession } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { SmartLoader } from "@/components/SmartLoader";
import { LogIn, ShieldCheck, UserCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const s = getSession();
      if (s) {
        if (s.role === "admin") throw redirect({ to: "/admin" });
        if (s.role === "petugas") throw redirect({ to: "/dashboard" });
      }
    }
  },
  head: () => ({ meta: [{ title: "Otentikasi — Digital Attendance System" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (e) {
      // Error is already handled by hook (toasts)
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-accent/20 p-4 transition-colors duration-1000">
      <Toaster richColors position="top-center" />
      
      <Card className="w-full max-w-md p-8 shadow-2xl border-none ring-1 ring-border/50 animate-in fade-in zoom-in-95 duration-700 bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4 group cursor-pointer">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse group-hover:scale-125 transition-transform duration-500" />
            <img 
              src={SCHOOL.logo} 
              alt="Institution Logo" 
              className="h-28 w-28 rounded-full object-cover ring-4 ring-background shadow-xl relative z-10 transition-transform group-hover:scale-110 duration-500" 
            />
          </div>
          <h1 className="text-2xl font-black text-foreground leading-tight tracking-tighter uppercase">{SCHOOL.name}</h1>
          <p className="text-xs font-bold text-muted-foreground mt-2 tracking-widest uppercase opacity-70">Sistem Kehadiran Digital</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Institusi</Label>
            <Input 
              id="email" 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="nama@domain.sch.id" 
              className="h-12 bg-accent/30 border-none ring-1 ring-border/50 focus-visible:ring-primary focus-visible:bg-background transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" title="Kata Sandi" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Kata Sandi</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="h-12 bg-accent/30 border-none ring-1 ring-border/50 focus-visible:ring-primary focus-visible:bg-background transition-all"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoggingIn} 
            className="w-full h-12 shadow-lg shadow-primary/25 text-base font-black tracking-widest uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95"
          >
            {isLoggingIn ? (
              <SmartLoader size="sm" className="mr-2" />
            ) : (
              <LogIn className="h-5 w-5 mr-2" />
            )}
            {isLoggingIn ? "MEMPROSES..." : "MASUK"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-dashed border-border/60">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] text-center mb-4">Akses Uji Coba</p>
            
            <div className="grid grid-cols-1 gap-2">
              <button 
                type="button"
                onClick={() => { setEmail("admin@maswh.id"); setPassword("admin123"); }}
                className="flex items-center justify-between p-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight">Admin System</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Manajemen Terpusat</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-primary opacity-30 group-hover:opacity-100 transition-opacity">GUNAKAN</span>
              </button>

              <button 
                type="button"
                onClick={() => { setEmail("petugas@maswh.id"); setPassword("petugas123"); }}
                className="flex items-center justify-between p-3 rounded-xl bg-accent/30 hover:bg-accent/50 border border-border/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight">Petugas Kelas</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Input Absensi Harian</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity">GUNAKAN</span>
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
