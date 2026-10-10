# Progres implementasi

## 8 Oktober 2026 — Fondasi backend lokal

Status: M1 sebagian selesai. Belum deployment ke Firebase cloud.

- Konfigurasi Auth/Firestore/Functions/Storage Emulator Suite menggunakan demo project dan loopback.
- Cloud Functions TypeScript Node 22, dependency dipin dengan lockfile.
- Endpoint katalog biaya dengan Auth dan akun aktif.
- Aturan Firestore ownership read-only, Storage deny-all.
- Perhitungan renewal kalender Jakarta.
- Build TypeScript lulus; empat unit test lulus.
- Tiga security rules test lulus di Firestore Emulator, termasuk akses lintas rumah, PAID, role, audit, anonymous, dan disabled account.
- Smoke test seluruh emulator lulus: anonymous mendapat 401, akun tanpa profil aktif mendapat 403, resident aktif memperoleh katalog resmi. Auth, Functions, Firestore, dan Storage berhasil dimulai lalu dihentikan otomatis.
- Audit keamanan menyeluruh belum dilaksanakan. Ini hanya bukti kontrol foundation tertentu.

Tahap berikutnya: seed akun/rumah lokal, tagihan server-side, konfigurasi rekening terpisah, proof upload, verifikasi atomik/idempotent, dan integration tests pembayaran.

Panduan: [LOCAL_BACKEND.md](runbooks/LOCAL_BACKEND.md).

## 8 Oktober 2026 — Billing lokal dan bukti transfer

- Seed warga/rumah sintetis serta committee lokal; credential acak dalam file lokal 0600.
- Rekening IPL/internet terpisah dikonfigurasi pada backend emulator; nilai tidak berada di source yang dilacak Git.
- Endpoint household, createBill, payment instructions, upload/read proof, submitPayment, verifyPayment.
- Pembuatan IPL deterministik per rumah/periode; tagihan internet terbuka dibatasi satu per rumah.
- Submit dan verifikasi atomik, audit, request retry, serta outbox notifikasi.
- Sanitasi gambar, batas ukuran/piksel, pembatasan upload, dan Storage privat.
- Belum: dispatcher FCM, aktivasi manual, UI admin/mobile, due-date policy, CRUD warga production, cleanup orphan, full security audit.
- Build TypeScript dan empat unit test lulus setelah implementasi billing.
- Empat integration test group lulus: transaksi IPL, transaksi internet, upload gambar/Storage, dan callable HTTP Auth/household/rekening. Endpoint Functions berhasil dimuat pada emulator terisolasi.
- Rekening lokal tersimpan hanya di file `.local/payment-config.json` berizin 0600 dan collection emulator backend-only. Data emulator masih perlu seed ulang setelah restart karena belum ada persistence export otomatis.
- Pemeriksaan akhir: 8/8 test integration + rules lulus. Bukti ringkas: `docs/security/evidence/local-billing/results.md`. Total bersama unit test: 12 test lulus; bukan full security sign-off.

## 8 Oktober 2026 — Operasional admin dan aktivasi manual

- `operations.ts`: createHouse, registerResident, setResidentActive, activateInternetService, listAdminRecords.
- Rumah unik berdasarkan ID dan block/houseNumber; retry tidak duplikat.
- Provision resident hanya untuk akun Auth yang sudah ada, role resident tetap, single household/head constraint.
- Aktivasi internet manual membutuhkan pembayaran APPROVED terbaru; audit/idempotency atomik; masa aktif tidak berubah.
- Listing admin berpaginasi dengan field terpilih, antrean hanya payment pending.
- Seed melengkapi `residents` untuk akun uji lama tanpa mereset password/aktif/role.
- Launcher emulator dikonfigurasi export-on-exit dan import pada sesi berikutnya; restore belum diuji.
- Build PASS; test:billing PASS 11/11 (6 kelompok integrasi, 5 rules tests). Unit test tetap 4.
- Belum selesai: transfer hunian, edit profil/kontak, anggota keluarga/kendaraan, provisioning Auth production, notification dispatcher, scheduler IPL, community, finance, CCTV, UI, full security audit.

## 8 Oktober 2026 — Komunitas, inbox, batch IPL

