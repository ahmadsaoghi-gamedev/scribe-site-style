// ============================================================
// absensi.gs — Absensi Harian Guru
// ============================================================

/**
 * GET ?action=getJadwalHari&kelas_id=X&tanggal=YYYY-MM-DD&token=xxx
 * Admin dan petugas bisa akses (petugas hanya kelas sendiri).
 */
function handleGetJadwalHari(params) {
  const { token, kelas_id, tanggal } = params;
  const session = requireRole(token, ["admin", "petugas"]);

  if (!kelas_id || !tanggal) {
    return errorResponse("kelas_id dan tanggal wajib diisi.");
  }

  // Petugas hanya boleh akses kelas sendiri
  if (session.peran === "petugas" && String(session.id_kelas) !== String(kelas_id)) {
    return errorResponse("Anda tidak memiliki akses ke data kelas lain.");
  }

  // Validasi kelas
  const kelas = findRowById(SHEETS.KELAS, kelas_id);
  if (!kelas) return errorResponse("Kelas tidak ditemukan.");

  // Konversi tanggal ke nama hari
  const namaHari = toDayName(tanggal);
  if (!VALID_HARI.includes(namaHari)) {
    return jsonResponse({
      success: true,
      jadwal:  [],
      message: `${namaHari} bukan hari sekolah.`
    });
  }

  // Ambil jadwal sesuai kelas dan hari
  const guruMap = {};
  getAllRows(SHEETS.GURU).forEach(g => { guruMap[g.id] = g; });

  const jadwal = getAllRows(SHEETS.JADWAL)
    .filter(j => String(j.id_kelas) === String(kelas_id) && j.hari === namaHari)
    .sort((a, b) => Number(a.jam_ke) - Number(b.jam_ke))
    .map(j => ({
      jam_ke:    Number(j.jam_ke),
      guru_id:   j.id_guru,
      nama_guru: guruMap[j.id_guru] ? guruMap[j.id_guru].nama : "(tidak diketahui)",
      mapel:     j.mapel,
      jadwal_id: j.id
    }));

  return jsonResponse({ success: true, jadwal });
}

/**
 * GET ?action=cekAbsensi&kelas_id=X&tanggal=YYYY-MM-DD&token=xxx
 * Cek apakah absensi kelas pada tanggal tertentu sudah disubmit.
 */
function handleCekAbsensi(params) {
  const { token, kelas_id, tanggal } = params;
  requireRole(token, ["admin", "petugas"]);

  if (!kelas_id || !tanggal) {
    return errorResponse("kelas_id dan tanggal wajib diisi.");
  }

  const sudahAbsen = checkAbsensiExists(kelas_id, tanggal);
  return jsonResponse({ success: true, sudah_absen: sudahAbsen });
}

/**
 * Helper: cek apakah absensi untuk kelas+tanggal sudah ada.
 * @param {string} kelas_id
 * @param {string} tanggal - YYYY-MM-DD
 * @returns {boolean}
 */
function checkAbsensiExists(kelas_id, tanggal) {
  const absensiRows = getAllRows(SHEETS.ABSENSI);
  return absensiRows.some(a =>
    String(a.id_kelas) === String(kelas_id) &&
    String(a.tanggal).substring(0, 10) === String(tanggal).substring(0, 10)
  );
}

/**
 * POST ?action=submitAbsensi
 * Body: {
 *   token, tanggal, kelas_id, petugas_id,
 *   data: [{ jadwal_id, guru_id, jam_ke, status }]
 * }
 * Petugas hanya boleh submit kelas sendiri.
 * Hanya boleh submit 1x per kelas per hari.
 * Menggunakan LockService untuk mencegah race condition.
 */
function handleSubmitAbsensi(body) {
  const { token, tanggal, kelas_id, petugas_id, data } = body;
  const session = requireRole(token, ["admin", "petugas"]);

  // Validasi field wajib
  if (!tanggal || !kelas_id || !petugas_id || !data) {
    return errorResponse("Semua field wajib diisi: tanggal, kelas_id, petugas_id, data.");
  }
  if (!Array.isArray(data) || data.length === 0) {
    return errorResponse("Data absensi tidak boleh kosong.");
  }

  // Petugas hanya boleh submit kelas sendiri
  if (session.peran === "petugas" && String(session.id_kelas) !== String(kelas_id)) {
    return errorResponse("Anda tidak memiliki izin untuk submit absensi kelas lain.");
  }

  // Validasi tanggal adalah hari kerja
  const namaHari = toDayName(tanggal);
  if (!VALID_HARI.includes(namaHari)) {
    return errorResponse(`${namaHari} bukan hari sekolah, absensi tidak dapat disubmit.`);
  }

  // Validasi kelas ada
  const kelas = findRowById(SHEETS.KELAS, kelas_id);
  if (!kelas) return errorResponse("Kelas tidak ditemukan.");

  // Validasi petugas_id ada
  const petugas = findRowById(SHEETS.USERS, petugas_id);
  if (!petugas) return errorResponse("Petugas tidak ditemukan.");

  // Validasi setiap data item
  const validStatuses = VALID_STATUS;
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!item.jadwal_id || !item.guru_id || !item.jam_ke || !item.status) {
      return errorResponse(`Data absensi ke-${i + 1} tidak lengkap.`);
    }
    if (!validStatuses.includes(item.status)) {
      return errorResponse(`Status '${item.status}' tidak valid. Pilih: ${validStatuses.join(", ")}.`);
    }
    // Validasi jadwal_id ada
    const jadwal = findRowById(SHEETS.JADWAL, item.jadwal_id);
    if (!jadwal) return errorResponse(`jadwal_id '${item.jadwal_id}' tidak ditemukan.`);
    // Validasi guru_id ada
    const guru = findRowById(SHEETS.GURU, item.guru_id);
    if (!guru) return errorResponse(`guru_id '${item.guru_id}' tidak ditemukan.`);
  }

  // Gunakan LockService untuk cegah race condition submit ganda
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // tunggu maks 10 detik
  } catch (e) {
    return errorResponse("Server sedang sibuk memproses permintaan lain, coba lagi.");
  }

  try {
    // Cek ulang setelah lock: apakah absensi sudah ada?
    if (checkAbsensiExists(kelas_id, tanggal)) {
      return errorResponse("Absensi untuk kelas ini pada tanggal tersebut sudah pernah disubmit.");
    }

    const submittedAt = new Date().toISOString();

    // Batch insert semua baris absensi
    data.forEach(item => {
      const row = {
        id:           generateUUID(),
        tanggal:      tanggal,
        id_kelas:     kelas_id,
        id_guru:      item.guru_id,
        id_jadwal:    item.jadwal_id,
        jam_ke:       Number(item.jam_ke),
        status:       item.status,
        id_petugas:   petugas_id,
        dibuat_pada:  submittedAt
      };
      appendRow(SHEETS.ABSENSI, row);
    });

    return jsonResponse({ success: true, message: "Absensi berhasil disubmit." });

  } finally {
    lock.releaseLock();
  }
}
