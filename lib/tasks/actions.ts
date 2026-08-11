"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  checkAndNotifyInstanceComplete,
  checkAndNotifyTaskAssigned,
  checkAndNotifyTaskUnassigned,
} from "@/lib/notifications/notify";

export type ItemStatus = "belum" | "proses" | "selesai";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function resolveInstanceIdFromBucket(
  supabase: SupabaseClient,
  bucketId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("buckets")
    .select("kepanitiaan_site_id")
    .eq("id", bucketId)
    .maybeSingle();
  return data?.kepanitiaan_site_id ?? null;
}

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
  return resolveInstanceIdFromBucket(supabase, data.bucket_id);
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

/**
 * Dipakai khusus flow update (bukan delete) -- butuh `assignee_id` LAMA
 * sekalian (dalam query yang sama dengan bucket_id) supaya bisa dibandingkan
 * dengan `assignee_id` baru dari form: kalau beda dan yang baru bukan null,
 * itu ASSIGNMENT BARU (checkAndNotifyTaskAssigned); kalau beda dan yang lama
 * bukan null, assignee lama itu di-UNASSIGN (checkAndNotifyTaskUnassigned).
 * Re-save assignee yang sama (paling umum: cuma ganti status) tidak memicu
 * keduanya.
 */
async function fetchTaskContext(
  supabase: SupabaseClient,
  taskId: string,
): Promise<{ instanceId: string | null; assigneeId: string | null } | null> {
  const { data } = await supabase
    .from("tasks")
    .select("bucket_id, assignee_id")
    .eq("id", taskId)
    .maybeSingle();
  if (!data) return null;
  const instanceId = await resolveInstanceIdFromBucket(supabase, data.bucket_id);
  return { instanceId, assigneeId: data.assignee_id };
}

async function fetchSubtaskContext(
  supabase: SupabaseClient,
  subtaskId: string,
): Promise<{ instanceId: string | null; assigneeId: string | null } | null> {
  const { data } = await supabase
    .from("subtasks")
    .select("task_id, assignee_id")
    .eq("id", subtaskId)
    .maybeSingle();
  if (!data) return null;
  const instanceId = await resolveInstanceIdFromTask(supabase, data.task_id);
  return { instanceId, assigneeId: data.assignee_id };
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
  const judulTrimmed = (judul as string).trim();
  const deadline = parseDeadline(formData.get("deadline"));
  const assigneeId = parseAssigneeId(formData.get("assignee_id"));

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("tasks")
    .insert({ bucket_id: bucketId, judul: judulTrimmed, deadline, assignee_id: assigneeId })
    .select("id")
    .single();

  if (error) {
    withError(redirectTo, "Gagal menambah tugas.");
  }

  if (assigneeId && inserted) {
    await checkAndNotifyTaskAssigned(supabase, {
      assigneeId,
      refType: "task",
      refId: inserted.id,
      judul: judulTrimmed,
      deadline,
    });
  }

  revalidatePath(redirectTo);
}

export async function updateTask(taskId: string, redirectTo: string, formData: FormData) {
  const judul = formData.get("judul");
  if (typeof judul !== "string" || !judul.trim()) {
    withError(redirectTo, "Nama tugas wajib diisi.");
  }
  const judulTrimmed = (judul as string).trim();
  const deadline = parseDeadline(formData.get("deadline"));
  const assigneeId = parseAssigneeId(formData.get("assignee_id"));

  const supabase = await createClient();
  const before = await fetchTaskContext(supabase, taskId);

  const { error } = await supabase
    .from("tasks")
    .update({
      judul: judulTrimmed,
      deadline,
      status: parseStatus(formData.get("status")),
      assignee_id: assigneeId,
    })
    .eq("id", taskId);

  if (error) {
    withError(redirectTo, "Gagal menyimpan perubahan tugas.");
  }

  if (before?.instanceId) await checkAndNotifyInstanceComplete(supabase, before.instanceId);

  if (assigneeId !== (before?.assigneeId ?? null)) {
    if (assigneeId) {
      await checkAndNotifyTaskAssigned(supabase, {
        assigneeId,
        refType: "task",
        refId: taskId,
        judul: judulTrimmed,
        deadline,
      });
    }
    if (before?.assigneeId) {
      await checkAndNotifyTaskUnassigned(supabase, {
        assigneeId: before.assigneeId,
        refType: "task",
        refId: taskId,
        judul: judulTrimmed,
      });
    }
  }

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
  const judulTrimmed = (judul as string).trim();
  const deadline = parseDeadline(formData.get("deadline"));
  const assigneeId = parseAssigneeId(formData.get("assignee_id"));

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("subtasks")
    .insert({ task_id: taskId, judul: judulTrimmed, deadline, assignee_id: assigneeId })
    .select("id")
    .single();

  if (error) {
    withError(redirectTo, "Gagal menambah subtugas.");
  }

  if (assigneeId && inserted) {
    await checkAndNotifyTaskAssigned(supabase, {
      assigneeId,
      refType: "subtask",
      refId: inserted.id,
      judul: judulTrimmed,
      deadline,
    });
  }

  revalidatePath(redirectTo);
}

export async function updateSubtask(subtaskId: string, redirectTo: string, formData: FormData) {
  const judul = formData.get("judul");
  if (typeof judul !== "string" || !judul.trim()) {
    withError(redirectTo, "Nama subtugas wajib diisi.");
  }
  const judulTrimmed = (judul as string).trim();
  const deadline = parseDeadline(formData.get("deadline"));
  const assigneeId = parseAssigneeId(formData.get("assignee_id"));

  const supabase = await createClient();
  const before = await fetchSubtaskContext(supabase, subtaskId);

  const { error } = await supabase
    .from("subtasks")
    .update({
      judul: judulTrimmed,
      deadline,
      status: parseStatus(formData.get("status")),
      assignee_id: assigneeId,
    })
    .eq("id", subtaskId);

  if (error) {
    withError(redirectTo, "Gagal menyimpan perubahan subtugas.");
  }

  if (before?.instanceId) await checkAndNotifyInstanceComplete(supabase, before.instanceId);

  if (assigneeId !== (before?.assigneeId ?? null)) {
    if (assigneeId) {
      await checkAndNotifyTaskAssigned(supabase, {
        assigneeId,
        refType: "subtask",
        refId: subtaskId,
        judul: judulTrimmed,
        deadline,
      });
    }
    if (before?.assigneeId) {
      await checkAndNotifyTaskUnassigned(supabase, {
        assigneeId: before.assigneeId,
        refType: "subtask",
        refId: subtaskId,
        judul: judulTrimmed,
      });
    }
  }

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
