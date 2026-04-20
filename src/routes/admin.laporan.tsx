import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Printer } from "lucide-react";
import { KopSurat } from "@/components/KopSurat";
import { apiGet } from "@/lib/api";

export const Route = createFileRoute("/admin/laporan")({
  component: LaporanPage,
});

type Row = { nama_guru: string; nip: string; mapel: string; total_hadir: number; total_terlambat: number; total_tidak_hadir: number; total_kosong: number };

// NIP Admin (sesuai data dummy USERS — admin)
const ADMIN_NIP = "196501011990031001";
const ADMIN_NAMA = "Administrator";

function LaporanPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [tab, setTab] = useState("harian");
  const [tanggal, setTanggal] = useState(today);
  const [dari, setDari] = useState(today);
  const [sampai, setSampai] = useState(today);
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [rows, setRows] = useState<Row[]>([]);
  const [periode, setPeriode] = useState("");

  const fetchData = async () => {
    let res, p = "";
    if (tab === "harian") {
      // BACKEND DEV: laporanHarian
      res = await apiGet("laporanHarian", { tanggal });
      p = `Harian — ${tanggal}`;
    } else if (tab === "mingguan") {
      // BACKEND DEV: laporanMingguan
      res = await apiGet("laporanMingguan", { dari, sampai });
      p = `Mingguan — ${dari} s/d ${sampai}`;
    } else {
      // BACKEND DEV: laporanBulanan
      res = await apiGet("laporanBulanan", { bulan, tahun });
      p = `Bulanan — ${bulan}/${tahun}`;
    }
    if (res?.success) { setRows(res.data); setPeriode(p); }
  };

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan Kehadiran Guru</h1>
          <p className="text-sm text-muted-foreground">Rekap absensi harian, mingguan, dan bulanan</p>
        </div>
        <Button onClick={() => window.print()} disabled={!rows.length}><Printer className="h-4 w-4 mr-1" />Export PDF</Button>
      </div>

      <Card className="p-4 no-print">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="harian">Harian</TabsTrigger>
            <TabsTrigger value="mingguan">Mingguan</TabsTrigger>
            <TabsTrigger value="bulanan">Bulanan</TabsTrigger>
          </TabsList>
          <TabsContent value="harian" className="mt-4 flex gap-3 items-end flex-wrap">
            <div><Label>Tanggal</Label><Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></div>
            <Button onClick={fetchData}>Tampilkan</Button>
          </TabsContent>
          <TabsContent value="mingguan" className="mt-4 flex gap-3 items-end flex-wrap">
            <div><Label>Dari</Label><Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} /></div>
            <div><Label>Sampai</Label><Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} /></div>
            <Button onClick={fetchData}>Tampilkan</Button>
          </TabsContent>
          <TabsContent value="bulanan" className="mt-4 flex gap-3 items-end flex-wrap">
            <div><Label>Bulan</Label><Input value={bulan} onChange={(e) => setBulan(e.target.value)} className="w-20" /></div>
            <div><Label>Tahun</Label><Input value={tahun} onChange={(e) => setTahun(e.target.value)} className="w-24" /></div>
            <Button onClick={fetchData}>Tampilkan</Button>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="print-area">
        <KopSurat periode={periode || "—"} />
        <Card className="overflow-x-auto print:shadow-none print:border-0">
          <table className="w-full text-sm table-sticky-col min-w-[720px] print:min-w-0">
            <thead className="bg-muted print:bg-transparent">
              <tr className="border-b">
                <th className="p-2 text-left">No</th>
                <th className="p-2 text-left">Nama Guru</th>
                <th className="p-2 text-left">NIP</th>
                <th className="p-2 text-left">Mapel</th>
                <th className="p-2 text-center">Hadir</th>
                <th className="p-2 text-center">Terlambat</th>
                <th className="p-2 text-center">Tidak Hadir</th>
                <th className="p-2 text-center">Kosong</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Belum ada data. Pilih periode lalu klik Tampilkan.</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{r.nama_guru}</td>
                  <td className="p-2 font-mono text-xs">{r.nip}</td>
                  <td className="p-2">{r.mapel}</td>
                  <td className="p-2 text-center">{r.total_hadir}</td>
                  <td className="p-2 text-center">{r.total_terlambat}</td>
                  <td className="p-2 text-center">{r.total_tidak_hadir}</td>
                  <td className="p-2 text-center">{r.total_kosong}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Tanda tangan admin (hanya tampil saat cetak) */}
        {rows.length > 0 && (
          <div className="hidden print:block mt-10">
            <div className="flex justify-end">
              <div className="text-sm text-center w-72">
                <p>Jember, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p>Administrator,</p>
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
