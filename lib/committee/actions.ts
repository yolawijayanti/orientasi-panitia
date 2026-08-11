"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Readable } from "node:stream";
import ExcelJS from "exceljs";

import { createClient } from "@/lib/supabase/server";
import { loadCandidateAccounts } from "@/lib/committee/candidate-accounts";

type CommitteeRole = "anggota" | "leader_bidang";

function parseRole(value: FormDataEntryValue | null): CommitteeRole {
  return value === "leader_bidang" ? "leader_bidang" : "anggota";
}

function withError(redirectTo: string, message: string): never {
  redirect(`${redirectTo}?error=${encodeURIComponent(message)}`);
}

function withMessage(redirectTo: string, message: string): never {
  redirect(`${redirectTo}?message=${encodeURIComponent(message)}`);
}

const ROLE_ALIASES: Record<string, CommitteeRole> = {
  anggota: "anggota",
  leader_bidang: "leader_bidang",
  "leader bidang": "leader_bidang",
  leader: "leader_bidang",
};

function normalizeRole(raw: string): CommitteeRole {
  return ROLE_ALIASES[raw.trim().toLowerCase()] ?? "anggota";
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const obj = value as unknown as Record<string, unknown>;
    if ("text" in obj) return String(obj.text ?? "").trim();
    if ("result" in obj) return String(obj.result ?? "").trim();
    if (Array.isArray(obj.richText)) {
      return obj.richText
        .map((part) => String((part as { text?: string }).text ?? ""))
        .join("")
        .trim();
    }
    return "";
  }
  return String(value).trim();
}

function findColumn(headerRow: string[], candidates: string[]): number {
  return headerRow.findIndex((header) => candidates.includes(header.trim().toLowerCase()));
}

/**
 * bucket_id berlaku untuk SEMUA anggota, bukan cuma leader_bidang.
 *
 * Ini membalik keputusan Fase 3 (yang me-null-kan bucket_id kalau role bukan
 * leader_bidang): sejak susunan panitia dikelompokkan per bidang, anggota
 * biasa juga harus punya bidang -- kalau tidak, semua anggota jatuh ke grup
 * "Tanpa Bidang" dan pengelompokannya jadi tidak ada gunanya. Role sekarang
 * cuma menentukan urutan di dalam grup (leader_bidang selalu paling atas),
 * bukan boleh-tidaknya punya bidang.
 */
