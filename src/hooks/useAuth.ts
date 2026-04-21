import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api";
import { setSession, clearSession } from "@/lib/auth";
import { pushLoginDebug } from "@/lib/loginDebug";
import { toast } from "sonner";

/**
 * World-Class Authentication Hook.
 * Centralizes login logic, session persistence, and navigation.
 */
export function useAuth() {
  const loginMutation = useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      pushLoginDebug("auth: mutation start", { email: credentials.email });
      console.log("[AUTH] 🔑 login called with:", credentials.email);
      const result = await apiPost("login", credentials);
      pushLoginDebug("auth: mutation resolved", result);
      console.log("[AUTH] 🟢 apiPost resolved:", result);
      return result;
    },
    onSuccess: (res) => {
      pushLoginDebug("auth: onSuccess", res);
      console.log("[AUTH] ✅ onSuccess:", res);
      // res is already validated and cast to the right type by apiPost
      setSession({
        token: res.token,
        role: res.role,
        nama: res.nama,
        kelas_id: res.kelas_id
      });
      
      toast.success(`Selamat datang, ${res.nama}`);
      
      const destination = res.role === "admin" ? "/admin" : "/dashboard";
      pushLoginDebug("auth: redirect", { destination });
      console.log("[AUTH] 🧭 navigating to", destination);
      if (typeof window !== "undefined") {
        window.location.replace(destination);
      }
    },
    onError: (error: any) => {
      pushLoginDebug("auth: onError", { message: error?.message });
      console.error("[AUTH] ❌ onError:", error?.message, error);
      // The API client already provides a detailed error message
      toast.error(error.message || "Gagal masuk ke sistem. Periksa kembali email dan password Anda.");
    }
  });

  const logout = () => {
    pushLoginDebug("auth: logout");
    clearSession();
    toast.info("Anda telah keluar dari sistem.");
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  };

  return {
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout
  };
}
