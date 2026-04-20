import { Link, useLocation } from "@tanstack/react-router";
import { ClipboardList, History, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/dashboard", label: "Absensi", icon: ClipboardList },
  { to: "/dashboard/riwayat", label: "Riwayat", icon: History },
  { to: "/dashboard/profil", label: "Profil", icon: User },
] as const;

export function BottomNav() {
  const loc = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t no-print pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-3">
        {ITEMS.map((it) => {
          const active = loc.pathname === it.to;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <it.icon className="h-5 w-5" />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
