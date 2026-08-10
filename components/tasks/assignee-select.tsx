import { Label } from "@/components/ui/label";
import { NATIVE_SELECT_CLASSNAME } from "@/lib/utils";

export type AssignableMember = {
  id: string;
  nama: string;
  role: "anggota" | "leader_bidang";
};

/**
 * Pilihan anggota untuk assign tugas. Daftarnya cuma berisi anggota di
 * instance yang sama (di-query di halaman pemanggil) -- trigger
 * trg_check_task_assignee_instance jadi lapis keduanya di level DB.
 */
export function AssigneeSelect({
  members,
  value,
  idPrefix,
}: {
  members: AssignableMember[];
  value: string | null;
  idPrefix: string;
}) {
  const id = `${idPrefix}-assignee`;

  return (
    <div className="flex min-w-44 flex-col gap-1">
      <Label htmlFor={id}>Assign ke</Label>
      <select
        id={id}
        name="assignee_id"
        defaultValue={value ?? ""}
        className={NATIVE_SELECT_CLASSNAME}
      >
        <option value="">— Belum di-assign —</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.nama}
            {member.role === "leader_bidang" ? " (Leader Bidang)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
