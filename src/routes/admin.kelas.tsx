import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { useKelas, Kelas } from "@/hooks/useKelas";
import { SmartLoader, FullPageLoader } from "@/components/SmartLoader";
import { z } from "zod";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/kelas")({
  head: () => ({ meta: [{ title: "Kelola Kelas — Digital Attendance" }] }),
  component: KelasPage,
});

const kelasSchema = z.object({
  nama_kelas: z.string().min(2, "Nama kelas terlalu pendek"),
  wali_kelas: z.string().optional(),
});

function KelasPage() {
  const { kelas, isLoading, isSaving, isDeleting, save, remove } = useKelas();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Kelas | null>(null);
  const [form, setForm] = useState({ nama_kelas: "", wali_kelas: "" });

  const openAdd = () => {
    setEdit(null);
    setForm({ nama_kelas: "", wali_kelas: "" });
    setOpen(true);
  };

  const openEdit = (k: Kelas) => {
    setEdit(k);
    setForm({ nama_kelas: k.nama_kelas, wali_kelas: k.wali_kelas });
    setOpen(true);
  };

  const handleSave = async () => {
    const result = kelasSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    try {
      await save(edit ? { id: edit.id, ...form } : form);
      setOpen(false);
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm("Apakah Anda yakin ingin menghapus kelas ini? Tindakan ini tidak dapat dibatalkan.")
    ) {
      try {
        await remove(id);
      } catch (e) {
        // Error handled by hook
      }
    }
  };

  if (isLoading) return <FullPageLoader label="Sinkronisasi Data Kelas..." />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Data Kelas</h1>
          <p className="text-muted-foreground">Manajemen daftar kelas dan wali kelas</p>
        </div>
        <Button
          onClick={openAdd}
          className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" /> Tambah Kelas
        </Button>
      </div>

      <Card className="border-none shadow-xl shadow-accent/5 overflow-hidden ring-1 ring-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 text-left font-semibold text-muted-foreground">No</th>
                <th className="p-4 text-left font-semibold text-muted-foreground">Nama Kelas</th>
                <th className="p-4 text-left font-semibold text-muted-foreground">Wali Kelas</th>
                <th className="p-4 text-right font-semibold text-muted-foreground">Manajemen</th>
              </tr>
            </thead>
            <tbody>
              {kelas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-muted-foreground italic">
                    Belum ada data kelas yang terdaftar.
                  </td>
                </tr>
              ) : (
                kelas.map((k, i) => (
                  <tr key={k.id} className="border-t hover:bg-accent/5 transition-colors group">
                    <td className="p-4 text-muted-foreground">{i + 1}</td>
                    <td className="p-4">
                      <span className="font-bold text-foreground text-base">{k.nama_kelas}</span>
                    </td>
                    <td className="p-4 font-medium text-muted-foreground">{k.wali_kelas || "-"}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:text-primary hover:bg-primary/10"
                          onClick={() => openEdit(k)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(k.id)}
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
              {edit ? "Perbarui Data Kelas" : "Tambah Kelas Baru"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="nama_kelas" className="text-sm font-semibold">
                Nama Kelas
              </Label>
              <Input
                id="nama_kelas"
                placeholder="Contoh: X-A, XI-IPA-1"
                value={form.nama_kelas}
                onChange={(e) => setForm({ ...form, nama_kelas: e.target.value })}
                className="focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wali_kelas" className="text-sm font-semibold">
                Nama Wali Kelas (Opsional)
              </Label>
              <Input
                id="wali_kelas"
                placeholder="Nama lengkap wali kelas"
                value={form.wali_kelas}
                onChange={(e) => setForm({ ...form, wali_kelas: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="px-8">
              {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              {edit ? "Simpan Perubahan" : "Simpan Kelas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
