export type Session = {
  token: string;
  role: "admin" | "petugas";
  nama: string;
  kelas_id?: string;
};

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") as "admin" | "petugas" | null;
  const nama = localStorage.getItem("nama");
  const kelas_id = localStorage.getItem("kelas_id") || undefined;
  if (!token || !role || !nama) return null;
  return { token, role, nama, kelas_id };
}

export function setSession(s: Session) {
  localStorage.setItem("token", s.token);
  localStorage.setItem("role", s.role);
  localStorage.setItem("nama", s.nama);
  if (s.kelas_id) localStorage.setItem("kelas_id", s.kelas_id);
}

export function clearSession() {
  ["token", "role", "nama", "kelas_id"].forEach((k) => localStorage.removeItem(k));
}

export const SCHOOL = {
  name: "MAS WAHID HASYIM BALUNG JEMBER",
  address: "Jalan Puger No. 20 Balung",
  logo: "https://i.imgur.com/HSaZx8r.jpeg",
};
