import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import { SchoolHeader } from "@/components/SchoolHeader";
import { BottomNav } from "@/components/BottomNav";
import { clearSession, getSession, SCHOOL } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/profil")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const s = getSession();
      if (!s) throw redirect({ to: "/login" });
      if (s.role !== "petugas") throw redirect({ to: "/admin" });
    }
  },
  head: () => ({ meta: [{ title: "Profil — Absensi Guru" }] }),
  component: ProfilPage,
});

function ProfilPage() {
  const nav = useNavigate();
  const session = typeof window !== "undefined" ? getSession() : null;
  const logout = () => { clearSession(); nav({ to: "/login" }); };

  return (
    <div className="min-h-screen pb-20 lg:pb-0 bg-gradient-to-b from-accent/40 to-background">
      <Toaster richColors position="top-center" />
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <SchoolHeader subtitle="Profil Petugas" />
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <Card className="p-6 text-center">
          <div className="h-20 w-20 mx-auto rounded-full bg-accent text-primary flex items-center justify-center">
            <UserIcon className="h-10 w-10" />
          </div>
          <h2 className="mt-3 font-bold">{session?.nama}</h2>
          <p className="text-sm text-muted-foreground">Petugas Kelas {session?.kelas_id}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Sekolah</p>
          <p className="font-semibold text-sm">{SCHOOL.name}</p>
          <p className="text-xs text-muted-foreground mt-2">{SCHOOL.address}</p>
        </Card>

        <Button variant="outline" className="w-full h-12" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />Keluar
        </Button>
      </main>
      <BottomNav />
    </div>
  );
}
