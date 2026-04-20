import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Users, School, ClipboardCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminStats } from "@/hooks/useAdminStats";
import { SmartLoader } from "@/components/SmartLoader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

const STAT_CARDS = [
  { key: "total_guru",          label: "Total Guru Aktif",           icon: Users,          color: "from-primary to-primary/80",       shadow: "shadow-primary/20" },
  { key: "total_kelas",         label: "Total Kelas",                icon: School,         color: "from-emerald-600 to-emerald-500",   shadow: "shadow-emerald-600/20" },
  { key: "kelas_sudah_absen",   label: "Kelas Sudah Absen Hari Ini", icon: ClipboardCheck, color: "from-teal-600 to-teal-500",         shadow: "shadow-teal-600/20" },
] as const;

function AdminOverview() {
  const { stats, isLoading, error } = useAdminStats();

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{today}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Gagal memuat statistik: {(error as any).message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const raw = stats[card.key as keyof typeof stats];
          const value = card.key === "kelas_sudah_absen"
            ? `${raw} / ${stats.total_kelas}`
            : raw;

          return (
            <Card
              key={card.key}
              className={cn(
                "p-5 flex items-center gap-4 overflow-hidden relative transition-all hover:shadow-lg",
                card.shadow
              )}
            >
              <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shrink-0 shadow-lg`}>
                <Icon className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{card.label}</p>
                {isLoading ? (
                  <SmartLoader size="sm" className="mt-2" />
                ) : (
                  <p className="text-3xl font-black mt-0.5">{value}</p>
                )}
              </div>
              {/* Decorative bg shape */}
              <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${card.color} opacity-5`} />
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3" />
        <span>Data diperbarui otomatis setiap 2 menit</span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs ml-auto" onClick={() => window.location.reload()}>
          Perbarui Sekarang
        </Button>
      </div>
    </div>
  );
}
