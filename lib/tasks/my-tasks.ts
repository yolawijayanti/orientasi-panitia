import type { ItemStatus } from "@/lib/tasks/actions";
import type { createClient } from "@/lib/supabase/server";

export type MyTaskRow = {
  id: string;
  judul: string;
  deadline: string | null;
  status: ItemStatus;
  bidangNama: string;
  bidangId: string;
  kind: "task" | "subtask";
  indukJudul: string | null;
};

/**
 * "Tugas Saya" cocok akun login ke baris committee_members lewat EMAIL --
 * skema ini tidak punya kolom user_id yang menautkan committee_members ke
 * auth.users, dan menambah kolom itu berarti migration + alur pengisian baru
 * yang di luar scope permintaan ini. Email sudah ada di kedua sisi (akun
 * Supabase Auth & kolom committee_members.email), jadi dipakai sebagai kunci
 * pencocokan -- SYARATNYA: leader mengisi email committee_members dengan
 * email login yang sama persis (case-insensitive) dengan akun panitia
 * tersebut. Kalau tidak cocok, matchedMemberIds kosong dan halaman menyuruh
 * hubungi leader -- bukan try/catch diam-diam.
 */
export async function loadMyTasks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kepanitiaanSiteId: string,
  email: string | null | undefined,
): Promise<{ matchedMemberIds: string[]; tasks: MyTaskRow[] }> {
  if (!email) return { matchedMemberIds: [], tasks: [] };

  const { data: matchedMembers } = await supabase
    .from("committee_members")
    .select("id")
    .eq("kepanitiaan_site_id", kepanitiaanSiteId)
    .ilike("email", email);

  const matchedMemberIds = (matchedMembers ?? []).map((member) => member.id as string);
  if (matchedMemberIds.length === 0) {
    return { matchedMemberIds: [], tasks: [] };
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, judul, deadline, status, bucket:buckets(id, nama_bidang)")
    .in("assignee_id", matchedMemberIds);

  const { data: subtasks } = await supabase
    .from("subtasks")
    .select(
      "id, judul, deadline, status, task:tasks(judul, bucket:buckets(id, nama_bidang))",
    )
    .in("assignee_id", matchedMemberIds);

  type TaskRow = {
    id: string;
    judul: string;
    deadline: string | null;
    status: ItemStatus;
    bucket: { id: string; nama_bidang: string } | null;
  };
  type SubtaskRow = {
    id: string;
    judul: string;
    deadline: string | null;
    status: ItemStatus;
    task: { judul: string; bucket: { id: string; nama_bidang: string } | null } | null;
  };

  const taskRows: MyTaskRow[] = ((tasks ?? []) as unknown as TaskRow[]).map((task) => ({
    id: task.id,
    judul: task.judul,
    deadline: task.deadline,
    status: task.status,
    bidangNama: task.bucket?.nama_bidang ?? "?",
    bidangId: task.bucket?.id ?? "",
    kind: "task",
    indukJudul: null,
  }));

  const subtaskRows: MyTaskRow[] = ((subtasks ?? []) as unknown as SubtaskRow[]).map(
    (subtask) => ({
      id: subtask.id,
      judul: subtask.judul,
      deadline: subtask.deadline,
      status: subtask.status,
      bidangNama: subtask.task?.bucket?.nama_bidang ?? "?",
      bidangId: subtask.task?.bucket?.id ?? "",
      kind: "subtask",
      indukJudul: subtask.task?.judul ?? null,
    }),
  );

  const all = [...taskRows, ...subtaskRows].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });

  return { matchedMemberIds, tasks: all };
}
