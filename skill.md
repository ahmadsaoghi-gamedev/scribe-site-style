# SKILL.md — Skill & Teknologi yang Dibutuhkan

## Frontend (Lovable.dev / React / Next.js)

### Wajib Dikuasai
| Skill | Keterangan |
|-------|------------|
| React / Next.js | Framework utama UI |
| Tailwind CSS | Styling komponen |
| React Hook Form | Manajemen form input absensi |
| Fetch API / Axios | Komunikasi ke Apps Script |
| localStorage | Simpan token sesi |
| jsPDF / Print CSS | Export laporan ke PDF |
| React Router / Next.js Routing | Navigasi antar halaman |
| Conditional Rendering | Tampilkan UI berdasarkan role |

### Komponen UI yang Perlu Dibangun
- `LoginForm` — Form login dengan validasi
- `DashboardAdmin` — Sidebar + konten admin
- `DashboardPetugas` — Tampilan jadwal + form absen
- `AbsensiForm` — Form input status per guru per jam (dengan preview modal)
- `PreviewModal` — Konfirmasi sebelum submit
- `LaporanTable` — Tabel rekap kehadiran
- `ExportButton` — Tombol export PDF
- `KopSurat` — Header laporan PDF (logo + nama sekolah)
- `ManajemenGuru` — CRUD data guru (admin only)
- `ManajemenJadwal` — Set jadwal per kelas (admin only)
- `ManajemenPetugas` — Kelola akun petugas (admin only)

---

## Backend (Google Apps Script)

### Wajib Dikuasai
| Skill | Keterangan |
|-------|------------|
| Google Apps Script | Runtime backend |
| SpreadsheetApp API | Baca/tulis Google Sheet |
| doGet / doPost | Handler HTTP request |
| ContentService | Return JSON response |
| SHA-256 Utilities | Hash password |
| UUID Generator | Generate ID unik |
| CORS Headers | Izinkan akses dari Vercel |
| Token Validation | Validasi sesi user |

### Pola Kode Apps Script

```javascript
// Contoh handler utama
function doPost(e) {
  const action = e.parameter.action;
  const body = JSON.parse(e.postData.contents);
  
  switch (action) {
    case 'login': return handleLogin(body);
    case 'submitAbsensi': return handleSubmitAbsensi(body);
    // ... dst
  }
}

function doGet(e) {
  const action = e.parameter.action;
  
  switch (action) {
    case 'getJadwalHari': return handleGetJadwalHari(e.parameter);
    case 'laporanHarian': return handleLaporanHarian(e.parameter);
    // ... dst
  }
}

// Selalu return JSON
function response(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## DevOps / Deployment

| Skill | Keterangan |
|-------|------------|
| Vercel | Deploy frontend Next.js |
| Google Apps Script Deploy | Publish sebagai Web App (Anyone) |
| Environment Variables | Simpan Apps Script URL di `.env` Vercel |
| GitHub | Version control source code frontend |

---

## Desain & UX

| Aspek | Panduan |
|-------|---------|
| Warna utama | Hijau/tosca (khas madrasah, bisa disesuaikan klien) |
| Font | Inter / Poppins |
| Mobile first | Petugas kemungkinan akses via HP |
| Feedback UI | Loading state, toast notifikasi sukses/error |
| Kop surat PDF | Logo + Nama Sekolah + Alamat + Garis pembatas |
