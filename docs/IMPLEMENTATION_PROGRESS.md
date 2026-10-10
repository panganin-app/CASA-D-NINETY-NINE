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