- Pengumuman/agenda: draft, publish, archive; validasi tanggal agenda; optimistic version; audit. Warga aktif hanya membaca published.
- Laporan warga: ownership dari profil backend, kategori tetap, create retry idempotent, alur status/alasan/version guard, history, audit, outbox atomik. Lampiran belum tersedia.
- Listing pengurus diperluas ke announcements/events/reports; tetap field projection dan pagination.
- Inbox IN_APP: trigger Firestore, deterministic ID, retry concurrent, penahanan akun nonaktif, reconcile admin, mark-read pemilik. Tidak mengirim FCM/push ke perangkat.
- Batch IPL bulanan admin dengan limit/cursor; menggunakan createBill Rp100.000 deterministik; retry tidak menggandakan/reset PAID. Scheduler clock dan due-date policy belum tersedia.
- Build TypeScript PASS. npm test: 4/4 unit PASS. npm run test:billing: 17/17 PASS (10 integration groups, 7 rules tests), termasuk delivery trigger emulator yang nyata. Total 21 tes lulus; bukan full security sign-off.
- Test memakai emulator terisolasi demo-casa-billing; tidak deploy ke cloud, tidak mentransfer uang, tidak memanggil router. Data demo utama tidak dihapus oleh suite.
- Tahap berikutnya: finance publication/ledger dan boundary CCTV; integrasi UI admin/mobile; lampiran laporan; rate limit semua endpoint; backup/restore drill; audit production. Scheduler IPL otomatis, push FCM, IAM/App Check production belum diverifikasi.

## 10 Oktober 2026 — Git init dan M5 Finance transparency (ledger, publish periode)

- Repo di-`git init` (sebelumnya belum ada version control sama sekali sejak 7/8 Okt) dan di-commit sebagai snapshot awal sebelum perubahan apa pun -- titik rollback valid pertama kali.
- `finance_transactions` (internal, HANYA Cloud Functions yang baca/tulis -- tidak ada rule client sama sekali, jatuh ke deny-all) dan `financePublications/{periodId}` (resident boleh baca kalau `status=='PUBLISHED'`, pola sama persis dengan `announcements`/`events`).
- Kategori tetap (keputusan Product Owner 10 Okt 2026): Income = IPL/INTERNET/DONASI/LAIN_LAIN; Expense = KEAMANAN/KEBERSIHAN/PERBAIKAN/LISTRIK_AIR_UMUM/ADMINISTRASI/LAIN_LAIN. Validasi kategori terikat ke tipe (INCOME/EXPENSE), tidak bisa campur.
- `saveFinanceTransaction`: catat (idempotent lewat requestId, ID deterministik) atau edit (optimistic version) transaksi committee/super_admin. `periodId` tidak bisa diubah lewat edit. Transaksi baru maupun edit DITOLAK (`failed-precondition`) kalau periode-nya sudah `PUBLISHED` -- integritas angka yang sudah diumumkan ke warga terjaga.
- `publishFinancePeriod`: hitung ulang total income/expense/net dari seluruh transaksi 1 periode (maks 500 transaksi/periode), tulis snapshot (tanpa identitas actor) ke `financePublications`. Retry dengan requestId SAMA idempotent (hasil & audit log sama, tidak dobel); requestId BARU = republish sah (recompute, naikkan version) -- dipakai kalau transaksi dikoreksi sebelum periode itu dipublish.
- `listFinancePublications`: siapa pun yang login (termasuk resident) boleh baca periode yang sudah published, paginated cursor sama seperti `listPublishedContent`.
- `listAdminRecords` diperluas (resource `finance_transactions`) buat committee review transaksi mentah sebelum publish.
- Firestore rules: `financePublications` baca kalau PUBLISHED; `finance_transactions` SENGAJA tanpa rule (deny-all) -- ini SATU-SATUNYA baris yang menegakkan boundary internal/published, diverifikasi lewat rules test (resident gak bisa baca `finance_transactions` sama sekali, gak bisa baca periode DRAFT, gak bisa tulis langsung ke manapun).
- Build TypeScript PASS. npm test: 4/4 unit PASS (tidak berubah). npm run test:billing: 23/23 PASS (15 integration groups + 1 rules test baru, naik dari 17). Total tes project: 27 lulus; bukan full security sign-off.
- Belum: UI admin/mobile buat Finance (publish/lihat ledger masih backend-only, dipanggil langsung lewat test); laporan periode custom (selain bulanan); lampiran bukti transaksi; M6 CCTV; semua item "belum" dari entri sebelumnya (rate limit, backup/restore drill, audit production, scheduler otomatis) masih berlaku.
- Repo di-push ke remote GitHub (`panganin-app/CASA-D-NINETY-NINE`, branch `main`).

