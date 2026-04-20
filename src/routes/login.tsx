import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SCHOOL, setSession } from "@/lib/auth";
import { apiPost } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — MAS Wahid Hasyim Balung" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // BACKEND DEV: POST ?action=login  body { email, password }
  // expect: { success, token, role, nama, kelas_id }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiPost("login", { email, password });
      if (!res.success) {
        toast.error(res.message || "Login gagal");
        return;
      }
      setSession({ token: res.token, role: res.role, nama: res.nama, kelas_id: res.kelas_id });
      toast.success(`Selamat datang, ${res.nama}`);
      nav({ to: res.role === "admin" ? "/admin" : "/dashboard" });
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent via-background to-accent/40 p-4">
      <Toaster richColors position="top-center" />
      <Card className="w-full max-w-md p-8 shadow-xl border-primary/10">
        <div className="flex flex-col items-center text-center mb-6">
          <img src={SCHOOL.logo} alt="Logo MAS Wahid Hasyim" className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/20 mb-4" />
          <h1 className="text-lg font-bold text-primary leading-tight">{SCHOOL.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{SCHOOL.address}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@mas-wahidhasyim.sch.id" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <div className="mt-6 text-xs text-muted-foreground bg-muted/40 rounded-md p-3">
          <p className="font-semibold mb-1">Demo akun (mock):</p>
          <p>Admin: admin@mas-wahidhasyim.sch.id / admin123</p>
          <p>Petugas: petugas@mas-wahidhasyim.sch.id / petugas123</p>
        </div>
      </Card>
    </div>
  );
}
