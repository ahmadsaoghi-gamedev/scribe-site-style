// ============================================================
// laporan.gs — Laporan Harian / Mingguan / Bulanan
// ============================================================

/**
 * Hitung rekap absensi berdasarkan filter tanggal dan opsional kelas.
 * @param {string} dari     - tanggal awal YYYY-MM-DD
 * @param {string} sampai   - tanggal akhir YYYY-MM-DD
 * @param {string} [kelasId] - opsional, filter per kelas
 * @returns {Object[]} data per guru
 */
function buildLaporan(dari, sampai, kelasId) {
  const absensiRows = getAllRows(SHEETS.ABSENSI);
  const guruMap = {};
  getAllRows(SHEETS.GURU).forEach(g => { guruMap[g.id] = g; });
  const kelasMap = {};
  getAllRows(SHEETS.KELAS).forEach(k => { kelasMap[k.id] = k; });

  // Filter absensi sesuai rentang tanggal dan kelas (opsional)
  const filtered = absensiRows.filter(a => {
    const tgl = String(a.tanggal).substring(0, 10);
    if (tgl < dari || tgl > sampai) return false;
    if (kelasId) return String(a.id_kelas) === String(kelasId);
    return true;
  });

  // Group by guru
  const guruStats = {};
  filtered.forEach(a => {
    if (!guruStats[a.id_guru]) {
      const guru = guruMap[a.id_guru];
      guruStats[a.id_guru] = {
        guru_id:           a.id_guru,
        nama_guru:         guru ? guru.nama : "(tidak diketahui)",
        nip:               guru ? (guru.nip || "") : "",
        mapel:             guru ? (guru.mapel || "") : "",
        kelas_ids:         new Set(),
        total_hadir:       0,
        total_terlambat:   0,
        total_tidak_hadir: 0,
        total_kosong:      0,
        hadir:             0,
        terlambat:         0,
        tidak_hadir:       0,
        kosong:            0
      };
    }
    const stat = guruStats[a.id_guru];
    stat.kelas_ids.add(String(a.id_kelas));
    switch (a.status) {
      case "Hadir":        stat.total_hadir++;       stat.hadir++;       break;
      case "Terlambat":    stat.total_terlambat++;   stat.terlambat++;   break;
      case "Tidak Hadir":  stat.total_tidak_hadir++; stat.tidak_hadir++; break;
      case "Kosong":       stat.total_kosong++;      stat.kosong++;      break;
    }
  });

  return Object.values(guruStats)
    .sort((a, b) => a.nama_guru.localeCompare(b.nama_guru))
    .map(stat => {
      // Resolve kelas IDs → nama kelas, urutkan
      const namaKelas = Array.from(stat.kelas_ids)
        .map(id => kelasMap[id] ? kelasMap[id].nama_kelas : id)
        .sort()
        .join(", ");
      const { kelas_ids, ...rest } = stat;
      return { ...rest, nama_kelas: namaKelas };
    });
}

/**
 * GET ?action=laporanHarian&tanggal=YYYY-MM-DD&token=xxx
 * Admin only.
 */
function handleLaporanHarian(params) {
  const { token, tanggal, kelas_id } = params;
  requireRole(token, ["admin"]);

  if (!tanggal) return errorResponse("Parameter tanggal wajib diisi.");

  const data = buildLaporan(tanggal, tanggal, kelas_id || null);
  return successResponse(data);
}

/**
 * GET ?action=laporanMingguan&dari=YYYY-MM-DD&sampai=YYYY-MM-DD&token=xxx
 * Admin only.
 */
function handleLaporanMingguan(params) {
  const { token, dari, sampai, kelas_id } = params;
  requireRole(token, ["admin"]);

  if (!dari || !sampai) return errorResponse("Parameter dari dan sampai wajib diisi.");
  if (dari > sampai)    return errorResponse("Tanggal 'dari' tidak boleh lebih besar dari 'sampai'.");

  const data = buildLaporan(dari, sampai, kelas_id || null);
  return successResponse(data);
}

/**
 * GET ?action=laporanBulanan&bulan=MM&tahun=YYYY&token=xxx
 * Admin only.
 */
function handleLaporanBulanan(params) {
  const { token, bulan, tahun, kelas_id } = params;
  requireRole(token, ["admin"]);

  if (!bulan || !tahun) return errorResponse("Parameter bulan dan tahun wajib diisi.");

  const mm = String(bulan).padStart(2, "0");
  const yyyy = String(tahun);

  const dari = `${yyyy}-${mm}-01`;
  const lastDay = new Date(parseInt(yyyy), parseInt(bulan), 0).getDate();
  const sampai = `${yyyy}-${mm}-${String(lastDay).padStart(2, "0")}`;

  const data = buildLaporan(dari, sampai, kelas_id || null);
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
