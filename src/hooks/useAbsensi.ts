import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, ApiResponse } from "@/lib/api";
import { toast } from "sonner";

export type Jadwal = { 
  jam_ke: number; 
  guru_id: string; 
  nama_guru: string; 
  mapel: string; 
  jadwal_id: string 
};

export type AbsensiStatus = {
  sudah_absen: boolean;
  jadwal: Jadwal[];
};

/**
 * Backend response shapes:
 * - cekAbsensi:    { success: true, sudah_absen: boolean }
 * - getJadwalHari: { success: true, jadwal: Jadwal[] }
 * 
 * Both use `jsonResponse()` directly (top-level fields, NOT nested in `.data`).
 */
interface CekAbsensiResponse extends ApiResponse {
  sudah_absen: boolean;
}

interface JadwalHariResponse extends ApiResponse {
  jadwal: Jadwal[];
}

const ABSENSI_KEY = ["absensi"] as const;

/**
 * Smart Sync Hook — Absensi (Attendance)
 * 
 * Fetches today's schedule and attendance status for a given class.
 * Defensive: handles missing fields gracefully to prevent runtime crashes.
 */
export function useAbsensi(kelas_id?: string, tanggal?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...ABSENSI_KEY, kelas_id, tanggal],
    queryFn: async (): Promise<AbsensiStatus> => {
      if (!kelas_id || !tanggal) throw new Error("Missing parameters");
      
      const [cek, jad] = await Promise.all([
        apiGet<CekAbsensiResponse>("cekAbsensi", { kelas_id, tanggal }),
        apiGet<JadwalHariResponse>("getJadwalHari", { kelas_id, tanggal }),
      ]);

      return {
        sudah_absen: !!cek.sudah_absen,
        jadwal: Array.isArray(jad.jadwal) ? jad.jadwal : [],
      };
    },
    enabled: !!kelas_id && !!tanggal,
    staleTime: 1000 * 60,
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: { 
      tanggal: string; 
      kelas_id: string; 
      data: any[];
    }) => {
      return apiPost("submitAbsensi", payload);
    },
    onSuccess: (res: any) => {
      toast.success(res.message || "Absensi berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: ABSENSI_KEY });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan absensi");
    }
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isSubmitting: submitMutation.isPending,
    submit: submitMutation.mutateAsync,
    refetch: query.refetch,
  };
}
