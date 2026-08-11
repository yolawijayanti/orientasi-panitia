"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, House } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Navigasi kecil di pojok kiri atas tiap halaman dalam: "Kembali" (history
 * browser, jadi benar-benar halaman sebelumnya -- bukan parent route yang
 * ditebak) + "Home" (dashboard sesuai role, dioper lewat prop karena
 * komponen ini client-side dan tidak bisa query role sendiri).
 *
 * `right` -- slot opsional untuk elemen yang harus satu baris dengan
 * Kembali/Home (dipakai untuk lonceng notifikasi, lihat permintaan Yolanda
 * di Catatan Teknis Fase 7). Dioper sebagai `ReactNode` (bukan dirender
 * langsung oleh komponen ini) supaya PageNav tetap boleh client component
 * tanpa memaksa isi slot-nya ikut jadi client -- pola sama seperti
 * `content: ReactNode` di SideTabs (Fase 4).
 */
export function PageNav({ homeHref, right }: { homeHref: string; right?: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          Kembali
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={homeHref}>
            <House className="size-4" />
            Home
          </Link>
        </Button>
      </div>
      {right}
    </div>
  );
}
