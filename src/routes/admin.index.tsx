import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, School, ClipboardCheck } from "lucide-react";
import { apiGet } from "@/lib/api";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const [stats, setStats] = useState({ total_guru: 0, total_kelas: 0, kelas_sudah_absen: 0 });

  useEffect(() => {
    // BACKEND DEV: GET getRekapHariIni
    apiGet("getRekapHariIni").then((r) => r.success && setStats(r));
  }, []);

  const cards = [
    { label: "Total Guru Aktif", value: stats.total_guru, icon: Users, color: "bg-primary" },
    { label: "Total Kelas", value: stats.total_kelas, icon: School, color: "bg-emerald-600" },
    { label: "Kelas Sudah Absen Hari Ini", value: `${stats.kelas_sudah_absen} / ${stats.total_kelas}`, icon: ClipboardCheck, color: "bg-teal-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Ringkasan absensi hari ini</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-5 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-lg ${c.color} text-white flex items-center justify-center`}>
              <c.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-2xl font-bold">{c.value}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
