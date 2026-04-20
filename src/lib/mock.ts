// Mock backend for UI preview. Replace with real Apps Script when ready.

const KELAS = [
  "X-A", "X-B", "X-IPA-1", "X-IPA-2", "X-IPS-1", "X-IPS-2",
  "XI-IPA-1", "XI-IPA-2", "XI-IPS-1", "XI-IPS-2", "XI-AGAMA",
  "XII-IPA-1", "XII-IPA-2", "XII-IPS-1", "XII-IPS-2", "XII-AGAMA",
].map((n, i) => ({ id: `k${i + 1}`, nama_kelas: n, wali_kelas: "" }));

const GURU = [
  { id: "g1", nama: "Drs. H. Ahmad Fauzi, M.Pd", nip: "196801012000031001", mapel: "Bahasa Arab", aktif: true },
  { id: "g2", nama: "Hj. Siti Aminah, S.Pd", nip: "197203152005012003", mapel: "Bahasa Indonesia", aktif: true },
  { id: "g3", nama: "Muhammad Yusuf, S.Pd", nip: "198005102009011004", mapel: "Matematika", aktif: true },
  { id: "g4", nama: "Nur Hidayah, S.Pd.I", nip: "198512202010012005", mapel: "Fiqih", aktif: true },
  { id: "g5", nama: "Abdul Rahman, M.Pd", nip: "197811052003121002", mapel: "Aqidah Akhlak", aktif: true },
  { id: "g6", nama: "Fatimah Az-Zahra, S.Pd", nip: "199001152015042006", mapel: "Bahasa Inggris", aktif: true },
  { id: "g7", nama: "Imam Subakti, S.Pd", nip: "198303202008011007", mapel: "Fisika", aktif: true },
  { id: "g8", nama: "Khadijah, S.Pd", nip: "198706112011012008", mapel: "Kimia", aktif: true },
];

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

let PETUGAS = [
  { id: "p1", nama: "Ahmad Siswa X-A", email: "petugas.xa@mas-wahidhasyim.sch.id", kelas_id: "k1", nama_kelas: "X-A", aktif: true },
  { id: "p2", nama: "Aisyah Siswa XI-IPA-1", email: "petugas.xi1@mas-wahidhasyim.sch.id", kelas_id: "k7", nama_kelas: "XI-IPA-1", aktif: true },
];

const USERS = [
  { email: "admin@mas-wahidhasyim.sch.id", password: "admin123", role: "admin", nama: "Administrator", kelas_id: "" },
  { email: "petugas@mas-wahidhasyim.sch.id", password: "petugas123", role: "petugas", nama: "Ahmad Siswa X-A", kelas_id: "k1" },
];

// jadwal[kelas_id][hari][jam_ke] = { guru_id, mapel }
const JADWAL: Record<string, Record<string, Record<number, { guru_id: string; mapel: string; jadwal_id: string }>>> = {};
KELAS.forEach((k) => {
  JADWAL[k.id] = {};
  ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].forEach((h) => {
    JADWAL[k.id][h] = {};
    const max = h === "Jumat" ? 6 : 9;
    for (let j = 1; j <= max; j++) {
      const g = GURU[(j + h.length) % GURU.length];
      JADWAL[k.id][h][j] = { guru_id: g.id, mapel: g.mapel, jadwal_id: `${k.id}-${h}-${j}` };
    }
  });
});

const ABSENSI: Record<string, any[]> = {}; // key = `${kelas_id}_${tanggal}`

function ok(data: any) { return { success: true, ...data }; }

