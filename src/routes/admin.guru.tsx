import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { useGuru, Guru } from "@/hooks/useGuru";
import { SmartLoader, FullPageLoader } from "@/components/SmartLoader";
import { z } from "zod";

export const Route = createFileRoute("/admin/guru")({
  head: () => ({ meta: [{ title: "Kelola Guru — Digital Attendance" }] }),
  component: GuruPage,
});

const guruSchema = z.object({
  nama: z.string().min(3, "Nama terlalu pendek"),
  nip: z.string().min(5, "NIP tidak valid"),
  mapel: z.string().min(2, "Mapel wajib diisi"),
  aktif: z.boolean().default(true),
});

function GuruPage() {
  const { gurus, isLoading, isSaving, isDeleting, save, remove } = useGuru();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Guru | null>(null);
  const [form, setForm] = useState({ nama: "", nip: "", mapel: "", aktif: true });

  const openAdd = () => {
    setEdit(null);
    setForm({ nama: "", nip: "", mapel: "", aktif: true });
    setOpen(true);
  };

  const openEdit = (g: Guru) => {
    setEdit(g);
    setForm({ nama: g.nama, nip: g.nip, mapel: g.mapel, aktif: g.aktif });
    setOpen(true);
  };

  const handleSave = async () => {
    // Client-side validation
    const result = guruSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    // Check duplicate NIP
    const existingByNip = gurus.find((g) => g.nip === form.nip && g.id !== edit?.id);
    if (existingByNip) {
      toast.error(`NIP "${form.nip}" sudah digunakan oleh guru lain`);
      return;
    }

    // Check duplicate (nama + nip) - same name with different nip
    const existingByName = gurus.filter(
      (g) => g.nama.toLowerCase() === form.nama.toLowerCase() && g.id !== edit?.id,
    );
    if (existingByName.length > 0) {
      const nipList = existingByName.map((g) => g.nip).join(", ");
      toast.error(`Nama "${form.nama}" sudah terdaftar dengan NIP: ${nipList}`);
      return;
    }

    try {
      await save(edit ? { id: edit.id, ...form } : form);
      setOpen(false);
    } catch (e) {
      // API client already handled the toast for specific errors
    }
  };

  if (isLoading) return <FullPageLoader label="Sinkronisasi Data Guru..." />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Data Guru</h1>
          <p className="text-muted-foreground">Sistem manajemen tenaga pendidik terpusat</p>
        </div>
        <Button
          onClick={openAdd}
          className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" /> Tambah Guru
        </Button>
      </div>

      <Card className="border-none shadow-xl shadow-accent/5 overflow-hidden ring-1 ring-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 text-left font-semibold text-muted-foreground">No</th>
                <th className="p-4 text-left font-semibold text-muted-foreground">
                  Informasi Guru
                </th>
                <th className="p-4 text-left font-semibold text-muted-foreground">
                  Mata Pelajaran
                </th>
                <th className="p-4 text-left font-semibold text-muted-foreground">Status</th>
                <th className="p-4 text-right font-semibold text-muted-foreground">Manajemen</th>
              </tr>
            </thead>
            <tbody>
              {gurus.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground italic">
                    Belum ada data guru yang terdaftar.
                  </td>
                </tr>
              ) : (
                gurus.map((g, i) => (
                  <tr key={g.id} className="border-t hover:bg-accent/5 transition-colors group">
                    <td className="p-4 text-muted-foreground">{i + 1}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-base">{g.nama}</span>
                        <span className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
                          NIP: {g.nip}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-medium">{g.mapel}</td>
                    <td className="p-4">
                      <Badge
                        variant={g.aktif ? "default" : "secondary"}
                        className={
                          g.aktif ? "bg-green-500/10 text-green-600 border-green-500/20" : ""
                        }
                      >
                        {g.aktif ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:text-primary hover:bg-primary/10"
                          onClick={() => openEdit(g)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:text-destructive hover:bg-destructive/10"
                          onClick={() => remove(g.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md shadow-2xl ring-1 ring-border/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {edit ? "Perbarui Data Guru" : "Registrasi Guru Baru"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="nama" className="text-sm font-semibold">
                Nama Lengkap & Gelar
              </Label>
              <Input
                id="nama"
                placeholder="Contoh: Budi Santoso, S.Pd"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                className="focus-visible:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nip" className="text-sm font-semibold">
                  NIP
                </Label>
                <Input
                  id="nip"
                  placeholder="18 digit NIP"
                  value={form.nip}
                  onChange={(e) => setForm({ ...form, nip: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mapel" className="text-sm font-semibold">
                  Mata Pelajaran
                </Label>
                <Input
                  id="mapel"
                  placeholder="Utama"
                  value={form.mapel}
                  onChange={(e) => setForm({ ...form, mapel: e.target.value })}
                />
              </div>
            </div>

            {edit && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Status Keaktifan</Label>
                  <p className="text-xs text-muted-foreground leading-none">
                    Guru dapat melakukan absensi jika aktif
                  </p>
                </div>
                <Switch
                  checked={form.aktif}
                  onCheckedChange={(v) => setForm({ ...form, aktif: v })}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="px-8">
              {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              {edit ? "Simpan Perubahan" : "Daftarkan Guru"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { toast } from "sonner";
