// ============================================================
// jadwal.gs — Jadwal Pelajaran per Kelas
// ============================================================

/**
 * GET ?action=getJadwal&kelas_id=X&token=xxx
 * Admin dan petugas bisa akses.
 * Petugas hanya bisa lihat jadwal kelas mereka sendiri.
 */
function handleGetJadwal(params) {
  const { token, kelas_id } = params;
  const session = requireRole(token, ["admin", "petugas"]);

  if (!kelas_id) return errorResponse("kelas_id wajib diisi.");

  // Petugas hanya boleh akses jadwal kelas sendiri
  if (session.peran === "petugas") {
    if (String(session.id_kelas) !== String(kelas_id)) {
      return errorResponse("Anda tidak memiliki akses ke jadwal kelas lain.");
    }
  }

  // Validasi kelas ada
  const kelas = findRowById(SHEETS.KELAS, kelas_id);
  if (!kelas) return errorResponse("Kelas tidak ditemukan.");

  const jadwalRows = getAllRows(SHEETS.JADWAL).filter(j =>
    String(j.id_kelas) === String(kelas_id)
  );

  // Ambil data guru untuk enrichment nama_guru
  const guruMap = {};
  getAllRows(SHEETS.GURU).forEach(g => { guruMap[g.id] = g; });

  const data = jadwalRows.map(j => ({
    id:        j.id,
    hari:      j.hari,
    jam_ke:    Number(j.jam_ke),
    guru_id:   j.id_guru,
    nama_guru: guruMap[j.id_guru] ? guruMap[j.id_guru].nama : "(tidak diketahui)",
    mapel:     j.mapel
  }));

  // Urutkan berdasarkan hari dan jam_ke
  const hariOrder = { "Senin":1, "Selasa":2, "Rabu":3, "Kamis":4, "Jumat":5 };
  data.sort((a, b) => {
    const hariDiff = (hariOrder[a.hari] || 99) - (hariOrder[b.hari] || 99);
    return hariDiff !== 0 ? hariDiff : a.jam_ke - b.jam_ke;
  });

  return successResponse(data);
}

/**
 * POST ?action=setJadwal
 * Body: { token, kelas_id, hari, jam_ke, guru_id, mapel }
 * Admin only.
 * Jika slot sudah ada → update. Jika belum → insert.
 */
function handleSetJadwal(body) {
  const { token, kelas_id, hari, jam_ke, guru_id, mapel } = body;
  requireRole(token, ["admin"]);

  // Validasi field wajib
  if (!kelas_id || !hari || !jam_ke || !guru_id || !mapel) {
    return errorResponse("Semua field wajib diisi: kelas_id, hari, jam_ke, guru_id, mapel.");
  }

  // Validasi hari
  if (!VALID_HARI.includes(hari)) {
    return errorResponse(`Hari tidak valid. Pilih salah satu: ${VALID_HARI.join(", ")}.`);
  }

  // Validasi jam_ke
  const jamNum = Number(jam_ke);
  if (isNaN(jamNum) || jamNum < 1) {
    return errorResponse("jam_ke harus berupa angka positif.");
  }
  const maxJam = MAX_JAM[hari];
  if (jamNum > maxJam) {
    return errorResponse(`Hari ${hari} maksimal ${maxJam} jam pelajaran. Jam ke-${jamNum} tidak valid.`);
  }

  // Validasi kelas ada
  const kelas = findRowById(SHEETS.KELAS, kelas_id);
  if (!kelas) return errorResponse("Kelas tidak ditemukan.");

  // Validasi guru ada dan aktif
  const guru = findRowById(SHEETS.GURU, guru_id);
  if (!guru) return errorResponse("Guru tidak ditemukan.");
  const guruAktif = guru.aktif === true || guru.aktif === "true" || guru.aktif === "TRUE";
  if (!guruAktif) return errorResponse("Guru tidak aktif, pilih guru lain.");

  // Cek apakah slot sudah ada (id_kelas + hari + jam_ke)
  const allJadwal = getAllRows(SHEETS.JADWAL);
  const existing = allJadwal.find(j =>
    String(j.id_kelas) === String(kelas_id) &&
    j.hari === hari &&
    Number(j.jam_ke) === jamNum
  );

  if (existing) {
    // Update slot existing
    updateRowById(SHEETS.JADWAL, existing.id, {
      id_guru: guru_id,
      mapel:   mapel.trim()
    });
    return jsonResponse({ success: true, message: "Jadwal berhasil diperbarui." });
  } else {
    // Insert slot baru
    const newJadwal = {
      id:       generateUUID(),
      id_kelas: kelas_id,
      id_guru:  guru_id,
      hari:     hari,
      jam_ke:   jamNum,
      mapel:    mapel.trim()
    };
    appendRow(SHEETS.JADWAL, newJadwal);
    return jsonResponse({ success: true, message: "Jadwal berhasil ditambahkan." });
  }
}