## 10 Oktober 2026 — M2 selesai: edit profil, anggota keluarga, kendaraan, transfer hunian

- `updateResidentProfile`: resident edit phone/email milik sendiri (BUKAN fullName -- ganti nama legal di luar scope ini), optimistic version di `residents/{uid}`.
- `family_members` & `vehicles` (koleksi baru): CRUD penuh (create idempotent via requestId, edit version-guarded, remove = soft-delete `active:false` biar histori gak hilang), HANYA kepala keluarga (`isHead:true`) yang boleh kelola punya rumahnya sendiri. List otomatis exclude yang `active:false`.
- `transferHouse` (admin, `operations.ts`): skenario ganti penghuni TOTAL (dikonfirmasi Product Owner 10 Okt 2026) -- semua resident di rumah itu di-nonaktifkan (`users.active=false`, `residents.status=INACTIVE`), `family_members`/`vehicles` rumah itu ikut di-nonaktifkan (`active:false`, BUKAN dihapus) biar gak kecampur kalau rumahnya dipakai keluarga baru lewat `registerResident` seperti biasa, `houses.primaryResidentId` dikosongkan. Idempotent lewat requestId (pola `admin_operations` sama seperti `activateInternetService`).
- `listAdminRecords` diperluas (resource `family_members`, `vehicles`) buat committee review.
- Firestore rules baru: `residents/{uid}` (baca milik sendiri), `family_members`/`vehicles` (baca milik rumah sendiri DAN `active!=false`, pola `ownHouse()` yang sudah ada). Diverifikasi rules test: resident gak bisa baca punya rumah lain, gak bisa baca anggota keluarga/kendaraan yang sudah di-nonaktifkan, gak bisa tulis langsung ke mana pun.
- Build TypeScript PASS. npm test: 4/4 unit PASS (tidak berubah). npm run test:billing: 29/29 PASS (naik dari 23 -- 5 integration group baru + 1 rules test baru). Total tes project: 33 lulus; bukan full security sign-off.
- M2 sekarang LENGKAP sesuai gate arsitektur ("resident tidak dapat membaca atau mengubah data rumah lain") -- item "belum" M2 sebelumnya (transfer hunian, edit profil/kontak, anggota keluarga/kendaraan) semua tertutup. Provisioning Auth production tetap belum (di luar scope lokal/emulator).
- Belum: M6 CCTV (hardware Hikvision ada, tapi endpoint/kredensial API belum siap dari Product Owner -- ditunda, bukan dibatalkan); UI admin/mobile (masih nol); M7 sisanya (dashboard, audit log viewer, search/filter/pagination UI); rate limit; backup/restore drill; audit production.

## 10 Oktober 2026 — Due date policy, expiring-soon threshold, audit log viewer backend

- `system_settings/general` (baru): `iplDueDateDays` (default 10), `internetDueDateDays` (default 7), `internetExpiringSoonDays` (default 7) -- 2 item yang eksplisit ditandai "Configuration still required" di `INTERNET_PAYMENT_BLUEPRINT.md §10`, sebelumnya hard-coded/gak ada sama sekali. `getSystemSettings` (siapa pun login boleh baca), `updateSystemSettings` (SUPER_ADMIN SAJA -- bukan committee, pengaturan global lebih sensitif dari operasional harian, version-guarded).
- `createBill` (`billing.ts`) sekarang ISI `dueDate` -- SEBELUMNYA field ini gak pernah di-set sama sekali walau ada di skema PRD §13.4/13.5. IPL: tanggal ke-N bulan periode itu jam 23:59:59 WIB (terikat kalender). Internet: createdAt + N hari (relatif, bukan terikat periode).
- `listAuditLogs` (`operations.ts`, M7): committee/super_admin, filter opsional `action`/`resourceId`, urut `createdAt` DESC (BUKAN document ID -- audit_logs pakai auto-generated ID yang gak berurutan, beda dari koleksi lain di project ini yang pakai ID deterministik). Perlu composite index Firestore BARU (`firebase/firestore/firestore.indexes.json`, sebelumnya kosong) -- diverifikasi jalan di emulator (kalau index kurang, query ini gagal FAILED_PRECONDITION).
- `updateInternetSubscriptionStatuses` (`internet-lifecycle.ts`, baru, M3B): scanner manual/batch (pola sama `generateMonthlyIpl`) yang transisi `internet_subscriptions` ACTIVE<->EXPIRING_SOON<->EXPIRED berdasarkan `activeUntil` vs `internetExpiringSoonDays`. SENGAJA cuma nyentuh 2 status itu -- PENDING_ACTIVATION (nunggu aktivasi manual admin) dan SUSPENDED/TERMINATED (administratif) TIDAK PERNAH disentuh otomatis. Notifikasi ke `notification_outbox` pakai ID deterministik per (houseId,status) -- retry/re-run gak numpuk notifikasi dobel.
- Build TypeScript PASS. npm test: 4/4 unit PASS (tidak berubah). npm run test:billing: 38/38 PASS (naik dari 29 -- 9 integration test baru: 3 audit log, 3 system-settings+dueDate, 3 internet-lifecycle). Total tes project: 42 lulus; bukan full security sign-off.
- Scheduler OTOMATIS (Cloud Scheduler trigger buat `updateInternetSubscriptionStatuses`/`generateMonthlyIpl` jalan sendiri tiap hari/bulan) MASIH BELUM dipasang -- kedua fungsi ini tetap manual/callable-triggered sampai infra production siap (sama alasan seperti `generateMonthlyIpl` sebelumnya).
- Belum: M6 CCTV (ditunda); UI admin/mobile (masih nol); M7 sisanya (dashboard, search/filter/pagination UI -- backend-nya `listAdminRecords`/`listAuditLogs` udah ada, tinggal disambung UI); rate limit; audit production; Cloud Scheduler production.

