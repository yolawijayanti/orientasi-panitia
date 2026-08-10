import { Resend } from "resend";

let client: Resend | null = null;

/**
 * Dibuat lazy (bukan module-level `new Resend(...)`) supaya file ini aman
 * di-import di environment tanpa RESEND_API_KEY (misal sandbox/local dev
 * yang belum diisi Yolanda) -- baru melempar kalau benar-benar dipakai
 * mengirim email, bukan saat build/import.
 */
export function getResendClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY belum diisi di environment.");
    }
    client = new Resend(apiKey);
  }
  return client;
}
