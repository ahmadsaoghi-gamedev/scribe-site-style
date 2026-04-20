# LOVABLE_PROMPT.md — Prompt untuk Lovable.dev

Gunakan prompt berikut ini di Lovable.dev untuk membangun UI frontend aplikasi absensi.

---

## PROMPT

```
Build a web-based teacher attendance system for an Indonesian Islamic high school (Madrasah Aliyah) called "MAS Wahid Hasyim Balung Jember". The app is built with Next.js / React and Tailwind CSS.

---

## SCHOOL INFO
- Name: MAS WAHID HASYIM BALUNG JEMBER
- Address: Jalan Puger No. 20 Balung
- Logo URL: https://i.imgur.com/HSaZx8r.jpeg

---

## COLOR SCHEME
- Primary: Green (#16a34a) — Islamic school theme
- Secondary: White (#ffffff)
- Accent: Light green (#dcfce7)
- Text: Gray-800
- Use clean, modern design with rounded cards and subtle shadows

---

## ROLES
Two roles: `admin` and `petugas` (class attendance officer/student representative).
After login, redirect based on role stored in localStorage.

---

## PAGES & COMPONENTS

### 1. /login
- Logo centered at top
- School name and address below logo
- Email + Password input fields
- Login button
- Show error toast on failed login
- On success: save token and role to localStorage, redirect to /dashboard or /admin

// [BACKEND DEV: Connect to Apps Script endpoint ?action=login via POST]
// Expected request body: { email, password }
// Expected response: { success: true, token, role, nama, kelas_id }

---

### 2. /dashboard (Petugas View)
- Header: school logo + name + today's date
- Show class name of logged-in petugas
- Check if attendance has already been submitted today (show readonly view if yes)
- Show a list of today's schedule grouped by jam (lesson period), each item shows:
  - Jam ke-X
  - Teacher name (Nama Guru)
  - Subject (Mata Pelajaran)
  - Status dropdown: Hadir / Terlambat / Tidak Hadir / Kosong
- "Preview" button at bottom — opens a modal showing summary table before submit
- Preview Modal:
  - Table: Jam | Guru | Mapel | Status
  - "Kembali" button (close modal)
  - "Submit Absensi" button (confirm and save)
- After submit: show success screen with lock icon and message "Absensi hari ini telah tersimpan"

// [BACKEND DEV: GET ?action=getJadwalHari&kelas_id=X&tanggal=YYYY-MM-DD]
// Expected response: { success: true, jadwal: [{ jam_ke, guru_id, nama_guru, mapel, jadwal_id }] }

// [BACKEND DEV: GET ?action=cekAbsensi&kelas_id=X&tanggal=YYYY-MM-DD]
// Expected response: { success: true, sudah_absen: true/false }

// [BACKEND DEV: POST ?action=submitAbsensi]
// Expected request body: { tanggal, kelas_id, petugas_id, data: [{ jadwal_id, guru_id, jam_ke, status }] }
// Expected response: { success: true }

---

### 3. /admin (Admin Dashboard)
Sidebar navigation with links to:
- Dashboard (overview stats)
- Data Guru
- Jadwal
- Akun Petugas
- Laporan

Overview/home shows summary cards:
- Total guru aktif
- Total kelas
- Absensi hari ini (berapa kelas sudah submit)

// [BACKEND DEV: GET ?action=getRekapHariIni]
// Expected response: { total_guru, total_kelas, kelas_sudah_absen }

---

### 4. /admin/guru
- Table: No | Nama Guru | NIP | Mata Pelajaran | Status Aktif | Aksi
- Aksi: Edit | Hapus (nonaktifkan)
- Button: "+ Tambah Guru" — opens a modal form
- Modal form fields: Nama, NIP, Mata Pelajaran, Status Aktif (toggle)

// [BACKEND DEV: GET ?action=getGuru → response: { data: [{ id, nama, nip, mapel, aktif }] }]
// [BACKEND DEV: POST ?action=addGuru → body: { nama, nip, mapel }]
// [BACKEND DEV: POST ?action=editGuru → body: { id, nama, nip, mapel, aktif }]
// [BACKEND DEV: POST ?action=deleteGuru → body: { id }]

---

### 5. /admin/jadwal
- Dropdown to select a kelas (class)
- Grid/table: rows = Jam Ke-1 to 9, columns = Senin/Selasa/Rabu/Kamis/Jumat
- Each cell shows: Guru name + Mapel, with Edit button
- Friday column max 6 rows (6 JP only)
- Click Edit on a cell: opens modal to select Guru (dropdown) and input Mapel

// [BACKEND DEV: GET ?action=getJadwal&kelas_id=X → response: { data: [{ id, hari, jam_ke, guru_id, nama_guru, mapel }] }]
// [BACKEND DEV: POST ?action=setJadwal → body: { kelas_id, hari, jam_ke, guru_id, mapel }]

---

### 6. /admin/petugas
- Table: No | Nama | Email | Kelas | Status Aktif | Aksi
- Aksi: Edit | Reset Password | Hapus
- Button: "+ Tambah Petugas" — opens modal form
- Modal form fields: Nama, Email, Password, Pilih Kelas (dropdown)

// [BACKEND DEV: GET ?action=getPetugas → response: { data: [{ id, nama, email, kelas_id, nama_kelas, aktif }] }]
// [BACKEND DEV: POST ?action=addPetugas → body: { nama, email, password, kelas_id }]
// [BACKEND DEV: POST ?action=editPetugas → body: { id, nama, email, kelas_id, aktif }]
// [BACKEND DEV: POST ?action=deletePetugas → body: { id }]
// [BACKEND DEV: POST ?action=resetPassword → body: { id, new_password }]

---

### 7. /admin/laporan
- Tab bar: Harian | Mingguan | Bulanan
- Harian: date picker, show table
- Mingguan: date range picker (from–to), show table
- Bulanan: month + year picker, show table
- Table columns: No | Nama Guru | [Jam 1...9] per day or totals | Hadir | Terlambat | Tidak Hadir | Kosong
- "Export PDF" button — triggers print with KopSurat visible
- KopSurat component (shown only in print):
  - Logo on left
  - School name bold + address center/right
  - Horizontal divider line
  - Title: "LAPORAN KEHADIRAN GURU"
  - Period line: "Periode: [date range]"

// [BACKEND DEV: GET ?action=laporanHarian&tanggal=YYYY-MM-DD]
// [BACKEND DEV: GET ?action=laporanMingguan&dari=YYYY-MM-DD&sampai=YYYY-MM-DD]
// [BACKEND DEV: GET ?action=laporanBulanan&bulan=MM&tahun=YYYY]
// Expected response format: { data: [{ nama_guru, detail per jam/hari, total_hadir, total_terlambat, total_tidak_hadir, total_kosong }] }

---

## GLOBAL COMPONENTS
- Toast notifications (success = green, error = red)
- Loading spinner on async actions
- 404 page
- Logout button (clears localStorage, redirect to /login)
- Mobile-responsive layout — petugas likely use mobile phones

---

## IMPORTANT NOTES
- All API calls go to a single Google Apps Script Web App URL stored in environment variable: NEXT_PUBLIC_APPS_SCRIPT_URL
- Every API call must include the user token in the request body or as a query param: token=xxx
- Do NOT implement any backend logic — all backend code will be written in Google Apps Script
- Leave clear comments everywhere a backend endpoint is consumed so backend developers know exactly where to plug in their Apps Script URL and expected data format
- Use placeholder/mock data initially so UI can be reviewed before backend is ready
```
