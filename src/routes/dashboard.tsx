import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2 } from "lucide-react";
import { SchoolHeader } from "@/components/SchoolHeader";
import { BottomNav } from "@/components/BottomNav";
import { getSession } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const s = getSession();
      if (!s) throw redirect({ to: "/login" });
      if (s.role !== "petugas") throw redirect({ to: "/admin" });
    }
  },
  head: () => ({ meta: [{ title: "Dashboard Petugas — Absensi Guru" }] }),
  component: PetugasDashboard,
});

type Jadwal = { jam_ke: number; guru_id: string; nama_guru: string; mapel: string; jadwal_id: string };
const STATUS = ["Hadir", "Terlambat", "Tidak Hadir", "Kosong"] as const;

function PetugasDashboard() {
  const nav = useNavigate();
  const session = typeof window !== "undefined" ? getSession() : null;
  const today = new Date().toISOString().slice(0, 10);
  const tanggalLabel = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [sudahAbsen, setSudahAbsen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session?.kelas_id) return;
    (async () => {
      const [cek, jad] = await Promise.all([
        apiGet("cekAbsensi", { kelas_id: session.kelas_id!, tanggal: today }),
        apiGet("getJadwalHari", { kelas_id: session.kelas_id!, tanggal: today }),
      ]);
      setSudahAbsen(!!cek.sudah_absen);
      setJadwal(jad.jadwal || []);
      setLoading(false);
    })();
  }, []);

  const allFilled = jadwal.length > 0 && jadwal.every((j) => statuses[j.jadwal_id]);

  const submit = async () => {
    setSubmitting(true);
    const res = await apiPost("submitAbsensi", {
      tanggal: today,
      kelas_id: session?.kelas_id,
      petugas_id: session?.token,
      data: jadwal.map((j) => ({ jadwal_id: j.jadwal_id, guru_id: j.guru_id, jam_ke: j.jam_ke, status: statuses[j.jadwal_id] })),
    });
    setSubmitting(false);
    if (res.success) {
      toast.success("Absensi berhasil disimpan");
      setSudahAbsen(true);
      setPreviewOpen(false);
    } else {
      toast.error("Gagal menyimpan absensi");
    }
  };

  return (
    <div className="min-h-screen pb-32 lg:pb-0 bg-gradient-to-b from-accent/40 to-background">
      <Toaster richColors position="top-center" />
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <SchoolHeader subtitle={tanggalLabel} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4 text-[15px]">
        <Card className="p-4 bg-primary text-primary-foreground">
          <p className="text-xs opacity-80">Petugas Absensi</p>
          <p className="font-semibold">{session?.nama}</p>
          <p className="text-sm opacity-90 mt-1">Kelas: {session?.kelas_id}</p>
        </Card>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Memuat jadwal…</p>
        ) : sudahAbsen ? (
          <Card className="p-8 text-center border-primary/30 bg-accent/40">
            <Lock className="h-12 w-12 mx-auto text-primary mb-3" />
            <h2 className="font-bold text-lg">Absensi hari ini telah tersimpan</h2>
            <p className="text-sm text-muted-foreground mt-1">Data tidak dapat diubah lagi.</p>
          </Card>
        ) : jadwal.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">Tidak ada jadwal pelajaran hari ini.</Card>
        ) : (
          <>
            <h2 className="font-semibold text-foreground">Jadwal Hari Ini</h2>
            <div className="space-y-2">
              {jadwal.map((j) => (
                <Card key={j.jadwal_id} className="p-3 flex items-center gap-3">
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-accent text-primary flex flex-col items-center justify-center">
                    <span className="text-[10px] leading-none">JAM</span>
                    <span className="font-bold leading-none mt-0.5">{j.jam_ke}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm sm:text-base">{j.nama_guru}</p>
                    <p className="text-xs text-muted-foreground truncate">{j.mapel}</p>
                  </div>
                  <Select value={statuses[j.jadwal_id] || ""} onValueChange={(v) => setStatuses((s) => ({ ...s, [j.jadwal_id]: v }))}>
                    <SelectTrigger className="w-28 sm:w-36 h-11"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      {STATUS.map((s) => <SelectItem key={s} value={s} className="py-3">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Card>
              ))}
            </div>
            {/* Inline submit for tablet/desktop */}
            <Button className="w-full hidden sm:flex h-12" size="lg" disabled={!allFilled} onClick={() => setPreviewOpen(true)}>
              Preview & Submit
            </Button>
            {!allFilled && <p className="text-xs text-center text-muted-foreground">Isi semua status sebelum submit</p>}
          </>
        )}
      </main>

      {/* Floating submit (mobile only) */}
      {!loading && !sudahAbsen && jadwal.length > 0 && (
        <div className="sm:hidden fixed bottom-16 left-0 right-0 z-30 px-4 pb-2 pt-3 bg-gradient-to-t from-background via-background to-transparent no-print">
          <Button
            className="w-full h-12 shadow-lg rounded-xl"
            size="lg"
            disabled={!allFilled}
            onClick={() => setPreviewOpen(true)}
          >
            <CheckCircle2 className="h-5 w-5 mr-1" />
            Preview & Submit
          </Button>
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Preview Absensi</DialogTitle></DialogHeader>
          <div className="overflow-auto max-h-[60vh] sm:max-h-96 -mx-4 sm:mx-0">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2 text-left">Jam</th>
                  <th className="p-2 text-left">Guru</th>
                  <th className="p-2 text-left hidden sm:table-cell">Mapel</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {jadwal.map((j) => (
                  <tr key={j.jadwal_id} className="border-b">
                    <td className="p-2">{j.jam_ke}</td>
                    <td className="p-2">{j.nama_guru}</td>
                    <td className="p-2 hidden sm:table-cell">{j.mapel}</td>
                    <td className="p-2"><Badge variant="secondary">{statuses[j.jadwal_id]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11" onClick={() => setPreviewOpen(false)}>Kembali</Button>
            <Button className="h-11" onClick={submit} disabled={submitting}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {submitting ? "Menyimpan..." : "Submit Absensi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
