# PLAN.md — Web Absensi Guru MAS Wahid Hasyim Balung Jember

## Ringkasan Proyek

Aplikasi web absensi kehadiran guru berbasis peran (role-based) untuk MAS Wahid Hasyim Balung Jember. Setiap kelas memiliki petugas absen (perwakilan siswa) yang mencatat kehadiran guru per jam pelajaran. Admin memiliki akses penuh termasuk manajemen akun, data guru, jadwal, dan laporan.

---

## Informasi Sekolah

- **Nama Sekolah:** MAS Wahid Hasyim Balung Jember
- **Alamat:** Jalan Puger No. 20 Balung
- **Logo:** https://i.imgur.com/HSaZx8r.jpeg

---

## Tujuan

- Memudahkan pencatatan kehadiran guru per jam pelajaran di setiap kelas
- Memberikan laporan kehadiran harian, mingguan, dan bulanan
- Menggantikan pencatatan manual dengan sistem digital berbasis web
- Data tersimpan di Google Sheet sebagai database

---

## Ruang Lingkup (Scope)

### Dalam Scope
- Login sistem dengan 2 role: Admin & Petugas
- Manajemen data guru oleh Admin
- Manajemen jadwal pelajaran per kelas oleh Admin
- Input absensi guru per jam pelajaran oleh Petugas
- Preview sebelum submit (tidak bisa edit setelah tersimpan)
- 4 status absensi: Hadir, Terlambat, Tidak Hadir, Kosong
- Laporan harian, mingguan, bulanan
- Export laporan ke PDF (dengan kop surat)
- Database: Google Sheet via Google Apps Script

### Di Luar Scope
- Absensi siswa
- Notifikasi real-time / push notification
- Fitur chat / komunikasi
- Aplikasi mobile native

---

## Jadwal KBM

| Hari | Jumlah Jam Pelajaran |
|------|---------------------|
| Senin - Kamis | 9 JP |
| Jumat | 6 JP |
| Sabtu | 9 JP (konfirmasi bila perlu) |

---

## Role & Hak Akses

| Fitur | Admin | Petugas |
|-------|-------|---------|
| Login | ✅ | ✅ |
| Kelola akun petugas | ✅ | ❌ |
| Kelola data guru | ✅ | ❌ |
| Kelola jadwal | ✅ | ❌ |
| Input absensi | ✅ | ✅ (kelas sendiri) |
| Lihat rekap semua kelas | ✅ | ❌ |
| Export laporan PDF | ✅ | ❌ |

---

## Status Absensi

| Status | Keterangan |
|--------|------------|
| **Hadir** | Guru hadir tepat waktu |
| **Terlambat** | Guru hadir namun terlambat |
| **Tidak Hadir** | Guru tidak hadir, memberi tugas |
| **Kosong** | Guru tidak hadir, tidak ada tugas |

---

## Stack Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Next.js / React (via Lovable.dev) |
| Backend / API | Google Apps Script (Web App) |
| Database | Google Sheets |
| Export PDF | jsPDF / Print CSS dengan kop surat |
| Hosting Frontend | Vercel (direkomendasikan) |

---

## Alur Pengembangan

1. **Fase 1 — Setup Database**
   - Buat struktur Google Sheet
   - Setup Google Apps Script sebagai REST API

2. **Fase 2 — Backend API**
   - Endpoint autentikasi
   - Endpoint absensi (GET/POST)
   - Endpoint laporan

3. **Fase 3 — Frontend UI**
   - Build UI di Lovable.dev
   - Integrasi dengan Apps Script endpoint

4. **Fase 4 — Testing & Deploy**
   - Testing semua role
   - Deploy frontend ke Vercel
   - Serahkan ke klien