## 10 Oktober 2026 — CI pipeline, dependency audit, backup/restore drill (M8)

- `.github/workflows/ci.yml` (BARU -- Task 7 di plan M0/M1 lama SEBELUMNYA gak pernah beneran dibuat, `.github/workflows/` kosong total sampai hari ini). 4 job: `backend` (install+build+unit test), `emulator-suite` (`npm run test:billing`, 38 test rules+integration), `dependency-audit`, `secret-scan` (gitleaks). Job admin/mobile SENGAJA belum ditambah -- `apps/admin`/`apps/mobile` masih 0 baris kode, job bakal selalu gagal kalau ditambah sekarang.
- Dependency audit dicek manual dulu (`npm audit --audit-level=high`) sebelum dijadikan gate CI: `backend/functions` (kode yang BENERAN dideploy) bersih di level high/critical -> dijadikan BLOCKING di CI. Root (`firebase-tools`/`firebase` SDK, dev tooling lokal doang) ada 16 kerentanan (4 moderate, 12 high) tapi SEMUA di jalur proxy/network-client firebase-tools yang gak kepake buat jalanin emulator lokal, dan fix-nya (`npm audit fix --force`) minta downgrade `firebase-tools` ke 14.23.0 (breaking) -- SENGAJA TIDAK dipaksa, CI cuma informational (`continue-on-error`) buat root, sama prinsip kehati-hatian dengan project Panganin lain (jangan force-upgrade tooling yang lagi jalan baik).
- `scripts/backup-restore-drill.mjs` (BARU): orkestrasi end-to-end NYATA -- start emulator terpisah (`demo-casa-drill`, port sendiri lewat config sementara di root, BUKAN di `.local/` -- sempat gagal duluan gara-gara itu, path `rules` di firebase.json ke-resolve relatif ke lokasi `--config`) -> seed data dengan marker unik -> stop (trigger `--export-on-exit`) -> verifikasi folder export beneran ada -> start BARU dengan `--import` (simulasi restore pasca-disaster) -> verifikasi data yang diimport cocok persis -> cleanup. `npm run drill:backup-restore`. DIJALANKAN BENERAN (bukan cuma baca kode) dan BERHASIL -- membuktikan konfigurasi export-on-exit/import yang dipakai sesi emulator dev Leo sehari-hari (`npm run emulators`) memang menyelamatkan data secara akurat.
- Build TypeScript PASS. npm test: 4/4 unit PASS. npm run test:billing: 38/38 PASS (tidak berubah, batch ini infra/CI doang, bukan fitur baru). `npm run drill:backup-restore`: BERHASIL.
- Belum: M6 CCTV (ditunda); UI admin/mobile (masih nol, job CI-nya juga belum ada); M7 sisanya (dashboard, search/filter/pagination UI); rate limit per endpoint (butuh keputusan Leo soal batas wajar); export data (butuh keputusan Leo soal diaktifkan atau tidak); "administrative recovery yang terkontrol" (PRD gak rinci skenarionya); audit production; Cloud Scheduler production (job terjadwal otomatis, bukan manual-trigger).
