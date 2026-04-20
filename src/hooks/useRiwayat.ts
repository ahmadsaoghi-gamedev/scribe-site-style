import { useQuery } from "@tanstack/react-query";
import { apiGet, ApiResponse } from "@/lib/api";
import { getSession } from "@/lib/auth";

export type RiwayatItem = {
  tanggal: string;
  total: number;
  status: string;
};

/** Backend response: successResponse(data) → { success, data: RiwayatItem[] } */
interface GetRiwayatResponse extends ApiResponse {
  data: RiwayatItem[];
}

const riwayatKey = (kelas_id: string) => ["riwayat", kelas_id] as const;

/**
 * Smart Sync Hook — Riwayat Absensi (Attendance History)
 *
 * Fetches the submission history for a class. Scoped by kelas_id
 * so the query cache is isolated per class.
 */
export function useRiwayat() {
  const session = typeof window !== "undefined" ? getSession() : null;
  const kelas_id = session?.kelas_id ?? "";

  const query = useQuery({
    queryKey: riwayatKey(kelas_id),
    queryFn: async (): Promise<RiwayatItem[]> => {
      if (!kelas_id) return [];
      const res = await apiGet<GetRiwayatResponse>("getRiwayat", { kelas_id });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!kelas_id,
    staleTime: 1000 * 60 * 5,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
