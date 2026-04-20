# ARCHITECTURE.md — Arsitektur Sistem Web Absensi Guru

## Gambaran Umum

```
[Browser / User]
      |
      v
[Frontend - Next.js / React] ←→ [Google Apps Script Web App]
                                          |
                                          v
                                  [Google Sheets - Database]
```

---

## Struktur Google Sheets (Database)

### Sheet 1: `users`
Menyimpan akun login admin dan petugas.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | string | UUID unik |
| nama | string | Nama lengkap |
| email | string | Email login |
| password_hash | string | Password ter-hash (SHA256) |
| role | string | `admin` / `petugas` |
| kelas_id | string | Diisi jika role = petugas |
| aktif | boolean | Status akun |
| created_at | datetime | Waktu dibuat |

---

### Sheet 2: `kelas`
Daftar 16 kelas.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | string | UUID unik |
| nama_kelas | string | Contoh: X-A, XI-IPA-1 |
| wali_kelas | string | Nama wali kelas (opsional) |

---

### Sheet 3: `guru`
Daftar semua guru.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | string | UUID unik |
| nama | string | Nama lengkap guru |
| nip | string | NIP guru |
| mapel | string | Mata pelajaran utama |
| aktif | boolean | Status aktif |

---

### Sheet 4: `jadwal`
Jadwal guru per kelas per jam pelajaran per hari.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | string | UUID unik |
| kelas_id | string | Referensi ke sheet kelas |
| guru_id | string | Referensi ke sheet guru |
| hari | string | Senin / Selasa / ... / Jumat |
| jam_ke | number | 1 - 9 (Jumat max 6) |
| mapel | string | Nama mata pelajaran sesi ini |

---

### Sheet 5: `absensi`
Log kehadiran guru per jam per kelas.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | string | UUID unik |
| tanggal | date | Tanggal absensi |
| kelas_id | string | Referensi ke sheet kelas |
| guru_id | string | Referensi ke sheet guru |
| jadwal_id | string | Referensi ke sheet jadwal |
| jam_ke | number | Jam pelajaran ke-berapa |
| status | string | `Hadir` / `Terlambat` / `Tidak Hadir` / `Kosong` |
| petugas_id | string | User yang input absen |
| submitted_at | datetime | Waktu submit |

---

## Google Apps Script — API Endpoints

Semua endpoint berupa Google Apps Script Web App dengan method `GET` dan `POST`.

### Auth
| Method | Action | Keterangan |
|--------|--------|------------|
| POST | `?action=login` | Autentikasi user, return token sesi |
| POST | `?action=logout` | Hapus sesi |

### Admin — Data Master
| Method | Action | Keterangan |
|--------|--------|------------|
| GET | `?action=getGuru` | Ambil semua data guru |
| POST | `?action=addGuru` | Tambah guru baru |
| POST | `?action=editGuru` | Edit data guru |
| POST | `?action=deleteGuru` | Hapus / nonaktifkan guru |
| GET | `?action=getKelas` | Ambil semua kelas |
| GET | `?action=getJadwal&kelas_id=X` | Ambil jadwal per kelas |
| POST | `?action=setJadwal` | Simpan/update jadwal |

### Admin — Manajemen Akun Petugas
| Method | Action | Keterangan |
|--------|--------|------------|
| GET | `?action=getPetugas` | Ambil semua akun petugas |
| POST | `?action=addPetugas` | Buat akun petugas baru |
| POST | `?action=editPetugas` | Edit akun petugas |
| POST | `?action=deletePetugas` | Hapus/nonaktifkan petugas |
| POST | `?action=resetPassword` | Reset password petugas |

### Absensi
| Method | Action | Keterangan |
|--------|--------|------------|
| GET | `?action=getJadwalHari&kelas_id=X&tanggal=Y` | Ambil jadwal hari ini untuk preview |
| POST | `?action=submitAbsensi` | Submit data absensi (setelah preview) |
| GET | `?action=cekAbsensi&kelas_id=X&tanggal=Y` | Cek apakah sudah diisi |

### Laporan
| Method | Action | Keterangan |
|--------|--------|------------|
| GET | `?action=laporanHarian&tanggal=Y` | Rekap semua kelas 1 hari |
| GET | `?action=laporanMingguan&dari=X&sampai=Y` | Rekap mingguan |
| GET | `?action=laporanBulanan&bulan=X&tahun=Y` | Rekap bulanan |

---

## Autentikasi & Sesi

- Menggunakan **token berbasis timestamp + hash** yang disimpan di `localStorage` frontend
- Setiap request ke Apps Script menyertakan token di header / query param
- Apps Script memvalidasi token dari sheet `users`
- Sesi expired setelah 8 jam (1 hari sekolah)

---

## Kop Surat Laporan PDF

```
+-------------------------------------------------------+
| [LOGO]   MAS WAHID HASYIM BALUNG JEMBER               |
|          Jalan Puger No. 20 Balung                    |
|          -------------------------------------------- |
|          LAPORAN KEHADIRAN GURU                       |
|          Periode: [tanggal/minggu/bulan]              |
+-------------------------------------------------------+
```

- Logo dari: https://i.imgur.com/HSaZx8r.jpeg
- Export menggunakan `window.print()` dengan CSS `@media print` atau library `jsPDF`

---

## Keamanan

- Password di-hash sebelum disimpan ke Sheet (SHA-256 via Apps Script)
- Validasi role di setiap request Apps Script
- Petugas hanya bisa akses data kelas miliknya sendiri
- Absensi tidak bisa diubah setelah submit (immutable log)
