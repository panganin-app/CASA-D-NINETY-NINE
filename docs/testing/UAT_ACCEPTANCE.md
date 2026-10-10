# UAT & Acceptance Criteria

## Gate 1 — Visual dan accessibility

- [ ] Login mempertahankan foto rumah sebagai visual dominan dan form tidak menutup fasad utama.
- [ ] Seluruh layar memakai token CASA dan tidak memiliki metode pembayaran selain BCA.
- [ ] Font scaling 200% tidak memotong CTA utama.
- [ ] TalkBack/VoiceOver membacakan label, nilai, status, dan urutan fokus dengan benar.
- [ ] Keyboard admin dapat mengakses filter, tabel, drawer, dialog, dan aksi.

## Gate 2 — IPL

- [ ] Satu rumah hanya memiliki satu tagihan IPL aktif per periode.
- [ ] Nominal Oktober 2026 dan periode berikutnya sesuai aturan Rp100.000/KK/bulan.
- [ ] Upload menolak tipe selain JPG/PNG dan ukuran di atas 5 MB.
- [ ] Submit membuat `PENDING_VERIFICATION`, bukan `PAID`.
- [ ] Approve admin mengubah payment dan bill secara atomik serta menulis audit log.
- [ ] Reject wajib memiliki alasan dan memungkinkan upload ulang.
- [ ] Duplicate submit dan double approve aman/idempotent.

## Gate 3 — Internet

- [ ] Hanya paket 25/125k, 50/180k, dan 100/250k yang dapat dipilih.
- [ ] Total ditentukan backend dan tidak dapat dimanipulasi client.
- [ ] Approval menghitung masa aktif baru dari tanggal akhir yang valid, tanpa overlap/gap yang salah.
- [ ] Status pembayaran tidak otomatis mengubah router.
- [ ] Admin dapat mencatat aktivasi manual dan setiap perubahan diaudit.

## Gate 4 — Community

- [ ] Resident hanya melihat announcement/event published.
- [ ] Laporan hanya terlihat pemilik dan pengurus berwenang.
- [ ] Attachment laporan tidak dapat diakses lintas rumah.
- [ ] Finance hanya menampilkan publication snapshot yang disetujui.

## Gate 5 — CCTV

- [ ] Resident tanpa permission mendapat forbidden, bukan stream URL.
- [ ] Session bertempo singkat, dapat dicabut, dan expiry ditangani UI.
- [ ] Credential DVR tidak ada di bundle mobile/web, log, atau Firestore publik.
- [ ] Setiap akses stream menghasilkan audit event.

## Gate 6 — Release

- [ ] Security rules test, integration test, E2E, dan smoke test lulus.
- [ ] Crash-free staging, monitoring, backup, restore drill, dan rollback telah diverifikasi.
- [ ] Privacy policy, terms, data deletion path, store metadata, screenshot, dan support contact tersedia.
- [ ] Product owner dan pengurus menandatangani UAT tanpa P0/P1 terbuka.
