import { SCHOOL } from "@/lib/auth";

export function KopSurat({ periode }: { periode: string }) {
  return (
    <div className="kop-surat hidden print:block mb-6">
      <div className="flex items-center gap-4 pb-3 border-b-4 border-double border-black">
        <img src={SCHOOL.logo} alt="Logo" className="h-20 w-20 object-cover" crossOrigin="anonymous" />
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold uppercase">{SCHOOL.name}</h1>
          <p className="text-sm">{SCHOOL.address}</p>
        </div>
      </div>
      <div className="text-center mt-4 mb-4">
        <h2 className="text-base font-bold uppercase underline">Laporan Kehadiran Guru</h2>
        <p className="text-sm mt-1">Periode: {periode}</p>
      </div>
    </div>
  );
}
