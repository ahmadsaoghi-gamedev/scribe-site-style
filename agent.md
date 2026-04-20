# AGENT.md — Peran & Tanggung Jawab Tim Pengembangan

## Gambaran Umum

Proyek ini dikerjakan dengan pembagian peran yang jelas antara Frontend Developer (via Lovable.dev) dan Backend Developer (Google Apps Script).

---

## Agent 1: Frontend Developer (Lovable.dev / React / Next.js)

### Tanggung Jawab
- Membangun seluruh tampilan UI menggunakan Lovable.dev
- Implementasi routing halaman (Login, Dashboard Admin, Dashboard Petugas, Laporan)
- Manajemen state: data jadwal, form absensi, preview modal
- Integrasi dengan endpoint Google Apps Script (fetch/axios)
- Implementasi export PDF dengan kop surat
- Responsive design (mobile-friendly)

### Input yang Dibutuhkan dari Backend
- URL Google Apps Script Web App (setelah deploy)
- Dokumentasi response format setiap endpoint
- Token format untuk autentikasi

### Output
- Source code React/Next.js siap deploy
- Hosted di Vercel

---

## Agent 2: Backend Developer (Google Apps Script)

### Tanggung Jawab
- Setup Google Sheet dengan struktur yang sudah didefinisikan di `architecture.md`
- Membuat Google Apps Script Web App
- Implementasi semua endpoint (auth, absensi, laporan, manajemen data)
- Implementasi hash password (SHA-256)
- Validasi role & token di setiap request
- Setup CORS agar bisa diakses dari domain frontend Vercel
- Seed data awal: 16 kelas, akun admin

### Input yang Dibutuhkan dari Frontend
- Format data yang dikirim di setiap form (request payload)
- Halaman mana saja yang butuh endpoint baru

### Output
- Google Apps Script Web App URL (endpoint publik)
- Google Sheet yang sudah berisi struktur dan data awal

---

## Agent 3: Project Manager / Software Architect (Kamu)

### Tanggung Jawab
- Koordinasi antara Frontend dan Backend Developer
- Memastikan kontrak API (request/response format) disepakati sebelum coding
- Review hasil kerja kedua developer
- Komunikasi dengan klien
- Serah terima ke klien

---

## Alur Koordinasi

```
[Architect]
    |
    ├──> [Backend Dev] Setup Sheet + Apps Script
    |         |
    |         └──> Kirim: Apps Script URL + API Docs
    |
    └──> [Frontend Dev] Build UI di Lovable.dev
              |
              └──> Integrasi dengan URL dari Backend Dev
                        |
                        └──> Testing bersama → Deploy → Serah terima
```

---

## Titik Integrasi Kritis

| Halaman Frontend | Endpoint Backend | Prioritas |
|-----------------|-----------------|-----------|
| Login | `?action=login` | 🔴 High |
| Dashboard Petugas — Jadwal Hari Ini | `?action=getJadwalHari` | 🔴 High |
| Form Absensi — Submit | `?action=submitAbsensi` | 🔴 High |
| Dashboard Admin — Data Guru | `?action=getGuru` | 🟡 Medium |
| Dashboard Admin — Jadwal | `?action=getJadwal` | 🟡 Medium |
| Laporan Harian/Mingguan/Bulanan | `?action=laporan*` | 🟡 Medium |
| Manajemen Akun Petugas | `?action=getPetugas` dll | 🟢 Low |
