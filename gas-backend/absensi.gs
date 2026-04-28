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

  // Petugas hanya boleh akses kelas yang ditugaskan
  if (!isClassAllowed(session, kelas_id)) {
    return errorResponse("Anda tidak memiliki akses ke data kelas ini.");
  }

  // Validasi kelas
  const kelas = findRowById(SHEETS.KELAS, kelas_id);
  if (!kelas) return errorResponse("Kelas tidak ditemukan.");

  // Konversi tanggal ke nama hari
  const namaHari = toDayName(tanggal);
  if (!VALID_HARI.includes(namaHari)) {
    return jsonResponse({
      success: true,
      jadwal: [],
      message: `${namaHari} bukan hari sekolah.`,
    });
  }

  // Ambil jadwal sesuai kelas dan hari
  const guruMap = {};
  getAllRows(SHEETS.GURU).forEach((g) => {
    guruMap[g.id] = g;
  });

  // Deduplicate per jam_ke — ambil satu entri per slot jika sheet punya baris ganda
  const seenJam = new Set();
  const jadwal = getAllRows(SHEETS.JADWAL)
    .filter((j) => String(j.id_kelas) === String(kelas_id) && j.hari === namaHari)
    .sort((a, b) => Number(a.jam_ke) - Number(b.jam_ke))
    .filter((j) => {
      const jam = Number(j.jam_ke);
      if (seenJam.has(jam)) return false;
      seenJam.add(jam);
      return true;
    })
    .map((j) => ({
      jam_ke: Number(j.jam_ke),
      guru_id: j.id_guru,
      nama_guru: guruMap[j.id_guru] ? guruMap[j.id_guru].nama : "(tidak diketahui)",
      mapel: j.mapel,
      jadwal_id: j.id,
    }));

  return jsonResponse({ success: true, jadwal });
}

/**
 * GET ?action=cekAbsensi&kelas_id=X&tanggal=YYYY-MM-DD&token=xxx
 * Cek apakah absensi kelas pada tanggal tertentu sudah disubmit.
 */
