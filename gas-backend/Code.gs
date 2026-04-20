// ============================================================
// Code.gs — Main Router: doGet dan doPost
// ============================================================

/**
 * Handler HTTP GET
 * Endpoint: ?action=xxx&token=xxx&other_params=...
 */
function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action;

    if (!action) {
      return errorResponse("Parameter 'action' wajib diisi.");
    }

    switch (action) {

      // --- Auth ---
      case "logout":
        return handleLogout({ token: params.token });

      // --- Dashboard ---
      case "getRekapHariIni":
        return handleGetRekapHariIni(params);

      // --- Guru ---
      case "getGuru":
        return handleGetGuru(params);

      // --- Kelas ---
      case "getKelas":
        return handleGetKelas(params);

      // --- Jadwal ---
      case "getJadwal":
        return handleGetJadwal(params);

      // --- Petugas ---
      case "getPetugas":
        return handleGetPetugas(params);

      // --- Absensi ---
      case "getJadwalHari":
        return handleGetJadwalHari(params);

      case "cekAbsensi":
        return handleCekAbsensi(params);

      // --- Laporan ---
      case "laporanHarian":
        return handleLaporanHarian(params);

      case "laporanMingguan":
        return handleLaporanMingguan(params);

      case "laporanBulanan":
        return handleLaporanBulanan(params);

      // --- Setup via URL ---
      case "setup":
        initializeApp();
        return jsonResponse({ success: true, message: "Database berhasil disetup dan diseed." });

      default:
        return errorResponse(`Action '${action}' tidak dikenal.`);
    }

  } catch (err) {
    Logger.log("doGet error: " + err.message + "\n" + err.stack);
    return errorResponse(err.message || "Terjadi kesalahan pada server.");
  }
}

/**
 * Handler HTTP POST
 * Body: JSON dengan field 'token' dan field lainnya.
 * Action diambil dari query string: ?action=xxx
 */
function doPost(e) {
  try {
    const params = e.parameter || {};
    const action = params.action;
    const body   = parseBody(e);

    if (!action) {
      return errorResponse("Parameter 'action' wajib diisi.");
    }

    // Merge action dari query string agar bisa dipakai di body juga
    if (!body.action) body.action = action;

    switch (action) {

      // --- Auth ---
      case "login":
        return handleLogin(body);

      case "logout":
        return handleLogout(body);

      // --- Guru ---
      case "addGuru":
        return handleAddGuru(body);

      case "editGuru":
        return handleEditGuru(body);

      case "deleteGuru":
        return handleDeleteGuru(body);

      // --- Jadwal ---
      case "setJadwal":
        return handleSetJadwal(body);

      // --- Petugas ---
      case "addPetugas":
        return handleAddPetugas(body);

      case "editPetugas":
        return handleEditPetugas(body);

      case "deletePetugas":
        return handleDeletePetugas(body);

      case "resetPassword":
        return handleResetPassword(body);

      // --- Absensi ---
      case "submitAbsensi":
        return handleSubmitAbsensi(body);

      default:
        return errorResponse(`Action '${action}' tidak dikenal.`);
    }

  } catch (err) {
    Logger.log("doPost error: " + err.message + "\n" + err.stack);
    return errorResponse(err.message || "Terjadi kesalahan pada server.");
  }
}

// ============================================================
// Setup Database dan Data Awal
// ============================================================

/**
 * Buat semua sheet yang diperlukan beserta header-nya.
 * Aman dijalankan berulang: tidak akan membuat duplikat.
 */
function setupDatabase() {
  const ss = getSpreadsheet();

  Object.entries(HEADERS).forEach(([sheetName, headers]) => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log(`Sheet '${sheetName}' dibuat.`);
    }

    // Cek apakah header sudah ada
    const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const isEmpty  = firstRow.every(cell => cell === "" || cell === null);

    if (isEmpty) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      // Tebalkan header
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      Logger.log(`Header sheet '${sheetName}' ditulis.`);
    } else {
      Logger.log(`Header sheet '${sheetName}' sudah ada, dilewati.`);
    }
  });

  Logger.log("✅ setupDatabase selesai.");
}

/**
 * Seed data awal:
 * - 16 kelas
 * - 1 akun admin default
 * Aman dijalankan berulang (idempotent).
 */
function seedInitialData() {
  seedKelas();
  seedAdmin();
  seedGuru();
  seedPetugas();
  Logger.log("✅ seedInitialData selesai.");
}

/**
 * Seed 16 kelas default.
 */
