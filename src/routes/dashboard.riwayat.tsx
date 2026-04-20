import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SchoolHeader } from "@/components/SchoolHeader";
import { BottomNav } from "@/components/BottomNav";
import { getSession } from "@/lib/auth";
import { apiGet } from "@/lib/api";

export const Route = createFileRoute("/dashboard/riwayat")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const s = getSession();
      if (!s) throw redirect({ to: "/login" });
      if (s.role !== "petugas") throw redirect({ to: "/admin" });
    }
  },
  head: () => ({ meta: [{ title: "Riwayat — Absensi Guru" }] }),
  component: RiwayatPage,
});

type Item = { tanggal: string; total: number; status: string };

function RiwayatPage() {
  const session = typeof window !== "undefined" ? getSession() : null;
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.kelas_id) return;
    apiGet("getRiwayat", { kelas_id: session.kelas_id })
      .then((r) => { if (r?.success) setItems(r.data || []); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pb-20 lg:pb-0 bg-gradient-to-b from-accent/40 to-background">
      <Toaster richColors position="top-center" />
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <SchoolHeader subtitle="Riwayat Absensi" />
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 space-y-3">
        <h2 className="font-semibold">Riwayat Submit</h2>
        {loading ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Memuat…</p>
        ) : items.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">Belum ada riwayat absensi.</Card>
        ) : (
          items.map((it) => (
            <Card key={it.tanggal} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{it.tanggal}</p>
                <p className="text-xs text-muted-foreground">{it.total} jam pelajaran</p>
              </div>
              <Badge>{it.status}</Badge>
            </Card>
          ))
        )}
      </main>
      <BottomNav />
    </div>
  );
}
