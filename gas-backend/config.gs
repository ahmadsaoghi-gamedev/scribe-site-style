// ============================================================
// config.gs — Konfigurasi Aplikasi dan Konstanta
// ============================================================

// Ganti dengan Spreadsheet ID Anda setelah membuat Google Sheet baru
const SPREADSHEET_ID = "1Xr4hml4WFXDtTHAqd_AtvRyAb0ZlnLLOWVK1NGewqiQ";

// Nama-nama sheet dalam spreadsheet
const SHEETS = {
  USERS:    "users",
  KELAS:    "kelas",
  GURU:     "guru",
  JADWAL:   "jadwal",
  ABSENSI:  "absensi",
  SESSIONS: "sessions"
};

// Header setiap sheet (Full Bahasa Indonesia)
const HEADERS = {
  users:    ["id", "nama", "email", "kata_sandi", "peran", "id_kelas", "aktif", "dibuat_pada"],
  kelas:    ["id", "nama_kelas", "wali_kelas", "dibuat_pada"],
  guru:     ["id", "nama", "nip", "mapel", "aktif", "dibuat_pada"],
  jadwal:   ["id", "id_kelas", "id_guru", "hari", "jam_ke", "mapel"],
  absensi:  ["id", "tanggal", "id_kelas", "id_guru", "id_jadwal", "jam_ke", "status", "id_petugas", "dibuat_pada"],
  sessions: ["id", "id_pengguna", "token", "peran", "id_kelas", "dibuat_pada", "berakhir_pada", "aktif"]
};

// Durasi session (dalam milidetik) — 8 jam
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

// Status absensi yang valid
const VALID_STATUS = ["Hadir", "Terlambat", "Tidak Hadir", "Kosong"];

// Hari valid
const VALID_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

// Batas jam per hari
const MAX_JAM = {
  "Senin":  9,
  "Selasa": 9,
  "Rabu":   9,
  "Kamis":  9,
  "Jumat":  6
};

// Akun admin default (seed)
const DEFAULT_ADMIN = {
  nama:     "Administrator",
  email:    "admin@maswh.id",
  password: "admin123"
};

// Data kelas default (seed) — 16 kelas
const DEFAULT_KELAS = [
  "X-A", "X-B", "X-C", "X-D",
  "XI-A", "XI-B", "XI-C", "XI-D",
  "XII-A", "XII-B", "XII-C", "XII-D",
  "X-E", "XI-E", "XII-E", "XII-F"
];