export async function mockHandler(action: string, _method: string, body: any) {
  await new Promise((r) => setTimeout(r, 250));

  switch (action) {
    case "login": {
      const u = USERS.find((x) => x.email === body.email && x.password === body.password);
      if (!u) return { success: false, message: "Email atau password salah" };
      return ok({ token: `mock-${Date.now()}`, role: u.role, nama: u.nama, kelas_id: u.kelas_id });
    }
    case "getKelas":
      return ok({ data: KELAS });
    case "getGuru":
      return ok({ data: GURU });
    case "addGuru":
      GURU.push({ id: `g${GURU.length + 1}`, ...body, aktif: true });
      return ok({});
    case "editGuru": {
      const i = GURU.findIndex((g) => g.id === body.id);
      if (i >= 0) GURU[i] = { ...GURU[i], ...body };
      return ok({});
    }
    case "deleteGuru": {
      const i = GURU.findIndex((g) => g.id === body.id);
      if (i >= 0) GURU[i].aktif = false;
      return ok({});
    }
    case "getPetugas":
      return ok({ data: PETUGAS });
    case "addPetugas": {
      const k = KELAS.find((x) => x.id === body.kelas_id);
      PETUGAS.push({ id: `p${PETUGAS.length + 1}`, nama: body.nama, email: body.email, kelas_id: body.kelas_id, nama_kelas: k?.nama_kelas || "", aktif: true });
      return ok({});
    }
    case "editPetugas": {
      const i = PETUGAS.findIndex((p) => p.id === body.id);
      if (i >= 0) {
        const k = KELAS.find((x) => x.id === body.kelas_id);
        PETUGAS[i] = { ...PETUGAS[i], ...body, nama_kelas: k?.nama_kelas || PETUGAS[i].nama_kelas };
      }
      return ok({});
    }
    case "deletePetugas":
      PETUGAS = PETUGAS.filter((p) => p.id !== body.id);
      return ok({});
    case "resetPassword":
      return ok({});
    case "getJadwal": {
      const data: any[] = [];
      const k = JADWAL[body.kelas_id] || {};
      Object.entries(k).forEach(([hari, jams]) => {
        Object.entries(jams).forEach(([jam_ke, v]) => {
          const g = GURU.find((x) => x.id === v.guru_id);
          data.push({ id: v.jadwal_id, hari, jam_ke: Number(jam_ke), guru_id: v.guru_id, nama_guru: g?.nama || "-", mapel: v.mapel });
        });
      });
      return ok({ data });
    }
    case "setJadwal": {
      JADWAL[body.kelas_id] = JADWAL[body.kelas_id] || {};
      JADWAL[body.kelas_id][body.hari] = JADWAL[body.kelas_id][body.hari] || {};
      JADWAL[body.kelas_id][body.hari][body.jam_ke] = {
        guru_id: body.guru_id,
        mapel: body.mapel,
        jadwal_id: `${body.kelas_id}-${body.hari}-${body.jam_ke}`,
      };
      return ok({});
    }
    case "getJadwalHari": {
      const d = new Date(body.tanggal);
      const hari = HARI[d.getDay()];
      const k = JADWAL[body.kelas_id]?.[hari] || {};
      const jadwal = Object.entries(k).map(([jam_ke, v]) => {
        const g = GURU.find((x) => x.id === v.guru_id);
        return { jam_ke: Number(jam_ke), guru_id: v.guru_id, nama_guru: g?.nama || "-", mapel: v.mapel, jadwal_id: v.jadwal_id };
      }).sort((a, b) => a.jam_ke - b.jam_ke);
      return ok({ jadwal, hari });
    }
    case "cekAbsensi": {
      const key = `${body.kelas_id}_${body.tanggal}`;
      return ok({ sudah_absen: !!ABSENSI[key] });
    }
    case "submitAbsensi": {
      const key = `${body.kelas_id}_${body.tanggal}`;
      ABSENSI[key] = body.data;
      return ok({});
    }
    case "getRekapHariIni": {
      const today = new Date().toISOString().slice(0, 10);
      const sudah = Object.keys(ABSENSI).filter((k) => k.endsWith(today)).length;
      return ok({ total_guru: GURU.filter((g) => g.aktif).length, total_kelas: KELAS.length, kelas_sudah_absen: sudah });
    }
    case "laporanHarian":
    case "laporanMingguan":
    case "laporanBulanan": {
      const data = GURU.filter((g) => g.aktif).map((g) => ({
        nama_guru: g.nama,
        mapel: g.mapel,
        total_hadir: Math.floor(Math.random() * 20) + 10,
        total_terlambat: Math.floor(Math.random() * 5),
        total_tidak_hadir: Math.floor(Math.random() * 3),
        total_kosong: Math.floor(Math.random() * 2),
      }));
      return ok({ data });
    }
    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}
