import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Calendar, UserCog, FileBarChart, LogOut, Menu } from "lucide-react";
import { SchoolHeader } from "@/components/SchoolHeader";
import { clearSession, getSession } from "@/lib/auth";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined") {
      const s = getSession();
      if (!s) throw redirect({ to: "/login" });
      if (s.role !== "admin") throw redirect({ to: "/dashboard" });
    }
    return { pathname: location.pathname };
  },
  head: () => ({ meta: [{ title: "Admin — Absensi Guru MAS Wahid Hasyim" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/guru", label: "Data Guru", icon: Users },
  { to: "/admin/jadwal", label: "Jadwal", icon: Calendar },
  { to: "/admin/petugas", label: "Akun Petugas", icon: UserCog },
  { to: "/admin/laporan", label: "Laporan", icon: FileBarChart },
];

function AdminLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const session = typeof window !== "undefined" ? getSession() : null;
  const logout = () => { clearSession(); nav({ to: "/login" }); };

  const isIndex = loc.pathname === "/admin" || loc.pathname === "/admin/";
  // Render only the layout chrome — index content rendered via its own route file:
  // when at /admin we show the overview component embedded.

  return (
    <div className="min-h-screen flex bg-muted/30">
      <Toaster richColors position="top-center" />
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-30 w-64 bg-card border-r flex flex-col transition-transform no-print",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 border-b"><SchoolHeader /></div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => {
            const active = n.exact ? isIndex : loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition",
                  active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                )}
              >
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">Login sebagai<br/><span className="font-semibold text-foreground">{session?.nama}</span></p>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}><LogOut className="h-4 w-4 mr-1" />Keluar</Button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden no-print" onClick={() => setOpen(false)} />}

      <div className="flex-1 min-w-0">
        <header className="bg-card border-b lg:hidden p-3 flex items-center gap-2 no-print">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></Button>
          <SchoolHeader />
        </header>
        <main className="p-4 lg:p-6 max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
