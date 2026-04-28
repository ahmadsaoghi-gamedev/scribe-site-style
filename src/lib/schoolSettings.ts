export type SchoolSettings = {
  kepalaSekolah: {
    nama: string;
    nip: string;
    jabatan: string;
  };
  operatorNip: string;
};

const KEY = "school_settings";

const DEFAULTS: SchoolSettings = {
  kepalaSekolah: {
    nama: "",
    nip: "",
    jabatan: "Kepala Madrasah",
  },
  operatorNip: "",
};

export function getSchoolSettings(): SchoolSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as SchoolSettings;
  } catch { /* ignore */ }
  return DEFAULTS;
}

export function saveSchoolSettings(s: SchoolSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
