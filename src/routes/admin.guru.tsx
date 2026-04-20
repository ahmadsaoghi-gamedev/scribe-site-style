import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

export const Route = createFileRoute("/admin/guru")({
  component: GuruPage,
});

type Guru = { id: string; nama: string; nip: string; mapel: string; aktif: boolean };

function GuruPage() {
  const [data, setData] = useState<Guru[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Guru | null>(null);
  const [form, setForm] = useState({ nama: "", nip: "", mapel: "", aktif: true });

  const load = async () => {
    const r = await apiGet("getGuru");
    if (r.success) setData(r.data);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEdit(null); setForm({ nama: "", nip: "", mapel: "", aktif: true }); setOpen(true); };
  const openEdit = (g: Guru) => { setEdit(g); setForm({ nama: g.nama, nip: g.nip, mapel: g.mapel, aktif: g.aktif }); setOpen(true); };

  const save = async () => {
    // BACKEND DEV: addGuru / editGuru
    const action = edit ? "editGuru" : "addGuru";
    const body = edit ? { id: edit.id, ...form } : form;
    const r = await apiPost(action, body);
    if (r.success) { toast.success("Tersimpan"); setOpen(false); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Nonaktifkan guru ini?")) return;
    // BACKEND DEV: deleteGuru
    const r = await apiPost("deleteGuru", { id });
    if (r.success) { toast.success("Dinonaktifkan"); load(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Guru</h1>
          <p className="text-sm text-muted-foreground">Kelola daftar guru</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Tambah Guru</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">No</th>
                <th className="p-3 text-left">Nama</th>
                <th className="p-3 text-left">NIP</th>
                <th className="p-3 text-left">Mapel</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((g, i) => (
                <tr key={g.id} className="border-t">
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3 font-medium">{g.nama}</td>
                  <td className="p-3">{g.nip}</td>
                  <td className="p-3">{g.mapel}</td>
                  <td className="p-3"><Badge variant={g.aktif ? "default" : "secondary"}>{g.aktif ? "Aktif" : "Nonaktif"}</Badge></td>
                  <td className="p-3 text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(g)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Edit Guru" : "Tambah Guru"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nama</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
            <div><Label>NIP</Label><Input value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} /></div>
            <div><Label>Mata Pelajaran</Label><Input value={form.mapel} onChange={(e) => setForm({ ...form, mapel: e.target.value })} /></div>
            {edit && (
              <div className="flex items-center justify-between">
                <Label>Status Aktif</Label>
                <Switch checked={form.aktif} onCheckedChange={(v) => setForm({ ...form, aktif: v })} />
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={save}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
