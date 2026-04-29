import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Printer, FileBarChart2, Search, Settings } from "lucide-react";
import { KopSurat } from "@/components/KopSurat";
import { useLaporan, type PeriodeType } from "@/hooks/useLaporan";
import { getSession, SCHOOL } from "@/lib/auth";
import { useKelas } from "@/hooks/useKelas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSchoolSettings, saveSchoolSettings, type SchoolSettings } from "@/lib/schoolSettings";
import { SmartLoader } from "@/components/SmartLoader";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/laporan")({
  component: LaporanPage,
});

function LaporanPage() {
  const session = useMemo(() => getSession(), []);
  const today = new Date().toISOString().slice(0, 10);
  const [tab, setTab] = useState<PeriodeType>("harian");
  const [tanggal, setTanggal] = useState(today);
  const [dari, setDari] = useState(today);
  const [sampai, setSampai] = useState(today);
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));

  const { rows, label, isLoading, fetch } = useLaporan();
  const { kelas: kelasList } = useKelas();
  const [selectedKelasId, setSelectedKelasId] = useState<string>("__all__");

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<SchoolSettings>(() => getSchoolSettings());
  const [draft, setDraft] = useState<{ kepalaSekolah: SchoolSettings["kepalaSekolah"]; operatorNip: string }>({
    kepalaSekolah: settings.kepalaSekolah,
    operatorNip: settings.operatorNip,
  });

  const openSettings = () => {
    setDraft({ kepalaSekolah: { ...settings.kepalaSekolah }, operatorNip: settings.operatorNip });
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    const next: SchoolSettings = { kepalaSekolah: draft.kepalaSekolah, operatorNip: draft.operatorNip };
    saveSchoolSettings(next);
    setSettings(next);
    setSettingsOpen(false);
    toast.success("Pengaturan tanda tangan disimpan.");
  };

  const handleFetch = () => {
    const kelasId = selectedKelasId === "__all__" ? undefined : selectedKelasId;
    const namaKelas = kelasList.find((k) => k.id === kelasId)?.nama_kelas;
    if (tab === "harian") fetch({ periodeType: "harian", tanggal, kelas_id: kelasId, nama_kelas: namaKelas });
    else if (tab === "mingguan") fetch({ periodeType: "mingguan", dari, sampai, kelas_id: kelasId, nama_kelas: namaKelas });
    else fetch({ periodeType: "bulanan", bulan, tahun, kelas_id: kelasId, nama_kelas: namaKelas });
  };

  const totalHadir      = rows.reduce((s, r) => s + (r.total_hadir || 0), 0);
  const totalTerlambat  = rows.reduce((s, r) => s + (r.total_terlambat || 0), 0);
  const totalTidakHadir = rows.reduce((s, r) => s + (r.total_tidak_hadir || 0), 0);
  const totalKosong     = rows.reduce((s, r) => s + (r.total_kosong || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="no-print flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Laporan Kehadiran Guru</h1>
          <p className="text-sm text-muted-foreground mt-1">Rekap absensi harian, mingguan, dan bulanan</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={openSettings}>
            <Settings className="h-4 w-4 mr-1.5" /> Pengaturan TTD
          </Button>
          <Button onClick={() => window.print()} disabled={!rows.length}>
            <Printer className="h-4 w-4 mr-1.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pengaturan Tanda Tangan Laporan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kepala Sekolah</p>
            <div className="space-y-1.5">
              <Label>Jabatan</Label>
              <Input
                value={draft.kepalaSekolah.jabatan}
                onChange={(e) => setDraft((d) => ({ ...d, kepalaSekolah: { ...d.kepalaSekolah, jabatan: e.target.value } }))}
                placeholder="Kepala Madrasah"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nama</Label>
              <Input
                value={draft.kepalaSekolah.nama}
                onChange={(e) => setDraft((d) => ({ ...d, kepalaSekolah: { ...d.kepalaSekolah, nama: e.target.value } }))}
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                NIP{" "}
                <span className="text-muted-foreground font-normal text-xs">(kosongkan jika tidak ada)</span>
              </Label>
              <Input
                value={draft.kepalaSekolah.nip}
                onChange={(e) => setDraft((d) => ({ ...d, kepalaSekolah: { ...d.kepalaSekolah, nip: e.target.value } }))}
                placeholder="— tidak ada NIP —"
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Operator / Yang Membuat</p>
              <div className="space-y-1.5">
                <Label>
                  NIP Operator{" "}
                  <span className="text-muted-foreground font-normal text-xs">(kosongkan jika tidak ada)</span>
                </Label>
                <Input
                  value={draft.operatorNip}
                  onChange={(e) => setDraft((d) => ({ ...d, operatorNip: e.target.value }))}
                  placeholder="— tidak ada NIP —"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>Batal</Button>
            <Button onClick={saveSettings}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Panel */}
      <Card className="p-4 no-print">
        <Tabs value={tab} onValueChange={(v) => setTab(v as PeriodeType)}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <TabsList>
              <TabsTrigger value="harian">Harian</TabsTrigger>
              <TabsTrigger value="mingguan">Mingguan</TabsTrigger>
              <TabsTrigger value="bulanan">Bulanan</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Label className="text-xs shrink-0">Kelas</Label>
              <Select value={selectedKelasId} onValueChange={setSelectedKelasId}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua Kelas</SelectItem>
                  {kelasList.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="harian" className="mt-4 flex gap-3 items-end flex-wrap">
            <div className="space-y-1.5">
              <Label htmlFor="laporan-tanggal">Tanggal</Label>
              <Input id="laporan-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-44" />
            </div>
            <Button onClick={handleFetch} disabled={isLoading}>
              {isLoading ? <SmartLoader size="sm" className="mr-2" /> : <Search className="h-4 w-4 mr-1.5" />}
              Tampilkan
            </Button>
          </TabsContent>

          <TabsContent value="mingguan" className="mt-4 flex gap-3 items-end flex-wrap">
            <div className="space-y-1.5">
              <Label htmlFor="laporan-dari">Dari</Label>
              <Input id="laporan-dari" type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="w-44" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="laporan-sampai">Sampai</Label>
              <Input id="laporan-sampai" type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="w-44" />
            </div>
            <Button onClick={handleFetch} disabled={isLoading}>
              {isLoading ? <SmartLoader size="sm" className="mr-2" /> : <Search className="h-4 w-4 mr-1.5" />}
              Tampilkan
            </Button>
          </TabsContent>

          <TabsContent value="bulanan" className="mt-4 flex gap-3 items-end flex-wrap">
            <div className="space-y-1.5">
              <Label htmlFor="laporan-bulan">Bulan (01–12)</Label>
              <Input id="laporan-bulan" value={bulan} onChange={(e) => setBulan(e.target.value)} className="w-20" maxLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="laporan-tahun">Tahun</Label>
              <Input id="laporan-tahun" value={tahun} onChange={(e) => setTahun(e.target.value)} className="w-24" maxLength={4} />
            </div>
            <Button onClick={handleFetch} disabled={isLoading}>
              {isLoading ? <SmartLoader size="sm" className="mr-2" /> : <Search className="h-4 w-4 mr-1.5" />}
              Tampilkan
            </Button>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Report Output */}
      <div className="print-area">
        <KopSurat periode={label || "—"} />

        <Card className="overflow-x-auto print:shadow-none print:border-none print:rounded-none">
          <table className="w-full text-sm min-w-[820px] print:min-w-0">
            <thead className="bg-muted/60 print:bg-transparent">
              <tr className="border-b">
                <th className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground w-10">No</th>
                <th className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Nama Guru</th>
                <th className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">NIP</th>
                <th className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Kelas</th>
                <th className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Mapel</th>
                <th className="p-3 text-center font-semibold text-xs uppercase tracking-wide text-emerald-600">Hadir</th>
                <th className="p-3 text-center font-semibold text-xs uppercase tracking-wide text-amber-600">Terlambat</th>
                <th className="p-3 text-center font-semibold text-xs uppercase tracking-wide text-destructive">Tidak Hadir</th>
                <th className="p-3 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Kosong</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center">
                    <div className="inline-flex flex-col items-center gap-2">
                      <SmartLoader size="lg" />
                      <span className="text-sm text-muted-foreground">Mengambil data laporan…</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center">
                    <FileBarChart2 className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      Belum ada data. Pilih periode lalu klik <span className="font-semibold">Tampilkan</span>.
                    </p>
                  </td>
                </tr>
              ) : (
                <>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t hover:bg-muted/20 transition-colors">
                      <td className="p-3 text-muted-foreground">{i + 1}</td>
                      <td className="p-3 font-semibold">{r.nama_guru}</td>
                      <td className="p-3 font-mono text-xs">{r.nip || "—"}</td>
                      <td className="p-3 text-xs">{r.nama_kelas || "—"}</td>
                      <td className="p-3">{r.mapel}</td>
                      <td className="p-3 text-center font-semibold text-emerald-600">{r.total_hadir}</td>
                      <td className="p-3 text-center font-semibold text-amber-600">{r.total_terlambat}</td>
                      <td className="p-3 text-center font-semibold text-destructive">{r.total_tidak_hadir}</td>
                      <td className="p-3 text-center text-muted-foreground">{r.total_kosong}</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/40 font-bold">
                    <td className="p-3" colSpan={4}>Total</td>
                    <td className="p-3 text-center text-emerald-600">{totalHadir}</td>
                    <td className="p-3 text-center text-amber-600">{totalTerlambat}</td>
                    <td className="p-3 text-center text-destructive">{totalTidakHadir}</td>
                    <td className="p-3 text-center text-muted-foreground">{totalKosong}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </Card>

        {/* Print Signature Block */}
        {rows.length > 0 && (
          <div className="hidden print:block mt-12 px-2">
            <p className="text-sm mb-8">
              {SCHOOL.kota},{" "}
              {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <div className="flex justify-between">
              <div className="text-sm text-center w-60">
                <p>Mengetahui,</p>
                <p className="font-semibold">{settings.kepalaSekolah.jabatan}</p>
                <div className="h-20" />
                <p className="font-bold underline">{settings.kepalaSekolah.nama}</p>
                {settings.kepalaSekolah.nip && (
                  <p>NIP. {settings.kepalaSekolah.nip}</p>
                )}
              </div>
              <div className="text-sm text-center w-60">
                <p>Yang Membuat,</p>
                <p className="font-semibold">Operator Madrasah</p>
                <div className="h-20" />
                <p className="font-bold underline">{session?.nama ?? "Administrator"}</p>
                {settings.operatorNip && (
                  <p>NIP. {settings.operatorNip}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
