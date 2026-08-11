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
 * sebagai "pindah-pindah"). Revisi 6 memindah lonceng ke strip terpisah
 * di layout -- tapi itu bikin lonceng TIDAK sebaris dengan judul halaman
 * (`h1`, ditaruh terpisah SETELAH `PageNav` ini, bukan di baris ini).
 * Revisi 7: lonceng ditaruh di `PageHeader` (components/page-header.tsx),
 * sebaris dengan `h1` -- bukan di baris `PageNav` ini, karena `PageNav`
 * sendiri tidak muncul di semua halaman (mis. dashboard).
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
