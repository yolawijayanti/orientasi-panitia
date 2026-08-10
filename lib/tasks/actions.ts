"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ItemStatus = "belum" | "proses" | "selesai";

function withError(redirectTo: string, message: string): never {
  redirect(`${redirectTo}?error=${encodeURIComponent(message)}`);
}

function parseStatus(value: FormDataEntryValue | null): ItemStatus {
  return value === "proses" || value === "selesai" ? value : "belum";
}

function parseDeadline(value: FormDataEntryValue | null): string | null {
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
  const { error } = await supabase
    .from("tasks")
    .update({
      judul: (judul as string).trim(),
      deadline: parseDeadline(formData.get("deadline")),
      status: parseStatus(formData.get("status")),
    })
    .eq("id", taskId);

  if (error) {
    withError(redirectTo, "Gagal menyimpan perubahan tugas.");
  }

  revalidatePath(redirectTo);
}

export async function deleteTask(taskId: string, redirectTo: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    withError(redirectTo, "Gagal menghapus tugas.");
  }

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
  const { error } = await supabase
    .from("subtasks")
    .update({
      judul: (judul as string).trim(),
      deadline: parseDeadline(formData.get("deadline")),
      status: parseStatus(formData.get("status")),
    })
    .eq("id", subtaskId);

  if (error) {
    withError(redirectTo, "Gagal menyimpan perubahan subtugas.");
  }

  revalidatePath(redirectTo);
}

export async function deleteSubtask(subtaskId: string, redirectTo: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("subtasks").delete().eq("id", subtaskId);

  if (error) {
    withError(redirectTo, "Gagal menghapus subtugas.");
  }

  revalidatePath(redirectTo);
}
