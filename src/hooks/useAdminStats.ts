import { useQuery } from "@tanstack/react-query";
import { apiGet, ApiResponse } from "@/lib/api";

export type AdminStats = {
  total_guru: number;
  total_kelas: number;
  kelas_sudah_absen: number;
};

/** Backend response: jsonResponse({ success, total_guru, total_kelas, ... }) — top-level fields */
interface GetRekapResponse extends ApiResponse {
  total_guru: number;
  total_kelas: number;
  kelas_sudah_absen: number;
}

const ADMIN_STATS_KEY = ["admin-stats"] as const;

/**
 * Smart Sync Hook — Admin Dashboard Stats
 *
 * Fetches today's attendance summary. Refreshes every 2 minutes to
 * reflect Petugas submissions in near-real-time without user action.
 */
export function useAdminStats() {
  const query = useQuery({
    queryKey: ADMIN_STATS_KEY,
    queryFn: async (): Promise<AdminStats> => {
      const res = await apiGet<GetRekapResponse>("getRekapHariIni");
      return {
        total_guru: res.total_guru ?? 0,
        total_kelas: res.total_kelas ?? 0,
        kelas_sudah_absen: res.kelas_sudah_absen ?? 0,
      };
    },
    staleTime: 1000 * 60 * 2, // 2-min auto-refresh cadence
    refetchInterval: 1000 * 60 * 2,
  });

  return {
    stats: query.data ?? { total_guru: 0, total_kelas: 0, kelas_sudah_absen: 0 },
    isLoading: query.isLoading,
    error: query.error,
  };
}
