export type Session = {
  token: string;
  role: "admin" | "petugas";
  nama: string;
  kelas_id?: string;
  kelas_ids?: string[];
  nama_kelas?: string;
};

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") as "admin" | "petugas" | null;
  const nama = localStorage.getItem("nama");
  const kelas_id = localStorage.getItem("kelas_id") || undefined;
  const kelas_ids = kelas_id ? kelas_id.split(",").map((id) => id.trim()) : [];
  const nama_kelas = localStorage.getItem("nama_kelas") || undefined;
  if (!token || !role || !nama) return null;
  return { token, role, nama, kelas_id, kelas_ids, nama_kelas };
}

export function setSession(s: Session) {
  localStorage.setItem("token", s.token);
  localStorage.setItem("role", s.role);
  localStorage.setItem("nama", s.nama);
  if (s.kelas_ids && s.kelas_ids.length > 0) {
    localStorage.setItem("kelas_id", s.kelas_ids.join(","));
  } else if (s.kelas_id) {
    localStorage.setItem("kelas_id", s.kelas_id);
  }
  if (s.nama_kelas) localStorage.setItem("nama_kelas", s.nama_kelas);
}

export function clearSession() {
  ["token", "role", "nama", "kelas_id", "nama_kelas"].forEach((k) => localStorage.removeItem(k));
}

export const SCHOOL = {
  name: "MAS WAHID HASYIM BALUNG JEMBER",
  address: "Jalan Puger No. 20 Balung",
  logo: "https://i.imgur.com/HSaZx8r.jpeg",
};
