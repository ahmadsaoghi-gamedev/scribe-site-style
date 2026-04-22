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

/**
 * POST ?action=addKelas
 * Body: { token, nama_kelas, wali_kelas }
 * Admin only.
 */
function handleAddKelas(body) {
  const { token, nama_kelas, wali_kelas } = body;
  requireRole(token, ["admin"]);

  if (!nama_kelas) {
    return errorResponse("Nama kelas wajib diisi.");
  }

  // Cek duplikasi nama kelas
  const existing = findRowByField(SHEETS.KELAS, "nama_kelas", nama_kelas.trim());
  if (existing) {
    return errorResponse("Nama kelas sudah ada.");
  }

  const kelas = {
    id:         generateUUID(),
    nama_kelas: nama_kelas.trim(),
    wali_kelas: (wali_kelas || "").trim(),
    dibuat_pada: new Date().toISOString()
  };

  appendRow(SHEETS.KELAS, kelas);
  return jsonResponse({ success: true, message: "Kelas berhasil ditambahkan.", data: kelas });
}

/**
 * POST ?action=editKelas
 * Body: { token, id, nama_kelas, wali_kelas }
 * Admin only.
 */
function handleEditKelas(body) {
  const { token, id, nama_kelas, wali_kelas } = body;
  requireRole(token, ["admin"]);

  if (!id) return errorResponse("ID kelas wajib diisi.");

  const existing = findRowById(SHEETS.KELAS, id);
  if (!existing) return errorResponse("Kelas tidak ditemukan.");

  // Cek duplikasi nama kelas (jika diubah)
  if (nama_kelas && nama_kelas.trim() !== existing.nama_kelas) {
    const conflict = findRowByField(SHEETS.KELAS, "nama_kelas", nama_kelas.trim());
    if (conflict && conflict.id !== id) {
      return errorResponse("Nama kelas sudah digunakan.");
    }
  }

  const updates = {};
  if (nama_kelas !== undefined) updates.nama_kelas = nama_kelas.trim();
  if (wali_kelas !== undefined) updates.wali_kelas = (wali_kelas || "").trim();

  updateRowById(SHEETS.KELAS, id, updates);
  return jsonResponse({ success: true, message: "Data kelas berhasil diperbarui." });
}

/**
 * POST ?action=deleteKelas
 * Body: { token, id }
 * Admin only.
 */
function handleDeleteKelas(body) {
  const { token, id } = body;
  requireRole(token, ["admin"]);

  if (!id) return errorResponse("ID kelas wajib diisi.");

  const existing = findRowById(SHEETS.KELAS, id);
  if (!existing) return errorResponse("Kelas tidak ditemukan.");

  // Opsional: Cek apakah kelas masih digunakan di jadwal atau user (petugas)
  const jadwalAda = getAllRows(SHEETS.JADWAL).some(j => String(j.id_kelas) === String(id));
  if (jadwalAda) {
    return errorResponse("Gagal menghapus: Kelas ini masih memiliki data jadwal.");
  }
  
  const petugasAda = getAllRows(SHEETS.USERS).some(u => String(u.id_kelas).includes(id));
  if (petugasAda) {
    return errorResponse("Gagal menghapus: Kelas ini masih terikat dengan akun petugas.");
  }

  const sheet = getSheet(SHEETS.KELAS);
  const data = sheet.getDataRange().getValues();
  const idIdx = data[0].indexOf("id");
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(id)) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ success: true, message: "Kelas berhasil dihapus." });
    }
  }

  return errorResponse("Gagal menghapus kelas.");
}
