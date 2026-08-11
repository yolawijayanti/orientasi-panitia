import { formatTanggal } from "@/lib/timeline/format";

type EmailContent = { subject: string; html: string };

function wrap(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">${title}</h2>
      ${bodyHtml}
      <p style="color: #888; font-size: 12px; margin-top: 24px;">Email otomatis dari PanitiYAY.</p>
    </div>
  `;
}

export function reminderDeadlineEmail(params: {
  judul: string;
  jenisItem: "tugas" | "subtugas";
  deadline: string;
  instanceLabel: string;
}): EmailContent {
  const { judul, jenisItem, deadline, instanceLabel } = params;
  return {
    subject: `Pengingat deadline: ${judul}`,
    html: wrap(
      "Pengingat Deadline",
      `<p>Halo, ${jenisItem} berikut di <strong>${instanceLabel}</strong> belum selesai:</p>
       <p style="font-size: 16px;"><strong>${judul}</strong></p>
       <p>Deadline: <strong>${formatTanggal(deadline)}</strong></p>`,
    ),
  };
}

export function taskAssignedEmail(params: {
  judul: string;
  jenisItem: "tugas" | "subtugas";
  deadline: string | null;
  instanceLabel: string;
}): EmailContent {
  const { judul, jenisItem, deadline, instanceLabel } = params;
  return {
    subject: `Tugas baru untuk Anda: ${judul}`,
    html: wrap(
      "Ada Tugas Baru untuk Anda",
      `<p>Anda baru saja di-assign ke ${jenisItem} berikut di <strong>${instanceLabel}</strong>:</p>
       <p style="font-size: 16px;"><strong>${judul}</strong></p>
       ${deadline ? `<p>Deadline: <strong>${formatTanggal(deadline)}</strong></p>` : ""}`,
    ),
  };
}

export function budgetLengkapEmail(instanceLabel: string): EmailContent {
  return {
    subject: `Budget submission lengkap: ${instanceLabel}`,
    html: wrap(
      "Budget Submission Lengkap",
      `<p>Panitia <strong>${instanceLabel}</strong> baru saja melengkapi submission budget mereka.</p>`,
    ),
  };
}

export function instanceSelesaiEmail(instanceLabel: string): EmailContent {
  return {
    subject: `Semua tugas selesai: ${instanceLabel}`,
    html: wrap(
      "Semua Tugas Selesai 100%",
      `<p>Seluruh tugas &amp; subtugas di <strong>${instanceLabel}</strong> sudah berstatus selesai.</p>`,
    ),
  };
}
