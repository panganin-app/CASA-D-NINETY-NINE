# Publish Readiness Runbook

## 1. Freeze

- Kunci PRD, change request, paket internet, desain, copy, dan contracts ke tag release candidate.
- Selesaikan semua ambiguity register. Rekening BCA production wajib diisi melalui protected backend config, bukan source code.

## 2. Production provisioning

- Buat Firebase project production terpisah; aktifkan billing alert, App Check, least-privilege IAM, secret manager, log retention, dan budget alert.
- Terapkan Firestore indexes/rules serta Storage rules dari commit release.
- Provision secure CCTV gateway, TLS, network allowlist, short-lived session signing, health check, dan revocation.
- Siapkan domain Admin Web, HTTPS, security headers, CSP, Sentry/Crashlytics, uptime monitor, dan alert channel.

## 3. Data readiness

- Import rumah dan warga melalui script tervalidasi; jangan memakai fixture staging.
- Jalankan dry-run bill generation dan rekonsiliasi jumlah rumah aktif.
- Validasi konfigurasi BCA menggunakan akun pengurus dan bukti sintetis, lalu hapus data uji.
- Pastikan package catalog hanya berisi 25/125k, 50/180k, 100/250k.

## 4. Build dan distribution

- Flutter: signed Android App Bundle dan iOS archive dari CI; signing secret tidak disimpan di repo.
- Admin: immutable production build; environment variables berasal dari secret store.
- Siapkan ikon, splash, screenshot, privacy URL, support URL, release notes, rating, dan data-safety declarations.
- Distribusikan ke internal testing/TestFlight sebelum staged rollout.

## 5. Go-live checklist

- [ ] Semua gate UAT lulus.
- [ ] Backup awal berhasil dan restore drill terbukti.
- [ ] Smoke test login, IPL submit/approve/reject, internet, informasi, laporan, finance, CCTV, dan logout lulus.
- [ ] Tidak ada secret, data warga, nomor rekening, atau credential DVR di repository/bundle/log.
- [ ] Rollback owner dan keputusan rollback terdokumentasi.
- [ ] Support contact serta incident escalation aktif.

## 6. Rollout

1. Admin Web production untuk pengurus terbatas.
2. Seed konfigurasi dan data master.
3. Mobile internal 10 pengguna.
4. Staged rollout 10% → 25% → 50% → 100%, minimal 24 jam per tahap jika tidak ada P0/P1.
5. Pantau auth failure, function error, payment queue age, notification failure, CCTV session failure, dan crash-free users.

## 7. Rollback trigger

- Potensi kebocoran data/credential.
- Client dapat mengubah status paid/role/permission.
- Duplicate charge/bill atau korupsi masa aktif.
- Crash/login failure tinggi yang memblokir layanan inti.
- CCTV dapat diakses tanpa permission.

Rollback mencakup hentikan rollout, nonaktifkan fungsi/feature flag bermasalah, revoke session/token, restore bila perlu, dan tulis incident report.
