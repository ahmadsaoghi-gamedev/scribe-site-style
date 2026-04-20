// ============================================================
// laporan.gs — Laporan Harian / Mingguan / Bulanan
// ============================================================

/**
 * Hitung rekap absensi berdasarkan filter tanggal.
 * @param {string} dari  - tanggal awal YYYY-MM-DD
 * @param {string} sampai - tanggal akhir YYYY-MM-DD
 * @returns {Object[]} data per guru
 */
function buildLaporan(dari, sampai) {
  const absensiRows = getAllRows(SHEETS.ABSENSI);
  const guruMap = {};
  getAllRows(SHEETS.GURU).forEach(g => { guruMap[g.id] = g; });

  // Filter absensi sesuai rentang tanggal
  const filtered = absensiRows.filter(a => {
    const tgl = String(a.tanggal).substring(0, 10);
    return tgl >= dari && tgl <= sampai;
  });

  // Group by guru
  const guruStats = {};
  filtered.forEach(a => {
    if (!guruStats[a.id_guru]) {
      const guru = guruMap[a.id_guru];
      guruStats[a.id_guru] = {
        guru_id:      a.id_guru,
        nama_guru:    guru ? guru.nama : "(tidak diketahui)",
        hadir:        0,
        terlambat:    0,
        tidak_hadir:  0,
        kosong:       0,
        detail:       []
      };
    }
    const stat = guruStats[a.id_guru];
    switch (a.status) {
      case "Hadir":        stat.hadir++;       break;
      case "Terlambat":    stat.terlambat++;   break;
      case "Tidak Hadir":  stat.tidak_hadir++; break;
      case "Kosong":       stat.kosong++;      break;
    }
    stat.detail.push({
      tanggal:  String(a.tanggal).substring(0, 10),
      kelas_id: a.id_kelas,
      jam_ke:   a.jam_ke,
      status:   a.status
    });
  });

  return Object.values(guruStats).sort((a, b) => a.nama_guru.localeCompare(b.nama_guru));
}

/**
 * GET ?action=laporanHarian&tanggal=YYYY-MM-DD&token=xxx
 * Admin only.
 */
function handleLaporanHarian(params) {
  const { token, tanggal } = params;
  requireRole(token, ["admin"]);

  if (!tanggal) return errorResponse("Parameter tanggal wajib diisi.");

  const data = buildLaporan(tanggal, tanggal);
  return successResponse(data);
}

/**
 * GET ?action=laporanMingguan&dari=YYYY-MM-DD&sampai=YYYY-MM-DD&token=xxx
 * Admin only.
 */
function handleLaporanMingguan(params) {
  const { token, dari, sampai } = params;
  requireRole(token, ["admin"]);

  if (!dari || !sampai) return errorResponse("Parameter dari dan sampai wajib diisi.");
  if (dari > sampai)    return errorResponse("Tanggal 'dari' tidak boleh lebih besar dari 'sampai'.");

  const data = buildLaporan(dari, sampai);
  return successResponse(data);
}

/**
 * GET ?action=laporanBulanan&bulan=MM&tahun=YYYY&token=xxx
 * Admin only.
 */
function handleLaporanBulanan(params) {
  const { token, bulan, tahun } = params;
  requireRole(token, ["admin"]);

  if (!bulan || !tahun) return errorResponse("Parameter bulan dan tahun wajib diisi.");

  const mm = String(bulan).padStart(2, "0");
  const yyyy = String(tahun);

  // Tanggal awal = tanggal 1 bulan tersebut
  const dari = `${yyyy}-${mm}-01`;

  // Tanggal akhir = hari terakhir bulan tersebut
  const lastDay = new Date(parseInt(yyyy), parseInt(bulan), 0).getDate();
  const sampai = `${yyyy}-${mm}-${String(lastDay).padStart(2, "0")}`;

  const data = buildLaporan(dari, sampai);
  return successResponse(data);
}

/**
 * GET ?action=getRekapHariIni&token=xxx
 * Rekap dashboard admin: total guru, kelas, kelas sudah absen hari ini.
 * Admin only.
 */
function handleGetRekapHariIni(params) {
  const { token } = params;
  requireRole(token, ["admin"]);

  const hariIni = formatDate(new Date());

  const totalGuru  = getAllRows(SHEETS.GURU).filter(g =>
    g.aktif === true || g.aktif === "true" || g.aktif === "TRUE"
  ).length;

  const totalKelas = getAllRows(SHEETS.KELAS).length;

  // Hitung kelas unik yang sudah submit absensi hari ini
  const absensiHariIni = getAllRows(SHEETS.ABSENSI).filter(a =>
    String(a.tanggal).substring(0, 10) === hariIni
  );
  const kelasUnik = new Set(absensiHariIni.map(a => String(a.id_kelas)));
  const kelasSudahAbsen = kelasUnik.size;

  return jsonResponse({
    success:           true,
    total_guru:        totalGuru,
    total_kelas:       totalKelas,
    kelas_sudah_absen: kelasSudahAbsen
  });
}
