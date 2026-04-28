// ============================================================
// utils.gs — Helper Umum
// ============================================================

/**
 * Ambil instance SpreadsheetApp berdasarkan SPREADSHEET_ID.
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Normalisasi nama field/header agar tahan terhadap spasi, kapitalisasi,
 * dan karakter tak terlihat dari Google Sheets / copy-paste.
 * @param {*} value
 * @returns {string}
 */
function normalizeFieldName(value) {
  return String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/**
 * Normalisasi string umum dari sheet / request.
 * @param {*} value
 * @returns {string}
 */
function normalizeString(value) {
  return String(value == null ? "" : value)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

/**
 * Normalisasi email agar pencarian tahan spasi dan kapitalisasi.
 * @param {*} value
 * @returns {string}
 */
function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

/**
 * Cek apakah string tampak seperti hash SHA-256 hex.
 * @param {*} value
 * @returns {boolean}
 */
function looksLikeSha256Hash(value) {
  return /^[a-f0-9]{64}$/i.test(normalizeString(value));
}

/**
 * Ambil sheet berdasarkan nama.
 * @param {string} name - Nama sheet
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

/**
 * Ambil semua baris dari sheet sebagai array of objects.
 * Baris pertama adalah header.
 * @param {string} sheetName
 * @returns {Object[]}
 */
function getAllRows(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0].map(header => normalizeFieldName(header));
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, idx) => {
      let val = row[idx];

      // Sheets returns date cells as Date objects — normalize to YYYY-MM-DD string
      // so all downstream string comparisons (tanggal >= dari, etc.) work correctly.
      if (val instanceof Date) {
        val = formatDate(val);
      } else if (typeof val === "string") {
        val = normalizeString(val);
        if (/^true$/i.test(val)) val = true;
        else if (/^false$/i.test(val)) val = false;
      } else if (val === true) {
        val = true;
      } else if (val === false) {
        val = false;
      }

      obj[header] = val;
    });
    return obj;
  });
}

/**
 * Tambah baris baru ke sheet berdasarkan object.
 * @param {string} sheetName
 * @param {Object} obj - Object dengan key sesuai header
 */
function appendRow(sheetName, obj) {
  const sheet = getSheet(sheetName);
  const headers = HEADERS[sheetName];
  if (!headers) throw new Error("Headers not defined for sheet: " + sheetName);

  const row = headers.map(h => {
    const val = obj[h];
    if (val === null || val === undefined) return "";
    // Normalize string inputs to prevent whitespace-only records
    return typeof val === "string" ? normalizeString(val) : val;
  });
  sheet.appendRow(row);
}

/**
 * Update baris berdasarkan ID.
 * @param {string} sheetName
 * @param {string} id - ID baris yang ingin diupdate
 * @param {Object} updates - Field yang ingin diupdate
 * @returns {boolean} - true jika berhasil
 */
function updateRowById(sheetName, id, updates) {
  const sheet = getSheet(sheetName);
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const normalizedHeaders = headers.map(header => normalizeFieldName(header));
  const idColIdx = normalizedHeaders.indexOf("id");
  if (idColIdx === -1) return false;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(id)) {
      Object.keys(updates).forEach(key => {
        const colIdx = normalizedHeaders.indexOf(normalizeFieldName(key));
        if (colIdx !== -1) {
          sheet.getRange(i + 1, colIdx + 1).setValue(updates[key]);
        }
      });
      return true;
    }
  }
  return false;
}

/**
 * Cari satu baris berdasarkan ID.
 * @param {string} sheetName
 * @param {string} id
 * @returns {Object|null}
 */
function findRowById(sheetName, id) {
  const rows = getAllRows(sheetName);
  return rows.find(r => String(r.id) === String(id)) || null;
}

/**
 * Cari satu baris berdasarkan field tertentu.
 * @param {string} sheetName
 * @param {string} field - Nama kolom
 * @param {*} value - Nilai yang dicari
 * @returns {Object|null}
 */
function findRowByField(sheetName, field, value) {
  const rows = getAllRows(sheetName);
  const normalizedField = normalizeFieldName(field);
  const searchVal = normalizedField === "email"
    ? normalizeEmail(value)
    : normalizeString(value);

  return rows.find(r => {
    const rowVal = r[normalizedField];
    if (normalizedField === "email") {
      return normalizeEmail(rowVal) === searchVal;
    }
    return normalizeString(rowVal) === searchVal;
  }) || null;
}

/**
 * Cari banyak baris berdasarkan field tertentu.
 */
function findRowsByField(sheetName, field, value) {
  const rows = getAllRows(sheetName);
  const normalizedField = normalizeFieldName(field);
  const searchVal = normalizedField === "email"
    ? normalizeEmail(value)
    : normalizeString(value);

  return rows.filter(r => {
    const rowVal = r[normalizedField];
    if (normalizedField === "email") {
      return normalizeEmail(rowVal) === searchVal;
    }
    return normalizeString(rowVal) === searchVal;
  });
}

/**
 * Buat response JSON sebagai ContentService output.
 * @param {Object} payload
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Response sukses standar.
 */
function successResponse(data, extra) {
  const payload = { success: true };
  if (data !== undefined) payload.data = data;
  if (extra) Object.assign(payload, extra);
  return jsonResponse(payload);
}

/**
 * Response error standar.
 */
function errorResponse(message, code) {
  const payload = { success: false, message: message };
  if (code) payload.code = code;
  return jsonResponse(payload);
}

/**
 * Generate UUID v4 sederhana.
 * @returns {string}
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * Hash password dengan SHA-256.
 * @param {string} password
 * @returns {string} hex string
 */
function hashPassword(password) {
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  return rawHash.map(b => {
    const byte = (b < 0 ? b + 256 : b).toString(16);
    return byte.length === 1 ? "0" + byte : byte;
  }).join("");
}

/**
 * Verifikasi password dengan hash.
 * @param {string} password
 * @param {string} hash
 * @returns {boolean}
 */
function verifyPassword(password, hash) {
  const plain = normalizeString(password);
  const stored = normalizeString(hash);
  if (!stored) return false;

  if (looksLikeSha256Hash(stored)) {
    return hashPassword(plain) === stored.toLowerCase();
  }

  // Backward compatibility for old/manual sheet data that still stores plaintext.
  return plain === stored;
}

/**
 * Konversi tanggal (YYYY-MM-DD) ke nama hari Indonesia.
 * @param {string} dateStr - format YYYY-MM-DD
 * @returns {string} Nama hari dalam Bahasa Indonesia
 */
function toDayName(dateStr) {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  // Parse tanggal lokal tanpa timezone shift
  const parts = dateStr.split("-");
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return days[date.getDay()];
}

/**
 * Format tanggal ke ISO string YYYY-MM-DD.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const d = date || new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse body POST request dengan aman.
 * @param {GoogleAppsScript.Events.DoPost} e
 * @returns {Object}
 */
function parseBody(e) {
  try {
    if (e.postData && e.postData.contents) {
      return JSON.parse(e.postData.contents);
    }
  } catch (err) {
    Logger.log("parseBody error: " + err.message);
  }
  return {};
}

/**
 * Log ke Logger untuk debugging.
 * @param {string} label
 * @param {*} data
 */
function debugLog(label, data) {
  Logger.log(`[${label}] ${JSON.stringify(data)}`);
}