function handleCekAbsensi(params) {
  const { token, kelas_id, tanggal } = params;
  const session = requireRole(token, ["admin", "petugas"]);

  if (!kelas_id || !tanggal) {
    return errorResponse("kelas_id dan tanggal wajib diisi.");
  }

  if (!isClassAllowed(session, kelas_id)) {
    return errorResponse("Anda tidak memiliki akses ke data kelas ini.");
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
  return absensiRows.some(
    (a) =>
      String(a.id_kelas) === String(kelas_id) &&
      String(a.tanggal).substring(0, 10) === String(tanggal).substring(0, 10),
  );
}

/**
 * POST ?action=submitAbsensi
 * Body: { token, tanggal, kelas_id, petugas_id?, data: [{ jadwal_id, guru_id, jam_ke, status }] }
 * Petugas hanya boleh submit kelas sendiri.
 * Hanya boleh submit 1x per kelas per hari.
 * Menggunakan LockService untuk mencegah race condition.
 */
function handleSubmitAbsensi(body) {
  const { token, tanggal, kelas_id, petugas_id, data } = body;
  const session = requireRole(token, ["admin", "petugas"]);
  const effectivePetugasId = petugas_id || session.id_pengguna;

  // Validasi field wajib
  if (!tanggal || !kelas_id || !data) {
    return errorResponse("Semua field wajib diisi: tanggal, kelas_id, data.");
  }

  // Proxy GET meng-encode array sebagai JSON string — parse kembali jika perlu
  let parsedData = data;
  if (typeof data === 'string') {
    try { parsedData = JSON.parse(data); } catch (e) {
      return errorResponse("Format data absensi tidak valid.");
    }
  }

  if (!Array.isArray(parsedData) || parsedData.length === 0) {
    return errorResponse("Data absensi tidak boleh kosong.");
  }

  // Petugas hanya boleh submit kelas yang ditugaskan
  if (!isClassAllowed(session, kelas_id)) {
    return errorResponse("Anda tidak memiliki izin untuk submit absensi kelas ini.");
  }

  // Validasi tanggal adalah hari kerja
  const namaHari = toDayName(tanggal);
  if (!VALID_HARI.includes(namaHari)) {
    return errorResponse(`${namaHari} bukan hari sekolah, absensi tidak dapat disubmit.`);
  }

  // Validasi kelas ada
  const kelas = findRowById(SHEETS.KELAS, kelas_id);
  if (!kelas) return errorResponse("Kelas tidak ditemukan.");

  if (!effectivePetugasId) {
    return errorResponse("Petugas tidak valid. Silakan login ulang.");
  }

  if (session.peran === "petugas" && String(effectivePetugasId) !== String(session.id_pengguna)) {
    return errorResponse(
      "Anda tidak memiliki izin untuk mengirim absensi atas nama pengguna lain.",
    );
  }

  // Validasi petugas/session user ada
  const petugas = findRowById(SHEETS.USERS, effectivePetugasId);
  if (!petugas) return errorResponse("Petugas tidak ditemukan.");
  if (!isClassAllowed(petugas, kelas_id)) {
    return errorResponse("Petugas tidak ditugaskan pada kelas ini.");
  }

  // Validasi setiap data item
  const validStatuses = VALID_STATUS;
  for (let i = 0; i < parsedData.length; i++) {
    const item = parsedData[i];
    if (!item.jadwal_id || !item.guru_id || !item.jam_ke || !item.status) {
      return errorResponse(`Data absensi ke-${i + 1} tidak lengkap.`);
    }
    if (!validStatuses.includes(item.status)) {
      return errorResponse(
        `Status '${item.status}' tidak valid. Pilih: ${validStatuses.join(", ")}.`,
      );
    }
    // Validasi jadwal_id ada
    const jadwal = findRowById(SHEETS.JADWAL, item.jadwal_id);
    if (!jadwal) return errorResponse(`jadwal_id '${item.jadwal_id}' tidak ditemukan.`);
    if (String(jadwal.id_kelas) !== String(kelas_id)) {
      return errorResponse(`jadwal_id '${item.jadwal_id}' tidak sesuai dengan kelas yang dipilih.`);
    }
    if (jadwal.hari !== namaHari) {
      return errorResponse(`jadwal_id '${item.jadwal_id}' tidak sesuai dengan hari ${namaHari}.`);
    }
    if (String(jadwal.id_guru) !== String(item.guru_id)) {
      return errorResponse(`guru_id untuk jadwal '${item.jadwal_id}' tidak sesuai.`);
    }
    if (Number(jadwal.jam_ke) !== Number(item.jam_ke)) {
      return errorResponse(`jam_ke untuk jadwal '${item.jadwal_id}' tidak sesuai.`);
    }
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
    parsedData.forEach((item) => {
      const row = {
        id: generateUUID(),
        tanggal: tanggal,
        id_kelas: kelas_id,
        id_guru: item.guru_id,
        id_jadwal: item.jadwal_id,
        jam_ke: Number(item.jam_ke),
        status: item.status,
        id_petugas: effectivePetugasId,
        dibuat_pada: submittedAt,
      };
      appendRow(SHEETS.ABSENSI, row);
    });

    return jsonResponse({ success: true, message: "Absensi berhasil disubmit." });
  } finally {
    lock.releaseLock();
  }
}

/**
 * GET ?action=getRiwayat&kelas_id=X&token=xxx
 * Riwayat submit absensi per kelas.
 * Admin bisa lihat kelas mana saja, petugas hanya kelasnya sendiri.
 */
function handleGetRiwayat(params) {
  const { token, kelas_id } = params;
  const session = requireRole(token, ["admin", "petugas"]);

  const targetKelasId =
    kelas_id || (session.id_kelas ? session.id_kelas.split(",")[0].trim() : null);
  if (!targetKelasId) {
    return errorResponse("kelas_id wajib diisi.");
  }

  if (!isClassAllowed(session, targetKelasId)) {
    return errorResponse("Anda tidak memiliki akses ke data kelas lain.");
  }

  const kelas = findRowById(SHEETS.KELAS, targetKelasId);
  if (!kelas) return errorResponse("Kelas tidak ditemukan.");

  const grouped = {};
  getAllRows(SHEETS.ABSENSI)
    .filter((a) => String(a.id_kelas) === String(targetKelasId))
    .forEach((a) => {
      const tanggal = String(a.tanggal).substring(0, 10);
      if (!grouped[tanggal]) {
        grouped[tanggal] = {
          tanggal: tanggal,
          total: 0,
          status: "Selesai",
        };
      }
      grouped[tanggal].total += 1;
    });

  const data = Object.values(grouped).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  return successResponse(data);
}

/**
 * Helper: Cek apakah user memiliki akses ke kelas tertentu.
 * Mendukung id_kelas tunggal maupun multi (comma-separated).
 * @param {Object} userOrSession
 * @param {string} targetKelasId
 * @returns {boolean}
 */
function isClassAllowed(userOrSession, targetKelasId) {
  if (userOrSession.peran === "admin") return true;
  if (!userOrSession.id_kelas) return false;

  const allowedIds = String(userOrSession.id_kelas)
    .split(",")
    .map((id) => id.trim());
  return allowedIds.includes(String(targetKelasId));
}
