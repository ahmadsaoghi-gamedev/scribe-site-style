import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SchoolHeader } from "@/components/SchoolHeader";
import { BottomNav } from "@/components/BottomNav";
import { getSession } from "@/lib/auth";
import { useRiwayat } from "@/hooks/useRiwayat";
import { SmartLoader } from "@/components/SmartLoader";
import { History, CheckCircle2, AlertCircle } from "lucide-react";

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

const STATUS_ICON: Record<string, React.ReactNode> = {
  Selesai: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  default: <AlertCircle className="h-4 w-4 text-amber-500" />,
};

function RiwayatPage() {
  const { items, isLoading, error } = useRiwayat();

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    for (const item of items) {
      const key = item.tanggal.slice(0, 7); // YYYY-MM
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [items]);

  const formatMonthLabel = (ym: string) => {
    const [y, m] = ym.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-0 bg-gradient-to-b from-accent/40 to-background">
      <Toaster richColors position="top-center" />
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <SchoolHeader subtitle="Riwayat Absensi" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="font-black text-lg">Riwayat Submit Absensi</h2>
        </div>

        {error && (
          <Card className="p-4 border-destructive/30 bg-destructive/5 text-sm text-destructive">
            Gagal memuat riwayat: {(error as any).message}
          </Card>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <SmartLoader size="lg" />
            <p className="text-sm text-muted-foreground">Memuat riwayat…</p>
          </div>
        ) : items.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Belum ada riwayat absensi</p>
            <p className="text-xs mt-1">Riwayat akan muncul setelah Anda menyimpan absensi.</p>
          </Card>
        ) : (
          Object.entries(groupedByMonth)
            .sort(([a], [b]) => b.localeCompare(a)) // newest month first
            .map(([monthKey, monthItems]) => (
              <div key={monthKey} className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">
                  {formatMonthLabel(monthKey)}
                </p>
                {monthItems
                  .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
                  .map((item) => (
                    <Card key={item.tanggal} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        {STATUS_ICON[item.status] ?? STATUS_ICON.default}
                        <div>
                          <p className="font-semibold text-sm">
                            {new Date(item.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
                              weekday: "long", day: "numeric", month: "long",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.total} jam pelajaran tercatat</p>
                        </div>
                      </div>
                      <Badge variant={item.status === "Selesai" ? "default" : "secondary"}>
                        {item.status}
                      </Badge>
                    </Card>
                  ))}
              </div>
            ))
        )}
      </main>
      <BottomNav />
    </div>
  );
}
