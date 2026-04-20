import { SCHOOL } from "@/lib/auth";

export function SchoolHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <img src={SCHOOL.logo} alt="Logo MAS Wahid Hasyim" className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20" />
      <div className="min-w-0">
        <h1 className="text-sm font-bold leading-tight text-primary truncate">{SCHOOL.name}</h1>
        <p className="text-xs text-muted-foreground truncate">{subtitle || SCHOOL.address}</p>
      </div>
    </div>
  );
}
