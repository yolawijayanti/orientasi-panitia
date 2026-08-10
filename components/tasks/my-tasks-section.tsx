import Link from "next/link";

import { StatusPill } from "@/components/tasks/status-pill";
import { formatDeadline } from "@/lib/tasks/format";
import type { MyTaskRow } from "@/lib/tasks/my-tasks";

/**
 * Read-only -- edit tugas/subtugas tetap di halaman detail bucket-nya
 * (tugas di sini bisa berasal dari bidang manapun, jadi tidak ada satu form
 * edit yang masuk akal ditaruh langsung di sini). Tiap baris link ke bucket
 * tempat tugas itu berada.
 */
export function MyTasksSection({
  matched,
  tasks,
}: {
  matched: boolean;
  tasks: MyTaskRow[];
}) {
  if (!matched) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada anggota panitia dengan email yang sama dengan akun login ini. Hubungi leader
        untuk menambahkan Anda ke Susunan Panitia dengan email yang sama dengan akun ini, supaya
        tugas yang di-assign ke Anda muncul di sini.
      </p>
    );
  }

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada tugas yang di-assign ke Anda.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((item) => (
        <Link
          key={`${item.kind}-${item.id}`}
          href={`/panitia/bucket/${item.bidangId}`}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 hover:border-ring"
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {item.judul}
              {item.kind === "subtask" && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (subtugas dari &ldquo;{item.indukJudul}&rdquo;)
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">Bidang: {item.bidangNama}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatDeadline(item.deadline)}</span>
            <StatusPill status={item.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
