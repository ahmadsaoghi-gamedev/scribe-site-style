import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2, RefreshCw, AlertTriangle, LogOut } from "lucide-react";
import { SchoolHeader } from "@/components/SchoolHeader";
import { BottomNav } from "@/components/BottomNav";
import { getSession } from "@/lib/auth";
import { useAbsensi } from "@/hooks/useAbsensi";
import { useAuth } from "@/hooks/useAuth";
import { SmartLoader, FullPageLoader } from "@/components/SmartLoader";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const s = getSession();
      if (!s) throw redirect({ to: "/login" });
      if (s.role !== "petugas") throw redirect({ to: "/admin" });
    }
  },
  head: () => ({ meta: [{ title: "Dashboard Petugas — Digital Attendance" }] }),
  component: PetugasDashboard,
});

const STATUS_OPTS = ["Hadir", "Terlambat", "Tidak Hadir", "Kosong"] as const;

function PetugasDashboard() {
  const session = useMemo(() => (typeof window !== "undefined" ? getSession() : null), []);
  const [today, dateLabel] = useMemo(() => {
    const d = new Date();
    return [
      d.toISOString().slice(0, 10),
      d.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    ];
  }, []);

  const { data, isLoading, isSubmitting, submit } = useAbsensi(session?.kelas_id, today);
  const { logout } = useAuth();
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);

  const jadwal = data?.jadwal || [];
  const sudahAbsen = data?.sudah_absen || false;
  const allFilled = jadwal.length > 0 && jadwal.every((j) => statuses[j.jadwal_id]);

  const handleSubmit = async () => {
    try {
      await submit({
        tanggal: today,
        kelas_id: session?.kelas_id!,
        data: jadwal.map((j) => ({ 
          jadwal_id: j.jadwal_id, 
          guru_id: j.guru_id, 
          jam_ke: j.jam_ke, 
          status: statuses[j.jadwal_id] 
        })),
      });
      setPreviewOpen(false);
    } catch (e) {
      // Invalidation and toast handled by hook
    }
  };

  if (!session?.kelas_id) return (
    <div className="min-h-screen pb-32 lg:pb-0 bg-gradient-to-b from-accent/30 via-background to-background animate-in fade-in duration-1000 flex flex-col">
      <header className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-20 shadow-sm transition-all duration-300">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <SchoolHeader subtitle={dateLabel}>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 font-bold text-xs uppercase" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" /> KELUAR
            </Button>
          </SchoolHeader>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 flex-1 flex flex-col items-center justify-center text-center">
        <div className="h-24 w-24 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-6">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-black mb-2">Belum Ditugaskan</h2>
        <p className="text-muted-foreground max-w-sm mx-auto mb-8">
          Akun Anda belum dipetakan ke kelas manapun di sistem. Silakan hubungi Administrator sekolah untuk mengatur penugasan kelas Anda sebelum dapat melakukan pengisian absensi.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4 mr-2" />Coba Lagi</Button>
      </main>
      <BottomNav />
    </div>
  );

  if (isLoading) return <FullPageLoader label="Sinkronisasi Status Absensi..." />;

  return (
    <div className="min-h-screen pb-32 lg:pb-0 bg-gradient-to-b from-accent/30 via-background to-background animate-in fade-in duration-1000">
      <Toaster richColors position="top-center" />
      
      <header className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-20 shadow-sm transition-all duration-300">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <SchoolHeader subtitle={dateLabel}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10 font-bold text-xs uppercase"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-1" /> KELUAR
            </Button>
          </SchoolHeader>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        {/* User profile card with a glassmorphism touch */}
        <Card className="p-5 bg-primary shadow-2xl shadow-primary/20 border-none text-primary-foreground relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Otoritas Kelas</p>
            <h2 className="text-xl font-black">{session?.nama}</h2>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                Kls: {session?.kelas_id}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md italic">
                {sudahAbsen ? "Tersinkron" : "Perlu Input"}
              </Badge>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
        </Card>

        {sudahAbsen ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-500">
            <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 ring-8 ring-green-500/5">
              <Lock className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight">Selesai Sinkronisasi</h2>
              <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
                Laporan absensi kelas Anda untuk tanggal {dateLabel} telah tersimpan secara permanen.
              </p>
            </div>
            <Button variant="outline" className="rounded-full px-8 shadow-sm" onClick={() => window.location.reload()}>
              Perbarui Data <RefreshCw className="h-3 w-3 ml-2" />
            </Button>
          </div>
        ) : jadwal.length === 0 ? (
          <div className="py-20 text-center space-y-3 grayscale opacity-60">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="font-medium">Tidak ada jadwal pelajaran.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-lg tracking-tight uppercase text-primary/80">Input Absensi</h3>
              <span className="text-[10px] font-bold text-muted-foreground">{jadwal.length} SESI</span>
            </div>
            
            <div className="grid gap-3">
              {jadwal.map((j, idx) => (
                <Card 
                  key={j.jadwal_id} 
                  className={`p-3 flex items-center gap-4 transition-all duration-300 border-none ring-1 ${
                    statuses[j.jadwal_id] ? "ring-primary shadow-lg shadow-primary/5 bg-primary/5" : "ring-border shadow-sm"
                  }`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="h-12 w-12 rounded-xl bg-accent flex flex-col items-center justify-center shrink-0 border-b-2 border-primary/20 shadow-inner">
                    <span className="text-[8px] font-black leading-none opacity-60">JAM</span>
                    <span className="text-xl font-black leading-none mt-1">{j.jam_ke}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate text-base leading-tight">{j.nama_guru}</p>
                    <p className="text-xs text-muted-foreground font-medium truncate uppercase tracking-tighter">{j.mapel}</p>
                  </div>
                  <Select 
                    value={statuses[j.jadwal_id] || ""} 
                    onValueChange={(v) => setStatuses((s) => ({ ...s, [j.jadwal_id]: v }))}
                  >
                    <SelectTrigger className="w-24 sm:w-32 h-11 bg-background/50 border-none ring-1 ring-border/50 font-bold text-xs uppercase transition-all focus:ring-primary focus:bg-background shadow-sm">
                      <SelectValue placeholder="STATUS" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTS.map((s) => (
                        <SelectItem key={s} value={s} className="font-bold text-xs py-3">{s.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>
              ))}
            </div>

            <div className="pt-4 pb-20">
              <Button 
                className="w-full h-14 rounded-2xl text-lg font-black tracking-wider uppercase shadow-xl shadow-primary/30 transition-transform active:scale-95 group"
                disabled={!allFilled} 
                onClick={() => setPreviewOpen(true)}
              >
                <CheckCircle2 className="h-6 w-6 mr-2 group-hover:animate-bounce" />
                Submit Laporan
              </Button>
              {!allFilled && (
                <p className="text-[10px] text-center text-muted-foreground mt-3 font-bold tracking-widest uppercase">
                  Lengkapi semua jam pelajaran untuk mengaktifkan sinkronisasi
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg border-none shadow-2xl ring-1 ring-border/50 rounded-3xl">
          <div className="bg-primary/5 -m-6 p-6 mb-2 rounded-t-3xl border-b ring-1 ring-primary/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-primary uppercase tracking-tighter">Konfirmasi Sinkronisasi</DialogTitle>
            </DialogHeader>
            <p className="text-xs font-bold text-muted-foreground mt-1 tracking-wide uppercase">Tinjau kembali data sebelum pengiriman permanen</p>
          </div>
          
          <div className="mt-4 space-y-1">
            {jadwal.map((j) => (
              <div key={j.jadwal_id} className="flex items-center justify-between py-2.5 border-b border-dashed last:border-0 px-2">
                <div className="flex items-center gap-3">
                  <span className="font-black text-primary bg-primary/10 h-7 w-7 rounded-lg flex items-center justify-center text-xs">{j.jam_ke}</span>
                  <span className="text-sm font-bold truncate max-w-[140px] sm:max-w-[200px]">{j.nama_guru}</span>
                </div>
                <Badge className="font-black text-[10px] px-3 py-1 rounded-full">{statuses[j.jadwal_id]}</Badge>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button variant="ghost" className="h-12 flex-1 rounded-xl font-bold uppercase text-xs" onClick={() => setPreviewOpen(false)}>Kembali</Button>
            <Button className="h-12 flex-1 rounded-xl font-black uppercase text-xs shadow-lg shadow-primary/20" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {isSubmitting ? "Sinkronisasi..." : "Konfirmasi & Kirim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

import { toast } from "sonner";
