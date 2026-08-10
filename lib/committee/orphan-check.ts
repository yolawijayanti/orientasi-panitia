import type { createClient } from "@/lib/supabase/server";

export type OrphanCommitteeMember = {
  memberId: string;
  nama: string;
  email: string;
  role: string;
  instanceId: string;
  kepanitiaanNama: string;
  namaSite: string;
};

/**
 * Diagnostik READ-ONLY untuk leader: cari baris `committee_members` yang
 * emailnya TIDAK cocok dengan akun panitia manapun yang aktif (secara
 * login) di instance yang sama -- biasanya sisa dari akun yang sudah
 * dipindah ke instance lain (lihat `public.users.kepanitiaan_site_id`,
 * satu akun cuma terhubung ke satu instance).
 *
 * SENGAJA tidak menghapus otomatis: entri di Susunan Panitia tidak wajib
 * punya akun login sama sekali (bisa cuma nama tercatat tanpa akses
 * sistem), jadi "email tidak cocok" bukan bukti pasti "harus dihapus" --
 * itu keputusan leader, bukan heuristik. Ini cuma bantu leader menemukan
 * kandidatnya lebih cepat; hapusnya tetap lewat tombol "Hapus" yang sudah
 * ada di Susunan Panitia masing-masing instance.
 *
 * Query flat (2x select + 1x select `in (...)`), bukan per-baris, supaya
 * tidak N+1 -- pola sama seperti `loadBucketBoardData`.
 */
export async function loadOrphanCommitteeMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<OrphanCommitteeMember[]> {
  const { data: members } = await supabase
    .from("committee_members")
    .select("id, nama, email, role, kepanitiaan_site_id")
    .not("email", "is", null);

  const { data: users } = await supabase
    .from("users")
    .select("email, kepanitiaan_site_id")
    .eq("role", "panitia")
    .not("kepanitiaan_site_id", "is", null);

  const boundPairs = new Set(
    (users ?? []).map((user) => `${user.email.toLowerCase()}|${user.kepanitiaan_site_id}`),
  );

  const orphans = (members ?? []).filter(
    (member) =>
      member.email &&
      !boundPairs.has(`${member.email.toLowerCase()}|${member.kepanitiaan_site_id}`),
  );

  if (orphans.length === 0) return [];

  const instanceIds = [...new Set(orphans.map((member) => member.kepanitiaan_site_id))];
  const { data: instances } = await supabase
    .from("kepanitiaan_site")
    .select("id, kepanitiaan(nama), site:sites(nama_site)")
    .in("id", instanceIds);

  const instanceById = new Map(
    ((instances ?? []) as unknown as {
      id: string;
      kepanitiaan: { nama: string } | null;
      site: { nama_site: string } | null;
    }[]).map((instance) => [instance.id, instance]),
  );

  return orphans.map((member) => {
    const instance = instanceById.get(member.kepanitiaan_site_id);
    return {
      memberId: member.id,
      nama: member.nama,
      email: member.email as string,
      role: member.role,
      instanceId: member.kepanitiaan_site_id,
      kepanitiaanNama: instance?.kepanitiaan?.nama ?? "(tidak diketahui)",
      namaSite: instance?.site?.nama_site ?? "(tidak diketahui)",
    };
  });
}
