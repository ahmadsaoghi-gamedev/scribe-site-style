import { useState } from "react";
import { apiGet, ApiResponse } from "@/lib/api";
import { toast } from "sonner";

export type LaporanRow = {
  nama_guru: string;
  nip: string;
  mapel: string;
  total_hadir: number;
  total_terlambat: number;
  total_tidak_hadir: number;
  total_kosong: number;
};

export type PeriodeType = "harian" | "mingguan" | "bulanan";

export type LaporanParams =
  | { periodeType: "harian"; tanggal: string }
  | { periodeType: "mingguan"; dari: string; sampai: string }
  | { periodeType: "bulanan"; bulan: string; tahun: string };

/** Backend response: successResponse(data) → { success, data: LaporanRow[] } */
interface LaporanResponse extends ApiResponse {
  data: LaporanRow[];
}

const ACTION_MAP: Record<PeriodeType, string> = {
  harian: "laporanHarian",
  mingguan: "laporanMingguan",
  bulanan: "laporanBulanan",
};

/**
 * Smart Sync Hook — Laporan (Attendance Report)
 *
 * Reports are on-demand, not background-fetched, because the user explicitly
 * chooses a date range before requesting. We use local state + manual fetch
 * (imperative pattern) rather than `useQuery` to avoid stale report data
 * being shown automatically when params change mid-session.
 */
export function useLaporan() {
  const [rows, setRows] = useState<LaporanRow[]>([]);
  const [label, setLabel] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetch = async (params: LaporanParams) => {
    setIsLoading(true);
    try {
      const action = ACTION_MAP[params.periodeType];
      // Build flat params object for apiGet
      const { periodeType: _, ...queryParams } = params as any;
      const res = await apiGet<LaporanResponse>(action, queryParams);
      const data = Array.isArray(res.data) ? res.data : [];
      setRows(data);

      // Compose human-readable period label for report header
      if (params.periodeType === "harian") setLabel(`Harian — ${params.tanggal}`);
      else if (params.periodeType === "mingguan") setLabel(`Mingguan — ${params.dari} s/d ${params.sampai}`);
      else setLabel(`Bulanan — ${params.bulan}/${params.tahun}`);

      if (data.length === 0) toast.info("Tidak ada data untuk periode yang dipilih.");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengambil data laporan");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => { setRows([]); setLabel(""); };

  return { rows, label, isLoading, fetch, reset };
}
