import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, ApiResponse } from "@/lib/api";
import { toast } from "sonner";

export type Petugas = {
  id: string;
  nama: string;
  email: string;
  kelas_id: string;
  nama_kelas: string;
  aktif: boolean;
};

export type PetugasFormData = {
  nama: string;
  email: string;
  password?: string;
  kelas_id: string;
};

/** Backend response: successResponse(data) → { success, data: Petugas[] } */
interface GetPetugasResponse extends ApiResponse {
  data: Petugas[];
}

const PETUGAS_KEY = ["petugas"] as const;

/**
 * Smart Sync Hook — Petugas (Staff) Account Management
 *
 * Handles CRUD for class attendance officer accounts. All mutations
 * automatically invalidate the cache so the UI reflects the new state
 * without a manual page refresh.
 */
export function usePetugas() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PETUGAS_KEY,
    queryFn: async (): Promise<Petugas[]> => {
      const res = await apiGet<GetPetugasResponse>("getPetugas");
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<Petugas> & { password?: string }) => {
      const action = payload.id ? "editPetugas" : "addPetugas";
      return apiPost(action, payload);
    },
    onSuccess: (res: any) => {
      toast.success(res.message || "Data petugas berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: PETUGAS_KEY });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan data petugas");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiPost("deletePetugas", { id });
    },
    onSuccess: (res: any) => {
      toast.success(res.message || "Petugas berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: PETUGAS_KEY });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus petugas");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, new_password }: { id: string; new_password: string }) => {
      return apiPost("resetPassword", { id, new_password });
    },
    onSuccess: () => {
      toast.success("Password berhasil direset");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mereset password");
    },
  });

  return {
    petugas: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    save: saveMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    error: query.error,
  };
}
