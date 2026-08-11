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
 * Sebelumnya (Revisi 5) komponen ini punya slot `right` untuk lonceng
 * notifikasi, supaya satu baris dengan Kembali/Home -- tapi posisinya
 * jadi beda-beda tergantung header tiap halaman (dilaporkan Yolanda
 * sebagai "pindah-pindah"). Revisi 6: lonceng dipindah ke posisi `fixed`
 * lewat layout (lihat app/(leader)/layout.tsx & app/(panitia)/layout.tsx),
 * jadi slot itu dihapus lagi dari sini -- konsisten lebih penting daripada
 * satu baris dengan Kembali/Home.
 */
export function PageNav({ homeHref }: { homeHref: string }) {
  const router = useRouter();

  return (
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
  );
}
