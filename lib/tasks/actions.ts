"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { checkAndNotifyInstanceComplete } from "@/lib/notifications/notify-leader";

export type ItemStatus = "belum" | "proses" | "selesai";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Diresolve SEBELUM update/hapus (bukan sesudah) supaya juga jalan untuk
 * delete -- begitu baris tasks/subtasks-nya terhapus, tidak ada lagi jalan
 * untuk cari bucket/instance-nya dari baris itu.
 */
async function resolveInstanceIdFromTask(
  supabase: SupabaseClient,
  taskId: string,
): Promise<string | null> {
  const { data } = await supabase.from("tasks").select("bucket_id").eq("id", taskId).maybeSingle();
  if (!data) return null;
  const { data: bucket } = await supabase
    .from("buckets")
    .select("kepanitiaan_site_id")
    .eq("id", data.bucket_id)
    .maybeSingle();
  return bucket?.kepanitiaan_site_id ?? null;
}

async function resolveInstanceIdFromSubtask(
  supabase: SupabaseClient,
  subtaskId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("subtasks")
    .select("task_id")
    .eq("id", subtaskId)
    .maybeSingle();
  if (!data) return null;
  return resolveInstanceIdFromTask(supabase, data.task_id);
}

function withError(redirectTo: string, message: string): never {
  redirect(`${redirectTo}?error=${encodeURIComponent(message)}`);
}

function parseStatus(value: FormDataEntryValue | null): ItemStatus {
  return value === "proses" || value === "selesai" ? value : "belum";
}

function parseDeadline(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** "" = sengaja tidak di-assign ke siapa-siapa (opsi "- Belum di-assign -" di UI). */
function parseAssigneeId(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function addTask(bucketId: string, redirectTo: string, formData: FormData) {
  const judul = formData.get("judul");
  if (typeof judul !== "string" || !judul.trim()) {
    withError(redirectTo, "Nama tugas wajib diisi.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    bucket_id: bucketId,
    judul: (judul as string).trim(),
    deadline: parseDeadline(formData.get("deadline")),
    assignee_id: parseAssigneeId(formData.get("assignee_id")),
  });

  if (error) {
    withError(redirectTo, "Gagal menambah tugas.");
  }

  revalidatePath(redirectTo);
}

export async function updateTask(taskId: string, redirectTo: string, formData: FormData) {
  const judul = formData.get("judul");
  if (typeof judul !== "string" || !judul.trim()) {
    withError(redirectTo, "Nama tugas wajib diisi.");
  }

  const supabase = await createClient();
  const instanceId = await resolveInstanceIdFromTask(supabase, taskId);

  const { error } = await supabase
    .from("tasks")
    .update({
      judul: (judul as string).trim(),
      deadline: parseDeadline(formData.get("deadline")),
      status: parseStatus(formData.get("status")),
      assignee_id: parseAssigneeId(formData.get("assignee_id")),
    })
    .eq("id", taskId);

  if (error) {
    withError(redirectTo, "Gagal menyimpan perubahan tugas.");
  }

  if (instanceId) await checkAndNotifyInstanceComplete(supabase, instanceId);

  revalidatePath(redirectTo);
}

export async function deleteTask(taskId: string, redirectTo: string) {
  const supabase = await createClient();
  const instanceId = await resolveInstanceIdFromTask(supabase, taskId);

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    withError(redirectTo, "Gagal menghapus tugas.");
  }

  if (instanceId) await checkAndNotifyInstanceComplete(supabase, instanceId);

  revalidatePath(redirectTo);
}

export async function addSubtask(taskId: string, redirectTo: string, formData: FormData) {
  const judul = formData.get("judul");
  if (typeof judul !== "string" || !judul.trim()) {
    withError(redirectTo, "Nama subtugas wajib diisi.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subtasks").insert({
    task_id: taskId,
    judul: (judul as string).trim(),
    deadline: parseDeadline(formData.get("deadline")),
    assignee_id: parseAssigneeId(formData.get("assignee_id")),
  });

  if (error) {
    withError(redirectTo, "Gagal menambah subtugas.");
  }

  revalidatePath(redirectTo);
}

export async function updateSubtask(subtaskId: string, redirectTo: string, formData: FormData) {
  const judul = formData.get("judul");
  if (typeof judul !== "string" || !judul.trim()) {
    withError(redirectTo, "Nama subtugas wajib diisi.");
  }

  const supabase = await createClient();
  const instanceId = await resolveInstanceIdFromSubtask(supabase, subtaskId);

  const { error } = await supabase
    .from("subtasks")
    .update({
      judul: (judul as string).trim(),
      deadline: parseDeadline(formData.get("deadline")),
      status: parseStatus(formData.get("status")),
      assignee_id: parseAssigneeId(formData.get("assignee_id")),
    })
    .eq("id", subtaskId);

  if (error) {
    withError(redirectTo, "Gagal menyimpan perubahan subtugas.");
  }

  if (instanceId) await checkAndNotifyInstanceComplete(supabase, instanceId);

  revalidatePath(redirectTo);
}

export async function deleteSubtask(subtaskId: string, redirectTo: string) {
  const supabase = await createClient();
  const instanceId = await resolveInstanceIdFromSubtask(supabase, subtaskId);

  const { error } = await supabase.from("subtasks").delete().eq("id", subtaskId);

  if (error) {
    withError(redirectTo, "Gagal menghapus subtugas.");
  }

  if (instanceId) await checkAndNotifyInstanceComplete(supabase, instanceId);

  revalidatePath(redirectTo);
}
