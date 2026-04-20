import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

export const Route = createFileRoute("/admin/jadwal")({
  component: JadwalPage,
});

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
const maxJam = (h: string) => (h === "Jumat" ? 6 : 9);

type Kelas = { id: string; nama_kelas: string };
type Guru = { id: string; nama: string; mapel: string; aktif: boolean };
type Slot = { id: string; hari: string; jam_ke: number; guru_id: string; nama_guru: string; mapel: string };

function JadwalPage() {
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [guru, setGuru] = useState<Guru[]>([]);
  const [kelasId, setKelasId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [edit, setEdit] = useState<{ hari: string; jam_ke: number; guru_id: string; mapel: string } | null>(null);

  useEffect(() => {
    apiGet("getKelas").then((r) => { if (r.success) { setKelas(r.data); setKelasId(r.data[0]?.id || ""); }});
    apiGet("getGuru").then((r) => r.success && setGuru(r.data));
  }, []);

  useEffect(() => {
    if (!kelasId) return;
    // BACKEND DEV: getJadwal
    apiGet("getJadwal", { kelas_id: kelasId }).then((r) => r.success && setSlots(r.data));
  }, [kelasId]);

  const cellOf = (h: string, j: number) => slots.find((s) => s.hari === h && s.jam_ke === j);

  const save = async () => {
    if (!edit) return;
    // BACKEND DEV: setJadwal
    const r = await apiPost("setJadwal", { kelas_id: kelasId, ...edit });
    if (r.success) {
      toast.success("Jadwal disimpan");
      setEdit(null);
      const j = await apiGet("getJadwal", { kelas_id: kelasId });
      if (j.success) setSlots(j.data);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Jadwal Pelajaran</h1>
        <p className="text-sm text-muted-foreground">Atur jadwal guru per kelas</p>
      </div>

      <Card className="p-4">
        <Label>Pilih Kelas</Label>
        <Select value={kelasId} onValueChange={setKelasId}>
          <SelectTrigger className="w-full sm:w-64 mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {kelas.map((k) => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left w-16">Jam</th>
              {HARI.map((h) => <th key={h} className="p-2 text-left min-w-[160px]">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 9 }, (_, i) => i + 1).map((j) => (
              <tr key={j} className="border-t">
                <td className="p-2 font-semibold bg-accent/30">Jam {j}</td>
                {HARI.map((h) => {
                  if (j > maxJam(h)) return <td key={h} className="p-2 text-muted-foreground/40 italic">—</td>;
                  const c = cellOf(h, j);
                  return (
                    <td key={h} className="p-2">
                      <button
                        onClick={() => setEdit({ hari: h, jam_ke: j, guru_id: c?.guru_id || "", mapel: c?.mapel || "" })}
                        className="text-left w-full p-2 rounded-md hover:bg-accent transition group"
                      >
                        {c ? (
                          <>
                            <p className="font-medium truncate">{c.nama_guru}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.mapel}</p>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">+ Atur</span>
                        )}
                        <Pencil className="h-3 w-3 inline opacity-0 group-hover:opacity-50 ml-1" />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atur Jadwal — {edit?.hari} Jam ke-{edit?.jam_ke}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div>
                <Label>Guru</Label>
                <Select value={edit.guru_id} onValueChange={(v) => {
                  const g = guru.find((x) => x.id === v);
                  setEdit({ ...edit, guru_id: v, mapel: edit.mapel || g?.mapel || "" });
                }}>
                  <SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger>
                  <SelectContent>{guru.filter((g) => g.aktif).map((g) => <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Mata Pelajaran</Label><Input value={edit.mapel} onChange={(e) => setEdit({ ...edit, mapel: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Batal</Button><Button onClick={save}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
