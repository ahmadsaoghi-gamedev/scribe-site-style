// ============================================================
// petugas.gs — CRUD Akun Petugas
// ============================================================

/**
 * GET ?action=getPetugas&token=xxx
 * Admin only.
 */
function handleGetPetugas(params) {
  requireRole(params.token, ["admin"]);

  const users = getAllRows(SHEETS.USERS).filter((u) => u.peran === "petugas");
  const kelasMap = {};
  getAllRows(SHEETS.KELAS).forEach((k) => {
    kelasMap[k.id] = k;
  });

  const data = users.map((u) => {
    const ids = u.id_kelas
      ? String(u.id_kelas)
          .split(",")
          .map((s) => s.trim())
      : [];
    const names = ids.map((id) => (kelasMap[id] ? kelasMap[id].nama_kelas : id));

    return {
      id: u.id,
      nama: u.nama,
      email: u.email,
      kelas_id: u.id_kelas || "",
      nama_kelas: names.length > 0 ? names.join(", ") : "(tidak ada)",
      aktif: u.aktif === true || u.aktif === "true" || u.aktif === "TRUE",
    };
  });

  return successResponse(data);
}

/**
 * POST ?action=addPetugas
 * Body: { token, nama, email, password, kelas_id }
 * Admin only. Role otomatis "petugas".
 */
function handleAddPetugas(body) {
  const { token, nama, email, password, kelas_id } = body;
  requireRole(token, ["admin"]);

  if (!nama || !email || !password || !kelas_id) {
    return errorResponse("Nama, email, password, dan kelas_id wajib diisi.");
  }

  // Validasi format email sederhana
  const emailLower = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return errorResponse("Format email tidak valid.");
  }

  // Cek duplikasi email
  const existing = findRowByField(SHEETS.USERS, "email", emailLower);
  if (existing) return errorResponse("Email sudah terdaftar.");

  // Validasi kelas ada dan sudah tidak dipakai petugas lain
  const ids = String(kelas_id)
    .split(",")
    .map((s) => s.trim());
  const allUsers = getAllRows(SHEETS.USERS);

  for (const idKls of ids) {
    const kelas = findRowById(SHEETS.KELAS, idKls);
    if (!kelas) return errorResponse(`Kelas '${idKls}' tidak ditemukan.`);

    const kelasUsed = allUsers.find((u) => {
      if (u.peran !== "petugas" || !(u.aktif === true || u.aktif === "true" || u.aktif === "TRUE"))
        return false;
      const uIds = String(u.id_kelas || "")
        .split(",")
        .map((s) => s.trim());
      return uIds.includes(idKls);
    });

    if (kelasUsed) {
      return errorResponse(
        `Kelas ${kelas.nama_kelas} sudah memiliki petugas aktif (${kelasUsed.nama}).`,
      );
    }
  }

  const user = {
    id: generateUUID(),
    nama: nama.trim(),
    email: emailLower,
    kata_sandi: hashPassword(password),
    peran: "petugas",
    id_kelas: kelas_id,
    aktif: true,
    dibuat_pada: new Date().toISOString(),
  };

  appendRow(SHEETS.USERS, user);
  return jsonResponse({ success: true, message: "Petugas berhasil ditambahkan." });
}

/**
 * POST ?action=editPetugas
 * Body: { token, id, nama, email, kelas_id, aktif }
 * Admin only.
 */
function handleEditPetugas(body) {
  const { token, id, nama, email, kelas_id, aktif } = body;
  requireRole(token, ["admin"]);

  if (!id) return errorResponse("ID petugas wajib diisi.");

  const existing = findRowById(SHEETS.USERS, id);
  if (!existing || existing.peran !== "petugas") {
    return errorResponse("Petugas tidak ditemukan.");
  }

  // Validasi email unik jika diubah
  if (email && email.toLowerCase().trim() !== existing.email) {
    const emailConflict = findRowByField(SHEETS.USERS, "email", email.toLowerCase().trim());
    if (emailConflict && emailConflict.id !== id) {
      return errorResponse("Email sudah digunakan oleh akun lain.");
    }
  }

  // Validasi kelas jika diubah
  if (kelas_id && String(kelas_id) !== String(existing.id_kelas)) {
    const ids = String(kelas_id)
      .split(",")
      .map((s) => s.trim());
    const allUsers = getAllRows(SHEETS.USERS);

    for (const idKls of ids) {
      const kelas = findRowById(SHEETS.KELAS, idKls);
      if (!kelas) return errorResponse(`Kelas '${idKls}' tidak ditemukan.`);

      const kelasUsed = allUsers.find((u) => {
        if (
          u.id === id ||
          u.peran !== "petugas" ||
          !(u.aktif === true || u.aktif === "true" || u.aktif === "TRUE")
        )
          return false;
        const uIds = String(u.id_kelas || "")
          .split(",")
          .map((s) => s.trim());
        return uIds.includes(idKls);
      });

      if (kelasUsed) {
        return errorResponse(
          `Kelas ${kelas.nama_kelas} sudah memiliki petugas aktif (${kelasUsed.nama}).`,
        );
      }
    }
  }

  const updates = {};
  if (nama !== undefined) updates.nama = nama.trim();
  if (email !== undefined) updates.email = email.toLowerCase().trim();
  if (kelas_id !== undefined) updates.id_kelas = kelas_id;
  if (aktif !== undefined) updates.aktif = aktif === true || aktif === "true";

  updateRowById(SHEETS.USERS, id, updates);
  return jsonResponse({ success: true, message: "Data petugas berhasil diperbarui." });
}

/**
 * POST ?action=deletePetugas
 * Body: { token, id }
 * Soft delete: aktif = false. Admin only.
 */
function handleDeletePetugas(body) {
  const { token, id } = body;
  requireRole(token, ["admin"]);

  if (!id) return errorResponse("ID petugas wajib diisi.");

  const existing = findRowById(SHEETS.USERS, id);
  if (!existing || existing.peran !== "petugas") {
    return errorResponse("Petugas tidak ditemukan.");
  }

  updateRowById(SHEETS.USERS, id, { aktif: false });
  return jsonResponse({ success: true, message: "Petugas berhasil dinonaktifkan." });
}

/**
 * POST ?action=resetPassword
 * Body: { token, id, new_password }
 * Admin only.
 */
function handleResetPassword(body) {
  const { token, id, new_password } = body;
  requireRole(token, ["admin"]);

  if (!id || !new_password) {
    return errorResponse("ID dan new_password wajib diisi.");
  }
  if (new_password.length < 6) {
    return errorResponse("Password minimal 6 karakter.");
  }

  const existing = findRowById(SHEETS.USERS, id);
  if (!existing) return errorResponse("Akun tidak ditemukan.");

  updateRowById(SHEETS.USERS, id, { kata_sandi: hashPassword(new_password) });
  return jsonResponse({ success: true, message: "Password berhasil direset." });
}