function parseBucketId(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function addCommitteeMember(
  kepanitiaanSiteId: string,
  redirectTo: string,
  formData: FormData,
) {
  const nama = formData.get("nama");
  if (typeof nama !== "string" || !nama.trim()) {
    withError(redirectTo, "Nama anggota wajib diisi.");
  }

  const email = formData.get("email");
  const role = parseRole(formData.get("role"));
  const supabase = await createClient();
  const { error } = await supabase.from("committee_members").insert({
    kepanitiaan_site_id: kepanitiaanSiteId,
    nama: (nama as string).trim(),
    email: typeof email === "string" && email.trim() ? email.trim() : null,
    role,
    bucket_id: parseBucketId(formData.get("bucket_id")),
  });

  if (error) {
    withError(redirectTo, "Gagal menambah anggota panitia.");
  }

  revalidatePath(redirectTo);
}

export async function updateCommitteeMember(
  memberId: string,
  redirectTo: string,
  formData: FormData,
) {
  const nama = formData.get("nama");
  if (typeof nama !== "string" || !nama.trim()) {
    withError(redirectTo, "Nama anggota wajib diisi.");
  }

  const email = formData.get("email");
  const role = parseRole(formData.get("role"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("committee_members")
    .update({
      nama: (nama as string).trim(),
      email: typeof email === "string" && email.trim() ? email.trim() : null,
      role,
      bucket_id: parseBucketId(formData.get("bucket_id")),
    })
    .eq("id", memberId);

  if (error) {
    withError(redirectTo, "Gagal menyimpan perubahan anggota.");
  }

  revalidatePath(redirectTo);
}

export async function deleteCommitteeMember(memberId: string, redirectTo: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("committee_members").delete().eq("id", memberId);

  if (error) {
    withError(redirectTo, "Gagal menghapus anggota panitia.");
  }

  revalidatePath(redirectTo);
}

/**
 * Email di sini WAJIB cocok dengan akun panitia yang sudah terdaftar (lihat
 * migration fase4_pilih_akun_terdaftar) -- baris dengan email yang tidak ada
 * di daftar akun terdaftar ditolak (bukan tetap dimasukkan sebagai teks
 * bebas), supaya bulk upload tidak membuka kembali celah typo-email yang
 * fitur "pilih dari akun terdaftar" itu sengaja menutup.
 */
export async function bulkAddCommitteeMembers(
  kepanitiaanSiteId: string,
  redirectTo: string,
  formData: FormData,
) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    withError(redirectTo, "Pilih file Excel (.xlsx) atau CSV terlebih dahulu.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();

  try {
    if (file.name.toLowerCase().endsWith(".csv")) {
      await workbook.csv.read(Readable.from(buffer));
    } else {
      // exceljs's Buffer type resolves against fast-csv's bundled @types/node (v14),
      // which structurally conflicts with this project's @types/node (v20) Buffer.
      await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    }
  } catch {
    withError(redirectTo, "Gagal membaca file. Pastikan formatnya .xlsx atau .csv dan tidak rusak.");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) {
    withError(
      redirectTo,
      "File tidak berisi data. Baris pertama harus header (Nama, Email, Role, Bidang), baris berikutnya data.",
    );
  }

  const headerRow = (sheet.getRow(1).values as ExcelJS.CellValue[]).slice(1).map(cellToString);
  const namaCol = findColumn(headerRow, ["nama", "name"]);
  const emailCol = findColumn(headerRow, ["email"]);
  if (namaCol === -1 || emailCol === -1) {
    withError(redirectTo, "Kolom 'Nama' dan 'Email' wajib ada di baris header file.");
  }
  const roleCol = findColumn(headerRow, ["role", "jabatan"]);
  const bidangCol = findColumn(headerRow, ["bidang", "bucket", "nama bidang"]);

  const supabase = await createClient();
  const [candidateAccounts, { data: buckets }, { data: existing }] = await Promise.all([
    loadCandidateAccounts(supabase, kepanitiaanSiteId),
    supabase.from("buckets").select("id, nama_bidang").eq("kepanitiaan_site_id", kepanitiaanSiteId),
    supabase.from("committee_members").select("email").eq("kepanitiaan_site_id", kepanitiaanSiteId),
  ]);

  const accountsByEmail = new Map(candidateAccounts.map((account) => [account.email.toLowerCase(), account]));
  const bucketsByName = new Map((buckets ?? []).map((bucket) => [bucket.nama_bidang.trim().toLowerCase(), bucket.id]));
  const seenEmails = new Set(
    (existing ?? [])
      .map((member) => member.email?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email)),
  );

  const rowErrors: string[] = [];
  const toInsert: {
    kepanitiaan_site_id: string;
    nama: string;
    email: string;
    role: CommitteeRole;
    bucket_id: string | null;
  }[] = [];
  let duplicateCount = 0;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const values = (row.values as ExcelJS.CellValue[]).slice(1);
    const nama = cellToString(values[namaCol]);
    const email = cellToString(values[emailCol]);
    const roleRaw = roleCol === -1 ? "" : cellToString(values[roleCol]);
    const bidangRaw = bidangCol === -1 ? "" : cellToString(values[bidangCol]);

    if (!nama && !email) return; // baris kosong

    if (!nama) {
      rowErrors.push(`Baris ${rowNumber}: nama kosong, dilewati.`);
      return;
    }
    if (!email) {
      rowErrors.push(`Baris ${rowNumber} (${nama}): email kosong, dilewati.`);
      return;
    }

    const emailKey = email.toLowerCase();
    if (!accountsByEmail.has(emailKey)) {
      rowErrors.push(
        `Baris ${rowNumber} (${nama}): email "${email}" belum terdaftar sebagai akun panitia instance ini, dilewati.`,
      );
      return;
    }

    if (seenEmails.has(emailKey)) {
      duplicateCount += 1;
      return;
    }
    seenEmails.add(emailKey);

    const bucketId = bidangRaw ? (bucketsByName.get(bidangRaw.trim().toLowerCase()) ?? null) : null;

    toInsert.push({
      kepanitiaan_site_id: kepanitiaanSiteId,
      nama,
      email,
      role: normalizeRole(roleRaw),
      bucket_id: bucketId,
    });
  });

  if (toInsert.length === 0 && duplicateCount === 0) {
    withError(
      redirectTo,
      `Tidak ada baris valid untuk ditambahkan.${rowErrors.length ? " " + rowErrors.join(" ") : ""}`,
    );
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("committee_members").insert(toInsert);
    if (error) {
      withError(redirectTo, "Gagal menyimpan data ke database.");
    }
  }

  const summaryParts = [
    `${toInsert.length} anggota ditambahkan`,
    duplicateCount > 0 ? `${duplicateCount} dilewati (sudah ada)` : null,
    rowErrors.length > 0 ? `${rowErrors.length} baris error` : null,
  ].filter(Boolean);

  const detail = rowErrors.length > 0 ? ` — ${rowErrors.slice(0, 5).join(" ")}` : "";

  revalidatePath(redirectTo);
  withMessage(redirectTo, `${summaryParts.join(", ")}.${detail}`);
}
