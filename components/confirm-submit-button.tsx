"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

/**
 * Tombol submit untuk aksi merusak (hapus) yang minta konfirmasi dulu --
 * TANPA `window.confirm()`. `window.confirm()` blocks main thread SELAMA
 * dialognya terbuka; browser mencatat seluruh durasi itu sebagai bagian dari
 * interaksi klik "Hapus", jadi begitu user klik "Ya" di dialog native, Vercel
 * Toolbar langsung menampilkan peringatan INP untuk elemen "Hapus" itu
 * (dilaporkan Yolanda sebagai "tulisan aneh" yang muncul setelah klik Ya --
 * itu bukan error, tapi toolbar dev/preview yang salah kira window.confirm()
 * sebagai lambatnya event handler).
 *
 * Konfirmasi sekarang 2 langkah INLINE lewat state React biasa (tidak ada
 * apapun yang blocking main thread): klik pertama ganti tombolnya jadi
 * `confirmMessage` + "Ya, hapus"/"Batal", klik "Ya, hapus" baru benar-benar
 * submit form-nya. Klik pertama tetap `type="submit"` (bukan `type="button"`)
 * supaya kalau JavaScript mati, tombol tetap berfungsi sebagai submit biasa
 * tanpa konfirmasi apapun -- form-nya tidak ikut rusak.
 */
export function ConfirmSubmitButton({
  confirmMessage,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { confirmMessage: string }) {
  const [confirming, setConfirming] = React.useState(false);

  if (confirming) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{confirmMessage}</span>
        <Button {...props} type="submit">
          Ya, hapus
        </Button>
        <Button type="button" size={props.size} variant="ghost" onClick={() => setConfirming(false)}>
          Batal
        </Button>
      </span>
    );
  }

  return (
    <Button
      type="submit"
      {...props}
      onClick={(event) => {
        event.preventDefault();
        setConfirming(true);
      }}
    >
      {children}
    </Button>
  );
}
