// ============================================================
// auth.gs — Autentikasi, Session, Otorisasi
// ============================================================

/**
 * Generate token acak yang kuat (UUID v4 + timestamp).
 * @returns {string}
 */
function generateToken() {
  return generateUUID() + "-" + new Date().getTime();
}

/**
 * Buat session baru untuk user setelah login berhasil.
 * @param {Object} user - Object user dari sheet users
 * @returns {string} token
 */
function createSession(user) {
  const now = new Date();
  const expired = new Date(now.getTime() + SESSION_DURATION_MS);
  const token = generateToken();

  const session = {
    id: generateUUID(),
    id_pengguna: user.id,
    token: token,
    peran: user.peran,
    id_kelas: user.id_kelas || "",
    dibuat_pada: now.toISOString(),
    berakhir_pada: expired.toISOString(),
    aktif: true,
  };

  appendRow(SHEETS.SESSIONS, session);
  return token;
}

/**
 * Validasi token dan kembalikan data session jika valid.
 * Otomatis tolak token kadaluarsa atau nonaktif.
 * @param {string} token
 * @returns {Object|null} session object atau null
 */
function validateToken(token) {
  if (!token) return null;

  const sessions = getAllRows(SHEETS.SESSIONS);
  const session = sessions.find((s) => s.token === token);

  if (!session) return null;
  if (!session.aktif || session.aktif === "false") return null;

  const now = new Date();
  const expired = new Date(session.berakhir_pada);
  if (now > expired) {
    // Auto-expire: nonaktifkan token
    invalidateToken(token);
    return null;
  }

  return session;
}

/**
 * Nonaktifkan token (logout).
 * @param {string} token
 */
function invalidateToken(token) {
  const sessions = getAllRows(SHEETS.SESSIONS);
  const session = sessions.find((s) => s.token === token);
  if (session) {
    updateRowById(SHEETS.SESSIONS, session.id, { aktif: false });
  }
}

/**
 * Validasi bahwa token ada dan valid.
 * Melempar error jika tidak valid.
 * @param {string} token
 * @returns {Object} session
 */
function requireAuth(token) {
  const session = validateToken(token);
  if (!session) {
    throw new Error("Unauthorized: token tidak valid atau sudah kedaluwarsa. Silakan login ulang.");
  }
  return session;
}

/**
 * Validasi bahwa token valid DAN memiliki role yang diizinkan.
 * @param {string} token
 * @param {string[]} roles - Array role yang diizinkan
 * @returns {Object} session
 */
function requireRole(token, roles) {
  const session = requireAuth(token);
  if (!roles.includes(session.peran)) {
    throw new Error(`Terlarang: peran '${session.peran}' tidak memiliki akses ke fungsi ini.`);
  }
  return session;
}

/**
 * Handler login.
 * POST ?action=login
 * Body: { email, password }
 */
function handleLogin(body) {
  const email = normalizeEmail(body.email);
  const password = normalizeString(body.password);

  if (!email || !password) {
    return errorResponse("Email dan password wajib diisi.");
  }

  const user = findRowByField(SHEETS.USERS, "email", email);

  if (!user) {
    return errorResponse("Email atau kata sandi salah.");
  }

  if (!user.aktif || user.aktif === false || user.aktif === "false") {
    return errorResponse("Akun Anda tidak aktif. Hubungi administrator.");
  }

  if (!verifyPassword(password, user.kata_sandi)) {
    return errorResponse("Email atau kata sandi salah.");
  }

  // Migrasi mulus untuk data lama yang masih menyimpan password plaintext.
  if (!looksLikeSha256Hash(user.kata_sandi)) {
    updateRowById(SHEETS.USERS, user.id, {
      kata_sandi: hashPassword(password),
    });
  }

  const token = createSession(user);

  // Ambil nama kelas untuk UX yang lebih baik di dashboard (mendukung multi kelas)
  let idsKelas = user.id_kelas
    ? String(user.id_kelas)
        .split(",")
        .map((id) => id.trim())
    : [];
  let namaKelasList = idsKelas.map((id) => {
    const k = findRowById(SHEETS.KELAS, id);
    return k ? k.nama_kelas : id;
  });

  return jsonResponse({
    success: true,
    token: token,
    role: user.peran,
    nama: user.nama,
    kelas_id: user.id_kelas || null,
    kelas_ids: idsKelas,
    nama_kelas: namaKelasList.join(", "),
  });
}

/**
 * Handler logout.
 * POST ?action=logout
 * Body: { token }
 */
function handleLogout(body) {
  const { token } = body;
  if (!token) return errorResponse("Token wajib diisi.");
  invalidateToken(token);
  return jsonResponse({ success: true, message: "Logout berhasil." });
}
