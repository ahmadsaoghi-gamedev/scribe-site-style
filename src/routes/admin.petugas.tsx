import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Key, RefreshCw } from "lucide-react";
import { usePetugas } from "@/hooks/usePetugas";
import { useKelas } from "@/hooks/useKelas";
import { SmartLoader } from "@/components/SmartLoader";

export const Route = createFileRoute("/admin/petugas")({
  component: PetugasPage,
});

type FormState = { nama: string; email: string; password: string; kelas_id: string };
const EMPTY_FORM: FormState = { nama: "", email: "", password: "", kelas_id: "" };

function PetugasPage() {
  const { petugas, isLoading, isRefetching, isSaving, isDeleting, save, remove, resetPassword } = usePetugas();
  const { kelas: kelasList, isLoading: isLoadingKelas } = useKelas();

  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const isEditing = !!editId;

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: (typeof petugas)[number]) => {
    setEditId(p.id);
    setForm({ nama: p.nama, email: p.email, password: "", kelas_id: p.kelas_id });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.email || !form.kelas_id) return;
    if (!isEditing && !form.password) return;

    try {
      const payload = isEditing
        ? { id: editId!, nama: form.nama, email: form.email, kelas_id: form.kelas_id, aktif: true }
        : form;
      await save(payload);
      setDialogOpen(false);
    } catch {
      // Error toast handled by hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus petugas ini dari sistem?")) return;
    try { await remove(id); } catch { /* Error toast by hook */ }
  };

  const handleResetPassword = async (id: string) => {
    const np = window.prompt("Masukkan password baru untuk petugas ini:");
    if (!np || np.trim().length < 6) {
      if (np !== null) alert("Password minimal 6 karakter.");
      return;
    }
    try { await resetPassword({ id, new_password: np.trim() }); } catch { /* Error toast by hook */ }
  };

  const f = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const canSave = form.nama && form.email && form.kelas_id && (isEditing || !!form.password);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Akun Petugas</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola akun petugas absensi per kelas</p>
        </div>
        <Button onClick={openAdd} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" /> Tambah Petugas
        </Button>
      </div>

      <Card className="overflow-hidden">
        {/* Loading overlay bar */}
        {(isLoading || isRefetching) && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b text-xs text-primary font-medium">
            <SmartLoader size="sm" /> {isLoading ? "Memuat data…" : "Menyinkronkan…"}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-muted/60">
              <tr>
                <th className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground w-10">#</th>
                <th className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Nama</th>
                <th className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Email</th>
                <th className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Kelas</th>
                <th className="p-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="p-3 text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {petugas.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted-foreground text-sm">
                    Belum ada data petugas. Klik <span className="font-semibold">Tambah Petugas</span> untuk memulai.
                  </td>
                </tr>
              ) : (
                petugas.map((p, i) => (
                  <tr key={p.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                    <td className="p-3 font-semibold">{p.nama}</td>
                    <td className="p-3 text-muted-foreground">{p.email}</td>
                    <td className="p-3">{p.nama_kelas || p.kelas_id}</td>
                    <td className="p-3">
                      <Badge variant={p.aktif ? "default" : "secondary"}>
                        {p.aktif ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit petugas" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Reset password" onClick={() => handleResetPassword(p.id)}>
                          <Key className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Hapus petugas"
                          disabled={isDeleting}
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Data Petugas" : "Tambah Petugas Baru"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Perbarui informasi akun petugas. Password hanya diubah melalui tombol Reset Password."
                : "Isi seluruh kolom untuk membuat akun petugas baru."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="petugas-nama">Nama Lengkap</Label>
              <Input id="petugas-nama" value={form.nama} onChange={f("nama")} placeholder="Nama petugas" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="petugas-email">Email</Label>
              <Input id="petugas-email" type="email" value={form.email} onChange={f("email")} placeholder="email@domain.sch.id" disabled={isEditing} />
              {isEditing && <p className="text-xs text-muted-foreground">Email tidak dapat diubah setelah dibuat.</p>}
            </div>
            {!isEditing && (
              <div className="space-y-1.5">
                <Label htmlFor="petugas-password">Password</Label>
                <Input id="petugas-password" type="password" value={form.password} onChange={f("password")} placeholder="Minimal 6 karakter" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Kelas yang Ditugaskan</Label>
              <Select value={form.kelas_id} onValueChange={(v) => setForm((p) => ({ ...p, kelas_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingKelas ? "Memuat kelas…" : "Pilih kelas"} />
                </SelectTrigger>
                <SelectContent>
                  {kelasList.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving || !canSave}>
              {isSaving ? <><SmartLoader size="sm" className="mr-2" /> Menyimpan…</> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
