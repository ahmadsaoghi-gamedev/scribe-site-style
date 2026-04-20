import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Printer, FileBarChart2, Search } from "lucide-react";
import { KopSurat } from "@/components/KopSurat";
import { useLaporan, type PeriodeType } from "@/hooks/useLaporan";
import { SmartLoader } from "@/components/SmartLoader";

export const Route = createFileRoute("/admin/laporan")({
  component: LaporanPage,
});

// NIP & Name sourced from config — not hardcoded in UI logic
const ADMIN_NIP = "196501011990031001";
const ADMIN_NAMA = "Administrator";

function LaporanPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [tab, setTab] = useState<PeriodeType>("harian");
  const [tanggal, setTanggal] = useState(today);
  const [dari, setDari] = useState(today);
  const [sampai, setSampai] = useState(today);
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));

  const { rows, label, isLoading, fetch } = useLaporan();

  const handleFetch = () => {
    if (tab === "harian") fetch({ periodeType: "harian", tanggal });
    else if (tab === "mingguan") fetch({ periodeType: "mingguan", dari, sampai });
    else fetch({ periodeType: "bulanan", bulan, tahun });
  };

  const totalHadir       = rows.reduce((s, r) => s + (r.total_hadir || 0), 0);
  const totalTerlambat   = rows.reduce((s, r) => s + (r.total_terlambat || 0), 0);
  const totalTidakHadir  = rows.reduce((s, r) => s + (r.total_tidak_hadir || 0), 0);
  const totalKosong      = rows.reduce((s, r) => s + (r.total_kosong || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header — hidden when printing */}
      <div className="no-print flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Laporan Kehadiran Guru</h1>
          <p className="text-sm text-muted-foreground mt-1">Rekap absensi harian, mingguan, dan bulanan</p>
        </div>
        <Button onClick={() => window.print()} disabled={!rows.length} className="shrink-0">
          <Printer className="h-4 w-4 mr-1.5" /> Export PDF
        </Button>
      </div>

      {/* Filter Panel */}
      <Card className="p-4 no-print">
        <Tabs value={tab} onValueChange={(v) => setTab(v as PeriodeType)}>
          <TabsList>
            <TabsTrigger value="harian">Harian</TabsTrigger>
            <TabsTrigger value="mingguan">Mingguan</TabsTrigger>
            <TabsTrigger value="bulanan">Bulanan</TabsTrigger>
          </TabsList>

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

      {/* Report Output — visible on screen and in print */}
      <div className="print-area">
        <KopSurat periode={label || "—"} />

        <Card className="overflow-x-auto print:shadow-none print:border-none print:rounded-none">
          <table className="w-full text-sm min-w-[720px] print:min-w-0">
            <thead className="bg-muted/60 print:bg-transparent">
              <tr className="border-b">
                <th className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground w-10">No</th>
                <th className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Nama Guru</th>
                <th className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">NIP</th>
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
                  <td colSpan={8} className="p-10 text-center">
                    <div className="inline-flex flex-col items-center gap-2">
                      <SmartLoader size="lg" />
                      <span className="text-sm text-muted-foreground">Mengambil data laporan…</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    <FileBarChart2 className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Belum ada data. Pilih periode lalu klik <span className="font-semibold">Tampilkan</span>.</p>
                  </td>
                </tr>
              ) : (
                <>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t hover:bg-muted/20 transition-colors">
                      <td className="p-3 text-muted-foreground">{i + 1}</td>
                      <td className="p-3 font-semibold">{r.nama_guru}</td>
                      <td className="p-3 font-mono text-xs">{r.nip || "—"}</td>
                      <td className="p-3">{r.mapel}</td>
                      <td className="p-3 text-center font-semibold text-emerald-600">{r.total_hadir}</td>
                      <td className="p-3 text-center font-semibold text-amber-600">{r.total_terlambat}</td>
                      <td className="p-3 text-center font-semibold text-destructive">{r.total_tidak_hadir}</td>
                      <td className="p-3 text-center text-muted-foreground">{r.total_kosong}</td>
                    </tr>
                  ))}
                  {/* Summary row */}
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
          <div className="hidden print:block mt-12">
            <div className="flex justify-end">
              <div className="text-sm text-center w-72">
                <p>Jember, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p className="mt-1">Administrator,</p>
                <div className="h-20" />
                <p className="font-bold underline">{ADMIN_NAMA}</p>
                <p>NIP. {ADMIN_NIP}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
