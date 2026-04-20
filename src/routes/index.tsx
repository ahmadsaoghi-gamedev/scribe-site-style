import { createFileRoute, redirect } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("role");
      if (role === "admin") throw redirect({ to: "/admin" });
      if (role === "petugas") throw redirect({ to: "/dashboard" });
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Toaster />,
});
