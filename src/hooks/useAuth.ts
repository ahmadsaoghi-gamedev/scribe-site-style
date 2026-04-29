import { useState } from "react";
import { apiPost } from "@/lib/api";
import { setSession, clearSession } from "@/lib/auth";
import { toast } from "sonner";

export function useAuth() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = async (credentials: Record<string, string>) => {
    setIsLoggingIn(true);
    try {
      const res = await apiPost("login", credentials);

      setSession({
        token: res.token,
        role: res.role,
        nama: res.nama,
        kelas_id: res.kelas_id,
        kelas_ids: res.kelas_ids,
        nama_kelas: res.nama_kelas,
      });

      toast.success(`Selamat datang, ${res.nama}`);

      const destination = res.role === "admin" ? "/admin" : "/dashboard";
      if (typeof window !== "undefined") {
        window.location.replace(destination);
      }

      return res;
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Gagal masuk ke sistem. Periksa kembali email dan password Anda.");
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    clearSession();
    toast.info("Anda telah keluar dari sistem.");
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  };

  return { login, isLoggingIn, logout };
}