function seedKelas() {
  const existingKelas = getAllRows(SHEETS.KELAS).map(k => k.nama_kelas);

  DEFAULT_KELAS.forEach(namaKelas => {
    if (existingKelas.includes(namaKelas)) {
      Logger.log(`Kelas '${namaKelas}' sudah ada, dilewati.`);
      return;
    }
    appendRow(SHEETS.KELAS, {
      id:         generateUUID(),
      nama_kelas: namaKelas,
      wali_kelas: "",
      dibuat_pada: new Date().toISOString()
    });
    Logger.log(`Kelas '${namaKelas}' berhasil ditambahkan.`);
  });
}

/**
 * Seed akun admin default.
 */
function seedAdmin() {
  const emailLower = DEFAULT_ADMIN.email.toLowerCase();
  const existing = findRowByField(SHEETS.USERS, "email", emailLower);

  if (existing) {
    Logger.log(`Admin '${emailLower}' sudah ada, dilewati.`);
    return;
  }

  appendRow(SHEETS.USERS, {
    id:            generateUUID(),
    nama:          DEFAULT_ADMIN.nama,
    email:         emailLower,
    kata_sandi:    hashPassword(DEFAULT_ADMIN.password),
    peran:         "admin",
    id_kelas:      "",
    aktif:         true,
    dibuat_pada:   new Date().toISOString()
  });

  Logger.log(`Admin '${emailLower}' berhasil dibuat.`);
}

/**
 * Seed 3 Guru Dummy.
 */
function seedGuru() {
  const dummyGurus = [
    { nama: "Budi Santoso, S.Pd", nip: "198001012005011001", mapel: "Matematika" },
    { nama: "Siti Aminah, M.Pd", nip: "197502022000032002", mapel: "Bahasa Indonesia" },
    { nama: "Ahmad Fauzi, S.Ag", nip: "198205052008011003", mapel: "Pendidikan Agama Islam" }
  ];

  const existingGurus = getAllRows(SHEETS.GURU).map(g => g.nip);

  dummyGurus.forEach(g => {
    if (existingGurus.includes(g.nip)) return;
    appendRow(SHEETS.GURU, {
      id: generateUUID(),
      nama: g.nama,
      nip: g.nip,
      mapel: g.mapel,
      aktif: true,
      dibuat_pada: new Date().toISOString()
    });
    Logger.log(`Guru '${g.nama}' berhasil dibuat.`);
  });
}

/**
 * Seed 1 Petugas Dummy (Kelas X-A).
 */
function seedPetugas() {
  const emailLower = "petugas@maswh.id";
  const existing = findRowByField(SHEETS.USERS, "email", emailLower);

  if (existing) {
    Logger.log(`Petugas '${emailLower}' sudah ada, dilewati.`);
    return;
  }

  const kelasXA = getAllRows(SHEETS.KELAS).find(k => k.nama_kelas === "X-A");
  const id_kelas = kelasXA ? kelasXA.id : "";

  appendRow(SHEETS.USERS, {
    id:            generateUUID(),
    nama:          "Petugas X-A",
    email:         emailLower,
    kata_sandi:    hashPassword("petugas123"),
    peran:         "petugas",
    id_kelas:      id_kelas,
    aktif:         true,
    dibuat_pada:   new Date().toISOString()
  });

  Logger.log(`Petugas '${emailLower}' berhasil dibuat.`);
}

/**
 * Fungsi utama setup lengkap.
 * Jalankan sekali saat deploy atau via ?action=setup.
 */
function initializeApp() {
  Logger.log("--- Starting Application Setup ---");
  setupDatabase();
  cleanupGurus(); // Clean up existing duplicates before seeding
  seedInitialData();
  Logger.log("========================================");
  Logger.log("✅ Aplikasi siap digunakan!");
  Logger.log(`Admin: admin@maswh.id / admin123`);
  Logger.log(`Petugas (X-A): petugas@maswh.id / petugas123`);
  Logger.log("========================================");
}

/**
 * Cleanup function: Remove duplicate Gurus based on NIP.
 * Preserves the first instance found.
 */
function cleanupGurus() {
  const sheet = getSheet(SHEETS.GURU);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 2) return; // Only header or 1 row

  const headers = data[0];
  const nipIdx = headers.indexOf("nip");
  if (nipIdx === -1) return;

  const seenNips = new Set();
  const rowsToKeep = [headers];
  let deletedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const nip = String(data[i][nipIdx]).trim();
    if (!nip || seenNips.has(nip)) {
      deletedCount++;
      continue;
    }
    seenNips.add(nip);
    rowsToKeep.push(data[i]);
  }

  if (deletedCount > 0) {
    sheet.clearContents();
    sheet.getRange(1, 1, rowsToKeep.length, headers.length).setValues(rowsToKeep);
    Logger.log(`✅ Cleanup: Menghapus ${deletedCount} duplikasi guru.`);
  }
}
