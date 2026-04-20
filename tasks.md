# TASKS.md — Breakdown Tugas Pengembangan

## 🗂️ FASE 1 — Setup Database & Backend (Google Apps Script)

### [BACKEND] Setup Google Sheet

- [ ] **TASK-001** Buat Google Sheet baru, rename menjadi `AbsensiGuru_MAS_WahidHasyim`
- [ ] **TASK-002** Buat sheet `users` dengan kolom: id, nama, email, password_hash, role, kelas_id, aktif, created_at
- [ ] **TASK-003** Buat sheet `kelas` dengan kolom: id, nama_kelas — isi 16 kelas
- [ ] **TASK-004** Buat sheet `guru` dengan kolom: id, nama, nip, mapel, aktif
- [ ] **TASK-005** Buat sheet `jadwal` dengan kolom: id, kelas_id, guru_id, hari, jam_ke, mapel
- [ ] **TASK-006** Buat sheet `absensi` dengan kolom: id, tanggal, kelas_id, guru_id, jadwal_id, jam_ke, status, petugas_id, submitted_at
- [ ] **TASK-007** Seed data: 1 akun admin default, 16 kelas

---

### [BACKEND] Google Apps Script

- [ ] **TASK-008** Buat file Apps Script, setup `doGet` dan `doPost` router
- [ ] **TASK-009** Buat helper: `generateUUID()`, `hashPassword()`, `response()`, `validateToken()`
- [ ] **TASK-010** Implementasi `action=login` — validasi email+password, return token
- [ ] **TASK-011** Implementasi `action=logout`
- [ ] **TASK-012** Implementasi `action=getGuru`, `addGuru`, `editGuru`, `deleteGuru`
- [ ] **TASK-013** Implementasi `action=getKelas`
- [ ] **TASK-014** Implementasi `action=getJadwal`, `setJadwal`
- [ ] **TASK-015** Implementasi `action=getPetugas`, `addPetugas`, `editPetugas`, `deletePetugas`, `resetPassword`
- [ ] **TASK-016** Implementasi `action=getJadwalHari` — ambil jadwal hari ini berdasarkan kelas_id + hari
- [ ] **TASK-017** Implementasi `action=cekAbsensi` — cek apakah kelas sudah absen hari ini
- [ ] **TASK-018** Implementasi `action=submitAbsensi` — simpan batch absensi 1 hari
- [ ] **TASK-019** Implementasi `action=laporanHarian`
- [ ] **TASK-020** Implementasi `action=laporanMingguan`
- [ ] **TASK-021** Implementasi `action=laporanBulanan`
- [ ] **TASK-022** Setup CORS headers di semua response
- [ ] **TASK-023** Deploy Apps Script sebagai Web App (Execute as: Me, Who has access: Anyone)
- [ ] **TASK-024** Dokumentasikan Apps Script URL dan kirim ke Frontend Dev

---

## 🎨 FASE 2 — Frontend UI (Lovable.dev / Next.js)

### [FRONTEND] Halaman Auth

- [ ] **TASK-025** Halaman `/login` — form email + password, validasi, panggil endpoint login
- [ ] **TASK-026** Simpan token + role ke localStorage setelah login berhasil
- [ ] **TASK-027** Guard route: redirect ke login jika token tidak ada / expired
- [ ] **TASK-028** Redirect ke dashboard sesuai role setelah login

---

### [FRONTEND] Dashboard Petugas

- [ ] **TASK-029** Tampilkan nama kelas dan tanggal hari ini
- [ ] **TASK-030** Cek apakah absensi hari ini sudah disubmit (`cekAbsensi`)
- [ ] **TASK-031** Tampilkan jadwal guru hari ini per jam pelajaran (`getJadwalHari`)
- [ ] **TASK-032** Form absensi: untuk tiap jam, tampilkan nama guru + mapel + dropdown status (Hadir/Terlambat/Tidak Hadir/Kosong)
- [ ] **TASK-033** Tombol "Preview" — tampilkan modal ringkasan sebelum submit
- [ ] **TASK-034** Modal preview: tampilkan tabel semua jam + status yang dipilih, tombol "Kembali" dan "Submit"
- [ ] **TASK-035** Submit absensi ke endpoint `submitAbsensi`
- [ ] **TASK-036** Setelah submit: tampilkan halaman sukses / status readonly hari ini

---

### [FRONTEND] Dashboard Admin — Data Master

- [ ] **TASK-037** Halaman `/admin/guru` — tabel daftar guru, tombol tambah/edit/hapus
- [ ] **TASK-038** Form tambah/edit guru (modal atau halaman baru)
- [ ] **TASK-039** Halaman `/admin/kelas` — tabel 16 kelas
- [ ] **TASK-040** Halaman `/admin/jadwal` — pilih kelas, tampilkan grid jadwal per hari per jam, bisa set guru + mapel
- [ ] **TASK-041** Halaman `/admin/petugas` — tabel akun petugas, tambah/edit/hapus/reset password

---

### [FRONTEND] Dashboard Admin — Laporan

- [ ] **TASK-042** Halaman `/admin/laporan` — pilih tipe laporan (Harian/Mingguan/Bulanan)
- [ ] **TASK-043** Filter: pilih tanggal / rentang tanggal / bulan+tahun
- [ ] **TASK-044** Tabel rekap kehadiran: kolom guru, per-jam, per-kelas, jumlah hadir/terlambat/tidak hadir/kosong
- [ ] **TASK-045** Komponen `KopSurat`: logo MAS Wahid Hasyim + nama sekolah + alamat + garis pembatas
- [ ] **TASK-046** Tombol "Export PDF" — cetak halaman laporan dengan kop surat via `window.print()` atau jsPDF
- [ ] **TASK-047** CSS `@media print`: sembunyikan navigasi, tampilkan kop surat

---

### [FRONTEND] Umum / Global

- [ ] **TASK-048** Komponen Navbar/Sidebar sesuai role
- [ ] **TASK-049** Komponen Loading spinner / skeleton
- [ ] **TASK-050** Toast notifikasi (sukses / error)
- [ ] **TASK-051** Halaman 404 dan error fallback
- [ ] **TASK-052** Responsive design — mobile friendly untuk petugas

---

## 🔗 FASE 3 — Integrasi & Testing

- [ ] **TASK-053** Integrasi login frontend ↔ backend
- [ ] **TASK-054** Integrasi jadwal + absensi petugas
- [ ] **TASK-055** Integrasi CRUD admin (guru, jadwal, petugas)
- [ ] **TASK-056** Integrasi laporan + export PDF
- [ ] **TASK-057** Testing login dengan akun admin dan petugas (16 kelas)
- [ ] **TASK-058** Testing submit absensi + preview modal
- [ ] **TASK-059** Testing laporan harian, mingguan, bulanan
- [ ] **TASK-060** Testing export PDF + cek kop surat tampil benar
- [ ] **TASK-061** Testing edge case: Jumat hanya 6 JP, kelas yang belum diisi, dll

---

## 🚀 FASE 4 — Deploy & Serah Terima

- [ ] **TASK-062** Deploy frontend ke Vercel, set environment variable Apps Script URL
- [ ] **TASK-063** Setup domain custom jika diminta klien
- [ ] **TASK-064** Buat 16 akun petugas (1 per kelas) dari dashboard admin
- [ ] **TASK-065** Input data guru dan jadwal awal bersama klien
- [ ] **TASK-066** Buat panduan penggunaan singkat untuk petugas dan admin
- [ ] **TASK-067** Serah terima ke klien + demo penggunaan
