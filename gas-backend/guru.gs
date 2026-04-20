// ============================================================
// guru.gs — CRUD Data Guru
// ============================================================

/**
 * GET ?action=getGuru&token=xxx
 * Admin only.
 */
function handleGetGuru(params) {
  const token = params.token;
  requireRole(token, ["admin"]);

  const gurus = getAllRows(SHEETS.GURU).map(g => ({
    id:    g.id,
    nama:  g.nama,
    nip:   g.nip,
    mapel: g.mapel,
    aktif: g.aktif === true || g.aktif === "true" || g.aktif === "TRUE"
  }));

  return successResponse(gurus);
}

/**
 * POST ?action=addGuru
 * Body: { token, nama, nip, mapel }
 * Admin only.
 */
function handleAddGuru(body) {
  const { token, nama, nip, mapel } = body;
  requireRole(token, ["admin"]);

  if (!nama || !nip || !mapel) {
    return errorResponse("Nama, NIP, dan mapel wajib diisi.");
  }

  // Cek duplikasi NIP
  const existing = findRowByField(SHEETS.GURU, "nip", nip.trim());
  if (existing) {
    return errorResponse("NIP sudah terdaftar.");
  }

  const guru = {
    id:    generateUUID(),
    nama:  nama.trim(),
    nip:   nip.trim(),
    mapel: mapel.trim(),
    aktif: true,
    dibuat_pada: new Date().toISOString()
  };

  appendRow(SHEETS.GURU, guru);
  return jsonResponse({ success: true, message: "Guru berhasil ditambahkan.", data: guru });
}

/**
 * POST ?action=editGuru
 * Body: { token, id, nama, nip, mapel, aktif }
 * Admin only.
 */
function handleEditGuru(body) {
  const { token, id, nama, nip, mapel, aktif } = body;
  requireRole(token, ["admin"]);

  if (!id) return errorResponse("ID guru wajib diisi.");

  const existing = findRowById(SHEETS.GURU, id);
  if (!existing) return errorResponse("Guru tidak ditemukan.");

  // Cek duplikasi NIP (jika NIP diubah)
  if (nip && nip.trim() !== existing.nip) {
    const nipConflict = findRowByField(SHEETS.GURU, "nip", nip.trim());
    if (nipConflict && nipConflict.id !== id) {
      return errorResponse("NIP sudah digunakan oleh guru lain.");
    }
  }

  const updates = {};
  if (nama  !== undefined) updates.nama  = nama.trim();
  if (nip   !== undefined) updates.nip   = nip.trim();
  if (mapel !== undefined) updates.mapel = mapel.trim();
  if (aktif !== undefined) updates.aktif = aktif === true || aktif === "true";

  updateRowById(SHEETS.GURU, id, updates);
  return jsonResponse({ success: true, message: "Data guru berhasil diperbarui." });
}

/**
 * POST ?action=deleteGuru
 * Body: { token, id }
 * Soft delete: aktif = false
 * Admin only.
 */
function handleDeleteGuru(body) {
  const { token, id } = body;
  requireRole(token, ["admin"]);

  if (!id) return errorResponse("ID guru wajib diisi.");

  const existing = findRowById(SHEETS.GURU, id);
  if (!existing) return errorResponse("Guru tidak ditemukan.");

  updateRowById(SHEETS.GURU, id, { aktif: false });
  return jsonResponse({ success: true, message: "Guru berhasil dinonaktifkan." });
}
