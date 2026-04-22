import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, ApiResponse } from "@/lib/api";
import { toast } from "sonner";

export type Kelas = {
  id: string;
  nama_kelas: string;
  wali_kelas: string;
};

/** Backend response: successResponse(data) → { success, data: Kelas[] } */
interface GetKelasResponse extends ApiResponse {
  data: Kelas[];
}

export const KELAS_KEY = ["kelas"] as const;

/**
 * Smart Sync Hook — Kelas (Class) List
 *
 * Provides a canonical, cached class roster for dropdown population
 * across Admin and Petugas modules. Long stale time (10 min) since
 * class structure rarely changes within a session.
 */
export function useKelas() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: KELAS_KEY,
    queryFn: async (): Promise<Kelas[]> => {
      const res = await apiGet<GetKelasResponse>("getKelas");
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<Kelas>) => {
      const action = payload.id ? "editKelas" : "addKelas";
      return apiPost(action, payload);
    },
    onSuccess: (res: ApiResponse) => {
      toast.success(res.message || "Data kelas berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: KELAS_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menyimpan data kelas");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiPost("deleteKelas", { id });
    },
    onSuccess: (res: ApiResponse) => {
      toast.success(res.message || "Kelas berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: KELAS_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menghapus kelas");
    },
  });

  return {
    kelas: query.data ?? [],
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    save: saveMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    error: query.error,
  };
}
