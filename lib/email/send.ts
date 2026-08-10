import { getResendClient } from "@/lib/email/resend";

const DEFAULT_FROM = "PanitiYAY <onboarding@resend.dev>";

/**
 * Kirim email lewat Resend. SENGAJA tidak pernah melempar error ke
 * pemanggil -- ini dipakai di dalam server action (submitBudget,
 * updateTask, dst) dan di cron reminder, dan gagal kirim email (domain
 * belum diverifikasi, quota Resend habis, dst) tidak boleh menggagalkan
 * aksi utama pemanggilnya (simpan tugas/budget tetap harus sukses walau
 * emailnya gagal terkirim). Kegagalan cuma di-log ke console supaya
 * kelihatan di Vercel logs, bukan dilempar sebagai exception.
 *
 * `EMAIL_FROM` fallback ke alamat sandbox Resend (`onboarding@resend.dev`)
 * kalau domain kustom belum diverifikasi -- alamat ini cuma bisa mengirim
 * ke email pemilik akun Resend selama masih mode test, ganti env var
 * EMAIL_FROM begitu domain sungguhan sudah diverifikasi.
 */
export async function sendEmail(to: string | string[], subject: string, html: string) {
  const recipients = Array.isArray(to) ? to : [to];
  if (recipients.length === 0) return;

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? DEFAULT_FROM,
      to: recipients,
      subject,
      html,
    });
    if (error) {
      console.error("Gagal mengirim email:", error);
    }
  } catch (err) {
    console.error("Gagal mengirim email:", err);
  }
}
