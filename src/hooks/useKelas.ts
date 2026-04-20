import { useQuery } from "@tanstack/react-query";
import { apiGet, ApiResponse } from "@/lib/api";

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
  const query = useQuery({
    queryKey: KELAS_KEY,
    queryFn: async (): Promise<Kelas[]> => {
      const res = await apiGet<GetKelasResponse>("getKelas");
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 1000 * 60 * 10,
  });

  return {
    kelas: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
