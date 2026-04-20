import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, ApiResponse } from "@/lib/api";
import { toast } from "sonner";

export type JadwalSlot = {
  id: string;
  hari: string;
  jam_ke: number;
  guru_id: string;
  nama_guru: string;
  mapel: string;
};

export type SetJadwalPayload = {
  kelas_id: string;
  hari: string;
  jam_ke: number;
  guru_id: string;
  mapel: string;
};

/** Backend response: successResponse(data) → { success, data: JadwalSlot[] } */
interface GetJadwalResponse extends ApiResponse {
  data: JadwalSlot[];
}

const jadwalKey = (kelas_id: string) => ["jadwal", kelas_id] as const;

/**
 * Smart Sync Hook — Jadwal (Schedule) per Class
 *
 * Scoped per kelas_id so multiple class schedules can be cached
 * independently. Mutations auto-invalidate only the affected class.
 */
export function useJadwal(kelas_id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: jadwalKey(kelas_id),
    queryFn: async (): Promise<JadwalSlot[]> => {
      if (!kelas_id) return [];
      const res = await apiGet<GetJadwalResponse>("getJadwal", { kelas_id });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!kelas_id,
    staleTime: 1000 * 60 * 5,
  });

  const setSlotMutation = useMutation({
    mutationFn: async (payload: SetJadwalPayload) => {
      return apiPost("setJadwal", payload);
    },
    onSuccess: (res: any) => {
      toast.success(res.message || "Jadwal berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: jadwalKey(kelas_id) });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan jadwal");
    },
  });

  return {
    slots: query.data ?? [],
    isLoading: query.isLoading,
    isSaving: setSlotMutation.isPending,
    setSlot: setSlotMutation.mutateAsync,
    error: query.error,
  };
}
