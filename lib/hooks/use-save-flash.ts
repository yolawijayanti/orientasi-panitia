"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Konfirmasi visual sesaat setelah save berhasil. SubmitButton (spinner +
 * "Menyimpan...") sudah menandai PROSES-nya, tapi begitu request selesai --
 * yang biasanya cuma beberapa ratus ms -- form langsung tertutup dan baris
 * berubah ke tampilan terkunci. Perubahan itu terlalu cepat untuk dipercaya
 * sebagai "reaksi": user submit, lalu tampilan tiba-tiba lain, tanpa jeda
 * yang menandai "ya, ini karena aksimu tadi". Flash ini mengisi jeda itu.
 */
export function useSaveFlash(durationMs = 1600) {
  const [justSaved, setJustSaved] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback(() => {
    setJustSaved(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setJustSaved(false), durationMs);
  }, [durationMs]);

  return [justSaved, flash] as const;
}
