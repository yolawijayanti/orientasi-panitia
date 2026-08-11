import { LeaderNotificationBell } from "@/components/notifications/leader-notification-bell";

/**
 * Layout bersama -- SENGAJA bukan `async function` dan TIDAK `await`
 * apapun secara langsung (data notifikasi difetch di dalam
 * `LeaderNotificationBell`, yang membungkus fetcher-nya sendiri dengan
 * `<Suspense>`) -- supaya `{children}` (isi halaman) tetap bisa langsung
 * streaming tanpa tertahan menunggu query notifikasi. Ini bugfix performa
 * dari Revisi 5 (lihat HANDOVER.md) -- JANGAN ubah fungsi ini jadi
 * `async function` yang `await` sesuatu sebelum `return`, itu yang bikin
 * navigasi lambat sebelumnya.
 *
 * Revisi 6: lonceng dipindah BALIK ke strip khusus di atas `{children}`
 * (bukan `position: fixed`, dan bukan lagi ditaruh manual di header
 * masing-masing halaman lewat prop `right` di PageNav). Dua percobaan
 * sebelumnya sama-sama bermasalah -- per-halaman (Revisi 5) posisinya
 * beda-beda tergantung struktur header tiap halaman (dilaporkan Yolanda
 * "pindah-pindah"); `fixed` (percobaan yang TIDAK dipakai, sempat ditulis
 * lalu diganti lagi sebelum sempat di-commit) berisiko bertumpuk visual
 * dengan tombol di pojok kanan-atas beberapa halaman (misal "+ Buat
 * Kepanitiaan"/Keluar di `/leader/kepanitiaan`) karena tinggi header tiap
 * halaman tidak seragam. Strip khusus di SATU tempat (layout, bukan tiap
 * halaman) itu 100% konsisten by construction -- markup-nya sama persis
 * untuk semua halaman leader -- dan tidak bertumpuk dengan apapun karena
 * `{children}` otomatis terdorong ke bawah lewat alur block normal
 * (bukan `position: fixed` yang lepas dari alur).
 */
export default function LeaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex justify-end border-b p-3">
        <LeaderNotificationBell />
      </div>
      {children}
    </div>
  );
}
