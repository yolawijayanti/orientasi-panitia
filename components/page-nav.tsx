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
