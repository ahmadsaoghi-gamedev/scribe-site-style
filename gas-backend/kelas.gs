// ============================================================
// kelas.gs — Data Kelas
// ============================================================

/**
 * GET ?action=getKelas&token=xxx
 * Bisa diakses admin dan petugas.
 */
function handleGetKelas(params) {
  const token = params.token;
  requireRole(token, ["admin", "petugas"]);

  const kelas = getAllRows(SHEETS.KELAS).map(k => ({
    id:         k.id,
    nama_kelas: k.nama_kelas,
    wali_kelas: k.wali_kelas || ""
  }));

  return successResponse(kelas);
}
