"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

/**
 * Tombol submit untuk aksi merusak (hapus) yang minta konfirmasi dulu.
 * Kalau user membatalkan, submit-nya di-preventDefault sehingga server action
 * tidak pernah dipanggil. Kalau JavaScript mati, tombol tetap berfungsi
 * sebagai submit biasa (tanpa konfirmasi) -- form-nya tidak ikut rusak.
 */
export function ConfirmSubmitButton({
  confirmMessage,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { confirmMessage: string }) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}
