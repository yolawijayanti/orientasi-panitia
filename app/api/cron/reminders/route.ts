import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { reminderDeadlineEmail } from "@/lib/notifications/templates";
import { todayJakartaISO } from "@/lib/timeline/format";

/**
 * Dipanggil sekali sehari lewat Vercel Cron (lihat vercel.json) -- ini
 * satu-satunya tempat di aplikasi yang memakai `createAdminClient`
 * (service role, bypass RLS), karena request cron tidak punya sesi login
 * sama sekali padahal perlu baca task/subtask jatuh tempo LINTAS SEMUA
 * instance kepanitiaan sekaligus.
 *
 * Jendela reminder: deadline hari ini s/d REMINDER_WINDOW_DAYS hari ke
 * depan, ATAU sudah lewat deadline (overdue) -- keduanya selama statusnya
 * masih belum "selesai". Reminder cuma dikirim ke email assignee-nya
 * (committee_members.email) -- task/subtask yang belum di-assign ke
 * siapapun dilewati (tidak ada penerima yang jelas untuk diberitahu).
 */

const REMINDER_WINDOW_DAYS = 3;

function addDaysToIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toJakartaDateOnly(isoTimestamp: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(isoTimestamp),
  );
}

type DueItem = {
  id: string;
  jenisItem: "tugas" | "subtugas";
  judul: string;
  deadline: string;
  assigneeId: string | null;
  bucketId: string;
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const today = todayJakartaISO();
  const windowEnd = addDaysToIso(today, REMINDER_WINDOW_DAYS);

  const [{ data: tasks }, { data: subtasks }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, judul, deadline, assignee_id, bucket_id")
      .not("deadline", "is", null)
      .neq("status", "selesai"),
    supabase
      .from("subtasks")
      .select("id, judul, deadline, assignee_id, task_id")
      .not("deadline", "is", null)
      .neq("status", "selesai"),
  ]);

  const dueTasks = (tasks ?? []).filter((task) => task.deadline! <= windowEnd);
  const dueSubtaskRows = (subtasks ?? []).filter((subtask) => subtask.deadline! <= windowEnd);

  // Subtugas tidak punya bucket_id langsung -- resolve lewat parent task-nya.
  const parentTaskIds = [...new Set(dueSubtaskRows.map((subtask) => subtask.task_id))];
  const { data: parentTasks } = parentTaskIds.length
    ? await supabase.from("tasks").select("id, bucket_id").in("id", parentTaskIds)
    : { data: [] };
  const bucketIdByTaskId = new Map((parentTasks ?? []).map((task) => [task.id, task.bucket_id]));

  const dueItems: DueItem[] = [
    ...dueTasks.map((task) => ({
      id: task.id,
      jenisItem: "tugas" as const,
      judul: task.judul,
      deadline: task.deadline!,
      assigneeId: task.assignee_id,
      bucketId: task.bucket_id,
    })),
    ...dueSubtaskRows
      .filter((subtask) => bucketIdByTaskId.has(subtask.task_id))
      .map((subtask) => ({
        id: subtask.id,
        jenisItem: "subtugas" as const,
        judul: subtask.judul,
        deadline: subtask.deadline!,
        assigneeId: subtask.assignee_id,
        bucketId: bucketIdByTaskId.get(subtask.task_id)!,
      })),
  ];

  if (dueItems.length === 0) {
    return Response.json({ checked: 0, sent: 0, skipped: 0 });
  }

  const bucketIds = [...new Set(dueItems.map((item) => item.bucketId))];
  const { data: buckets } = await supabase
    .from("buckets")
    .select("id, kepanitiaan_site_id")
    .in("id", bucketIds);
  const instanceIdByBucketId = new Map(
    (buckets ?? []).map((bucket) => [bucket.id, bucket.kepanitiaan_site_id]),
  );

  const instanceIds = [...new Set([...instanceIdByBucketId.values()])];
  const { data: instances } = instanceIds.length
    ? await supabase
        .from("kepanitiaan_site")
        .select("id, kepanitiaan(nama), site:sites(nama_site)")
        .in("id", instanceIds)
    : { data: [] };
  const instanceLabelById = new Map(
    (
      (instances ?? []) as unknown as {
        id: string;
        kepanitiaan: { nama: string } | null;
        site: { nama_site: string } | null;
      }[]
    ).map((row) => [
      row.id,
      `${row.kepanitiaan?.nama ?? "Kepanitiaan"} @ ${row.site?.nama_site ?? "Site tidak diketahui"}`,
    ]),
  );

  const assigneeIds = [
    ...new Set(dueItems.map((item) => item.assigneeId).filter((id): id is string => id !== null)),
  ];
  const { data: members } = assigneeIds.length
    ? await supabase.from("committee_members").select("id, email").in("id", assigneeIds)
    : { data: [] };
  const emailByAssigneeId = new Map((members ?? []).map((member) => [member.id, member.email]));

  // Dedupe: jangan kirim reminder yang SAMA (item + jenis) dua kali di hari
  // yang sama -- bandingkan tanggal Jakarta-nya, BUKAN `sent_at::date` di
  // sisi DB (server biasanya UTC, lihat bugfix Gantt Fase 3 untuk kasus
  // serupa). Ambil log 2 hari terakhir supaya cukup untuk cek "hari ini".
  const twoDaysAgoIso = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentLogs } = await supabase
    .from("notifications_log")
    .select("ref_id, sent_at")
    .eq("jenis", "reminder_deadline")
    .gte("sent_at", twoDaysAgoIso);

  const alreadySentToday = new Set(
    (recentLogs ?? [])
      .filter((log) => toJakartaDateOnly(log.sent_at) === today)
      .map((log) => log.ref_id),
  );

  let sent = 0;
  let skipped = 0;

  for (const item of dueItems) {
    if (alreadySentToday.has(item.id)) {
      skipped++;
      continue;
    }

    const email = item.assigneeId ? emailByAssigneeId.get(item.assigneeId) : null;
    if (!email) {
      skipped++;
      continue;
    }

    const instanceId = instanceIdByBucketId.get(item.bucketId);
    if (!instanceId) {
      skipped++;
      continue;
    }

    const { subject, html } = reminderDeadlineEmail({
      judul: item.judul,
      jenisItem: item.jenisItem,
      deadline: item.deadline,
      instanceLabel: instanceLabelById.get(instanceId) ?? "Kepanitiaan",
    });
    await sendEmail(email, subject, html);

    await supabase.from("notifications_log").insert({
      kepanitiaan_site_id: instanceId,
      jenis: "reminder_deadline",
      ref_type: item.jenisItem === "tugas" ? "task" : "subtask",
      ref_id: item.id,
      recipient_committee_member_id: item.assigneeId,
    });

    sent++;
  }

  return Response.json({ checked: dueItems.length, sent, skipped });
}
