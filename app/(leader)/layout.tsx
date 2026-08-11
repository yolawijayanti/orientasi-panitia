/**
 * Revisi 7: lonceng TIDAK lagi ditaruh di sini (strip di atas `{children}`,
 * lihat HANDOVER.md Revisi 6) -- itu bikin lonceng terpisah dari baris judul
 * halaman (dilaporkan Yolanda "tidak sebaris dengan header tulisan"). Lonceng
 * sekarang ditaruh di dalam `PageHeader` tiap halaman sendiri (sebaris dengan
 * `h1`), lihat components/page-header.tsx -- markup `PageHeader` sama persis
 * di semua halaman jadi posisinya tetap konsisten, tanpa perlu strip terpisah.
 *
 * Layout ini tetap SENGAJA bukan `async function` -- tidak ada lagi apapun
 * yang perlu di-fetch di sini sama sekali sekarang (bugfix performa Revisi 5
 * jadi tidak relevan lagi di titik ini, tapi tetap dijaga non-async supaya
 * tidak ada godaan menambah `await` di layout di masa depan).
 */
export default function LeaderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
