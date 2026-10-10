# Local billing verification — 8 Oktober 2026

Scope: source backend lokal saat ini; demo-casa-billing (Auth, Functions, Firestore, Storage emulator). Bukan audit production.

Commands:
- `npm test`: TypeScript build PASS, 4 unit tests PASS.
- `npm run test:billing`: TypeScript build PASS, 4 integration groups + 4 Firestore rules tests PASS (8/8).

Assertions: pembuatan IPL concurrent menghasilkan satu bill; amount client ditolak; akses rumah lain ditolak; request submit replay tidak menggandakan payment; pembayaran pending tidak menerima submit baru; resident tidak dapat approve; rejection wajib alasan; rejected dapat disubmit ulang dengan proof baru; approval concurrent menghasilkan satu audit dan satu perpanjangan; keputusan final tidak dapat dibalik; package tidak dikenal ditolak; kalender Jakarta clamp akhir bulan; gambar rusak/SVG/base64 invalid ditolak; bukti hanya pemilik/pengurus; anonymous Storage download ditolak; callable menolak anonymous/unregistered account; rekening IPL/internet dibaca dari konfigurasi terpisah; client tidak dapat membaca config, membuat proof tervalidasi, atau outbox palsu.

Fixture gambar dan rekening pengujian sintetis. Pengujian tidak mentransfer uang dan tidak menyentuh Firebase cloud/router.

Belum diuji/dibangun: App Check production, IAM, DAST penuh, dependency CVE audit, global rate limiting, FCM delivery, orphan cleanup, retention, backup/restore, UI perangkat, full end-to-end production. Rate limit upload telah diimplementasikan; batas 5/menit belum mempunyai test khusus. Hasil ini tidak memberikan izin release production.

## Tambahan operasional admin

`npm run test:billing` final: 11/11 PASS (6 integration groups, 5 rules tests); build TypeScript PASS. Pengujian baru mencakup duplicate address/ID, registration Auth yang telah tersedia, role injection, kepala keluarga kedua ditolak, penonaktifan resident, privilege admin tidak dapat dinonaktifkan oleh operasi warga, pagination/allowlist, aktivasi manual dengan approval terbaru, retry concurrent, audit tunggal, tanggal expiry tetap, dan client provisioning/activation ditolak.

Limitasi: export/import emulator sudah dikonfigurasi, tetapi restore drill belum dijalankan. Penonaktifan akun adalah kontrol domain pada Firestore/backend; Firebase Auth token revocation belum tersedia. Full security audit belum PASS.

## Tambahan komunitas, inbox, batch IPL

Pengujian terakhir: build TypeScript PASS; npm test 4/4; npm run test:billing 17/17 (10 integration groups + 7 rules tests). Total 21 tes lulus. Log lokal: .local/community-test.log.

Evidence baru: resident tidak dapat publish; draft/archived tersembunyi; stale content version ditolak; agenda invalid/reversed ditolak; report retry concurrent tunggal; ownership field injection ditolak; resident tidak dapat mengganti status; stale/invalid transitions ditolak; history empat transisi tersimpan; inbox benar-benar dibuat oleh trigger Firestore emulator; concurrent delivery tidak menggandakan ID; acknowledgement hanya pemilik dan idempotent; akun nonaktif ditahan; reconcile admin-only; IPL batch limit/cursor/retry tidak duplikat atau reset PAID. Rules menolak draft/private report/private inbox, client publish/status/notification write, anonymous dan disabled feed read.

Ini evidence lokal, bukan pengujian push FCM atau Cloud Scheduler. Lampiran laporan, flood protection seluruh API, deployment/index production, UI escaping dan end-to-end perangkat, backup restore serta full security audit masih terbuka.
