import { ImagePlus } from "lucide-react";

/**
 * Slot foto/logo kepanitiaan. Untuk sekarang masih PLACEHOLDER visual saja --
 * upload sungguhan butuh bucket Supabase Storage (dikonfigurasi manual di
 * Dashboard) plus kolom `logo_url` di tabel kepanitiaan, dan Storage baru
 * disiapkan di Fase 5 (Download/Submit Template Budgeting). Slot-nya dibuat
 * duluan supaya layout barisnya sudah final dan tidak perlu digeser lagi
 * nanti; tinggal ganti isi div ini dengan <img src={logoUrl}> + form upload
 * begitu Storage-nya ada.
 */
export function LogoPlaceholder({ nama }: { nama: string }) {
  return (
    <div
      className="flex size-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border-2 border-dashed text-muted-foreground"
      title={`Logo untuk "${nama}" — upload tersedia setelah Supabase Storage disiapkan (Fase 5). Format: PNG / JPG / JPEG.`}
      aria-label={`Slot logo kepanitiaan ${nama}, belum tersedia`}
    >
      <ImagePlus className="size-5" />
      <span className="text-[9px] leading-none">PNG/JPG</span>
    </div>
  );
}
