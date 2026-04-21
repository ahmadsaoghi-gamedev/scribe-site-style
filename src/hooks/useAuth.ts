import { useState } from "react";
import { apiPost } from "@/lib/api";
import { setSession, clearSession } from "@/lib/auth";
import { pushLoginDebug } from "@/lib/loginDebug";
import { toast } from "sonner";

/**
 * Authentication hook with an imperative login flow.
 * This avoids react-query mutation state during login, which was freezing in production.
 */
export function useAuth() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = async (credentials: Record<string, string>) => {
    pushLoginDebug("auth: login start", { email: credentials.email });
    console.log("[AUTH] login called with:", credentials.email);
    setIsLoggingIn(true);

    try {
      const res = await apiPost("login", credentials);
      pushLoginDebug("auth: login resolved", res);
      console.log("[AUTH] apiPost resolved:", res);

      setSession({
        token: res.token,
        role: res.role,
        nama: res.nama,
        kelas_id: res.kelas_id,
      });

      toast.success(`Selamat datang, ${res.nama}`);

      const destination = res.role === "admin" ? "/admin" : "/dashboard";
      pushLoginDebug("auth: redirect", { destination });
      console.log("[AUTH] navigating to", destination);
      if (typeof window !== "undefined") {
        window.location.replace(destination);
      }

      return res;
    } catch (error: any) {
      pushLoginDebug("auth: onError", { message: error?.message });
      console.error("[AUTH] onError:", error?.message, error);
      toast.error(error.message || "Gagal masuk ke sistem. Periksa kembali email dan password Anda.");
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    pushLoginDebug("auth: logout");
    clearSession();
    toast.info("Anda telah keluar dari sistem.");
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  };

  return {
    login,
    isLoggingIn,
    logout,
  };
}
