import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Pencil, Calendar } from "lucide-react";
import { useJadwal, type JadwalSlot } from "@/hooks/useJadwal";
import { useKelas } from "@/hooks/useKelas";
import { useGuru } from "@/hooks/useGuru";
import { SmartLoader } from "@/components/SmartLoader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/jadwal")({
  component: JadwalPage,
});

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
type Hari = (typeof HARI)[number];

/** Deterministic hue from mapel name — same mapel always gets same color */
function mapelHue(mapel: string): number {
  let hash = 0;
  for (let i = 0; i < mapel.length; i++) {
    hash = (hash * 31 + mapel.charCodeAt(i)) & 0xffff;
  }
  return hash % 360;
}

function mapelStyle(mapel: string): React.CSSProperties {
  const hue = mapelHue(mapel);
  return {
    backgroundColor: `hsl(${hue}, 60%, 93%)`,
    borderColor: `hsl(${hue}, 55%, 72%)`,
    color: `hsl(${hue}, 55%, 28%)`,
  };
}

/** Jumat has a shorter school day */
const maxJam = (h: Hari) => (h === "Jumat" ? 6 : 9);

type EditState = { hari: Hari; jam_ke: number; guru_id: string; mapel: string };

function JadwalPage() {
  const { kelas: kelasList, isLoading: isLoadingKelas } = useKelas();
  const { gurus, isLoading: isLoadingGuru } = useGuru();

  const [kelasId, setKelasId] = useState("");
  const { slots, isLoading: isLoadingSlots, isSaving, setSlot } = useJadwal(kelasId);

  const [edit, setEdit] = useState<EditState | null>(null);

  const cellOf = (h: Hari, j: number): JadwalSlot | undefined =>
    slots.find((s) => s.hari === h && s.jam_ke === j);

  const handleSave = async () => {
    if (!edit || !kelasId || !edit.guru_id) return;
    try {
      await setSlot({ kelas_id: kelasId, ...edit });
      setEdit(null);
    } catch {
      // Error toast handled by hook
    }
  };

  const activeGurus = gurus.filter((g) => g.aktif);
  const isReady = !isLoadingKelas && !isLoadingGuru;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Jadwal Pelajaran</h1>
        <p className="text-sm text-muted-foreground mt-1">Atur jadwal guru per kelas — klik sel untuk mengedit</p>
      </div>

      <Card className="p-4">
        <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Pilih Kelas</Label>
        <div className="flex gap-3 mt-2 flex-wrap">
          <Select
            value={kelasId}
            onValueChange={(v) => setKelasId(v)}
            disabled={isLoadingKelas}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder={isLoadingKelas ? "Memuat kelas…" : "Pilih kelas"} />
            </SelectTrigger>
            <SelectContent>
              {kelasList.map((k) => (
                <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {!kelasId ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Pilih kelas terlebih dahulu</p>
          <p className="text-xs mt-1">Jadwal pelajaran akan ditampilkan di sini.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {isLoadingSlots && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b text-xs text-primary font-medium">
              <SmartLoader size="sm" /> Memuat jadwal…
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground w-16">Jam</th>
                  {HARI.map((h) => (
                    <th key={h} className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground min-w-[160px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 9 }, (_, i) => i + 1).map((j) => (
                  <tr key={j} className="border-t">
                    <td className="p-3 font-black text-xs bg-muted/30 text-center">{j}</td>
                    {HARI.map((h) => {
                      if (j > maxJam(h)) {
                        return <td key={h} className="p-3 bg-muted/10"><div className="text-muted-foreground/30 text-center text-lg">—</div></td>;
                      }
                      const cell = cellOf(h, j);
                      return (
                        <td key={h} className="p-2">
                          <button
                            onClick={() => setEdit({ hari: h, jam_ke: j, guru_id: cell?.guru_id || "", mapel: cell?.mapel || "" })}
                            className={cn(
                              "text-left w-full p-2 rounded-lg border transition-all group relative",
                              cell ? "border hover:opacity-90" : "border-dashed border-border/40 bg-transparent hover:bg-primary/5 hover:border-primary/20"
                            )}
                            style={cell?.mapel ? mapelStyle(cell.mapel) : undefined}
                          >
                            {cell ? (
                              <>
                                <p className="font-semibold truncate text-xs leading-tight">{cell.nama_guru}</p>
                                <p className="text-[10px] truncate mt-0.5 opacity-70">{cell.mapel}</p>
                              </>
                            ) : (
                              <span className="text-muted-foreground/40 text-[10px] italic">+ Atur</span>
                            )}
                            <Pencil className="h-2.5 w-2.5 absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity" />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Slot Dialog */}
      <Dialog open={!!edit} onOpenChange={(open) => !open && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atur Jadwal — {edit?.hari}, Jam ke-{edit?.jam_ke}</DialogTitle>
            <DialogDescription>
              Pilih guru yang mengajar pada slot ini. Mata pelajaran akan terisi otomatis sesuai guru.
            </DialogDescription>
          </DialogHeader>

          {edit && (
            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <Label>Guru</Label>
                <Select
                  value={edit.guru_id}
                  onValueChange={(v) => {
                    const selected = gurus.find((x) => x.id === v);
                    setEdit({ ...edit, guru_id: v, mapel: edit.mapel || selected?.mapel || "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingGuru ? "Memuat guru…" : "Pilih guru"} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeGurus.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        <span className="font-medium">{g.nama}</span>
                        <span className="text-muted-foreground ml-2 text-xs">— {g.mapel}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slot-mapel">Mata Pelajaran</Label>
                <Input
                  id="slot-mapel"
                  value={edit.mapel}
                  onChange={(e) => setEdit({ ...edit, mapel: e.target.value })}
                  placeholder="Nama mata pelajaran"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving || !edit?.guru_id}>
              {isSaving ? <><SmartLoader size="sm" className="mr-2" /> Menyimpan…</> : "Simpan Jadwal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
