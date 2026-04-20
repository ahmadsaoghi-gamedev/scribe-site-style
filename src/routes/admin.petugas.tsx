import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Key } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

export const Route = createFileRoute("/admin/petugas")({
  component: PetugasPage,
});

type P = { id: string; nama: string; email: string; kelas_id: string; nama_kelas: string; aktif: boolean };
type K = { id: string; nama_kelas: string };

function PetugasPage() {
  const [data, setData] = useState<P[]>([]);
  const [kelas, setKelas] = useState<K[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<P | null>(null);
  const [form, setForm] = useState({ nama: "", email: "", password: "", kelas_id: "" });

  const load = async () => {
    const [p, k] = await Promise.all([apiGet("getPetugas"), apiGet("getKelas")]);
    if (p.success) setData(p.data);
    if (k.success) setKelas(k.data);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEdit(null); setForm({ nama: "", email: "", password: "", kelas_id: "" }); setOpen(true); };
  const openEdit = (p: P) => { setEdit(p); setForm({ nama: p.nama, email: p.email, password: "", kelas_id: p.kelas_id }); setOpen(true); };

  const save = async () => {
    // BACKEND DEV: addPetugas / editPetugas
    const r = edit
      ? await apiPost("editPetugas", { id: edit.id, nama: form.nama, email: form.email, kelas_id: form.kelas_id, aktif: true })
      : await apiPost("addPetugas", form);
    if (r.success) { toast.success("Tersimpan"); setOpen(false); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus petugas ini?")) return;
    const r = await apiPost("deletePetugas", { id });
    if (r.success) { toast.success("Dihapus"); load(); }
  };

  const reset = async (id: string) => {
    const np = prompt("Password baru:");
    if (!np) return;
    // BACKEND DEV: resetPassword
    const r = await apiPost("resetPassword", { id, new_password: np });
    if (r.success) toast.success("Password direset");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Akun Petugas</h1>
          <p className="text-sm text-muted-foreground">Kelola akun petugas absensi per kelas</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Tambah Petugas</Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">No</th><th className="p-3 text-left">Nama</th>
              <th className="p-3 text-left">Email</th><th className="p-3 text-left">Kelas</th>
              <th className="p-3 text-left">Status</th><th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{i + 1}</td>
                <td className="p-3 font-medium">{p.nama}</td>
                <td className="p-3">{p.email}</td>
                <td className="p-3">{p.nama_kelas}</td>
                <td className="p-3"><Badge variant={p.aktif ? "default" : "secondary"}>{p.aktif ? "Aktif" : "Nonaktif"}</Badge></td>
                <td className="p-3 text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => reset(p.id)}><Key className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Edit Petugas" : "Tambah Petugas"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nama</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            {!edit && <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>}
            <div>
              <Label>Kelas</Label>
              <Select value={form.kelas_id} onValueChange={(v) => setForm({ ...form, kelas_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                <SelectContent>{kelas.map((k) => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={save}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
