import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Header standar tiap halaman leader/panitia. Satu markup dipakai ulang di
 * SEMUA halaman (bukan ditulis manual per halaman) supaya lonceng notifikasi
 * PASTI sebaris dengan judul (`h1`) DAN posisinya konsisten di semua halaman
 * sekaligus -- 2 requirement yang sebelumnya (Revisi 5 & 6, lihat HANDOVER.md)
 * kelihatannya kontradiktif karena tiap halaman punya struktur header
 * berbeda-beda (ada yang punya `PageNav`, ada yang tidak; ada yang punya
 * `LogoutButton`, ada yang tidak) -- padahal sebenarnya cukup satu komponen
 * bersama dengan slot `bell` yang WAJIB diisi, ditaruh di kanan judul.
 */
export function PageHeader({
  nav,
  title,
  titleClassName,
  description,
  bell,
  actions,
}: {
  nav?: ReactNode;
  title: ReactNode;
  titleClassName?: string;
  description?: ReactNode;
  bell: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        {nav}
        <h1 className={cn("text-xl font-semibold", nav && "mt-1", titleClassName)}>{title}</h1>
        {description}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {bell}
        {actions}
      </div>
    </div>
  );
}
