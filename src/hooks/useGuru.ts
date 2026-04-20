import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, ApiResponse } from "@/lib/api";
import { toast } from "sonner";

export type Guru = { 
  id: string; 
  nama: string; 
  nip: string; 
  mapel: string; 
  aktif: boolean 
};

/** Backend response shape for getGuru: { success, data: Guru[] } */
interface GetGuruResponse extends ApiResponse {
  data: Guru[];
}

const GURU_KEY = ["gurus"] as const;

/**
 * Smart Sync Hook — Guru Management
 * 
 * Handles all state synchronization between the frontend and the Google Sheets
 * backend. The backend wraps guru data in `successResponse(data)`, which produces
 * `{ success: true, data: [...] }`. This hook correctly unpacks that envelope.
 */
export function useGuru() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: GURU_KEY,
    queryFn: async (): Promise<Guru[]> => {
      const res = await apiGet<GetGuruResponse>("getGuru");
      // Backend successResponse() wraps: { success: true, data: [...] }
      // Defensive: handle both wrapped and direct-array responses
      const payload = res.data;
      return Array.isArray(payload) ? payload : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<Guru>) => {
      const action = payload.id ? "editGuru" : "addGuru";
      return apiPost(action, payload);
    },
    onSuccess: (res: any) => {
      toast.success(res.message || "Data guru berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: GURU_KEY });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan data guru");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiPost("deleteGuru", { id });
    },
    onSuccess: (res: any) => {
      toast.success(res.message || "Guru berhasil dinonaktifkan");
      queryClient.invalidateQueries({ queryKey: GURU_KEY });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menonaktifkan guru");
    }
  });

  return {
    gurus: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    save: saveMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    error: query.error
  };
}
