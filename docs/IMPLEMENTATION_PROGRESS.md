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

## 10 Oktober 2026 — Mobile app (Flutter) scaffold: auth + home + routing, DITES NYATA di iOS Simulator

Folder project di-**rename** dari `CASA D'NINETY NINE` -> `CASA DNINETY NINE` (apostrof dihilangkan) atas keputusan Leo -- `flutter test`/`flutter run` GAGAL TOTAL di path dengan apostrof (bug tooling Flutter: path di-embed mentah ke string literal Dart tanpa escape, ketauan pas nyoba run pertama kali). Git history & remote GitHub TIDAK terdampak (cuma rename folder lokal).

**BUG SERIUS ketemu & diperbaiki SEBELUM sempat nyangkut diam-diam**: root `.gitignore` punya pola bare `lib/` (buat exclude `backend/functions/lib/`, hasil compile TypeScript) -- pola tanpa leading slash itu match SEMUA folder bernama `lib` di mana pun, termasuk `apps/mobile/lib/` yang isinya SELURUH source code Flutter (main.dart, semua screen, provider). Ketauan pas `git status` nunjukkin `apps/mobile/lib/` gak ada di untracked list padahal baru ditulis banyak file. Fix: ganti jadi `/backend/functions/lib/` (path absolut + spesifik).

- `flutter create` (org `com.casadninetynine`, project `casa_resident`) + paket: `flutter_riverpod` (Riverpod **3.x**, BUKAN 2.x -- API `AsyncValue.valueOrNull` sudah gak ada, ganti `.value`), `go_router`, `firebase_core/auth/firestore/functions/storage`.
- `scripts/generate-design-tokens.js` (BARU): baca `packages/design_tokens/tokens.json`, hasilkan `lib/core/theme/casa_tokens.dart`. SEMUA 7 kategori top-level (color/font/spacing/radius/elevation/motion/layout) diverifikasi gak ada yang keskip diam-diam (gagal keras kalau ada). `elevation` di-parse jadi `BoxShadow` Dart beneran (bukan string CSS mentah), `motion` jadi `Duration`. `npm run generate:tokens`.
- `lib/core/network/firebase_emulator.dart`: SEMUA SDK Firebase diarahkan ke Emulator Suite lokal (host sama dgn `firebase.json` root) -- belum ada project Firebase production (lihat `firebase_options.dart`, placeholder jelas ditandai).
- Auth: email+password (satu-satunya bukti konkret skema auth dari `scripts/seed-local.mjs`, PRD §8.1 cuma nulis "Login" generik). `AuthRepository`, `authStateProvider` (StreamProvider), `LoginScreen`.
- Home (PRD §5.2, SEBAGIAN): greeting (baca `users/{uid}` LANGSUNG via Firestore client SDK, rules sudah izinin baca punya sendiri -- gak perlu callable baru), nomor rumah (`getMyHousehold` callable), pengumuman terbaru (`listPublishedContent`), quick actions ke 4 route lain. BELUM: status IPL, agenda terdekat, notification indicator (nunggu fitur/provider masing-masing).
- Routing (GoRouter, PRD §9.4): protected -- redirect ke `/login` kalau belum login, `/home` kalau udah login & masih di `/login`. IPL/CCTV/Informasi/Profile = `ComingSoonScreen` (placeholder jujur, bukan UI final) biar app bisa dinavigasi end-to-end penuh walau sebagian besar fitur belum dibangun.
- Test: `casa_tokens_test.dart` (verifikasi generator), `widget_test.dart` (LoginScreen -- validasi field kosong). `flutter analyze`: 0 masalah. `flutter test`: 2/2 PASS.
- **DITES NYATA di iOS Simulator** (iPhone 18 Pro, bukan cuma baca kode/analyze): build iOS PERTAMA KALI (96.3s, SPM fetch Firebase dependencies) -- app **crash on launch** (`FirebaseInstallations`: `FirebaseOptions.APIKey` harus 39 karakter & mulai huruf `A`, placeholder awal `'demo-local-emulator-only'` gak lolos validasi FORMAT yang jalan SEBELUM redirect ke emulator sempat dieksekusi). Fix: pakai string 39-karakter format-valid (`AIzaSyDemoLocalEmulatorOnlyNotARealKey1`) yang TETAP gak pernah nyentuh Firebase Installations API asli. Build ulang -> **LoginScreen render sempurna** (screenshot dikonfirmasi: warna navy sesuai token, form Email/Kata Sandi, tombol Masuk) -- dikonfirmasi via screenshot, bukan asumsi dari log.
- CI: job `mobile` baru (`flutter analyze` + `flutter test` di Ubuntu runner -- Dart-level doang, BUKAN build iOS/Android asli yang butuh runner macOS) + step regenerate+diff token (nangkep kasus `tokens.json` diubah tapi lupa regenerate). Job `admin` tetap belum ada (`apps/admin` masih 0 kode).
- Build TypeScript PASS (backend gak disentuh batch ini, tetap dicek ulang buat mastiin gak ada regresi gak sengaja). npm test: 4/4 unit PASS. npm run test:billing: 38/38 PASS.
- BELUM dites: login beneran end-to-end (ketik email/password, tap tombol, verifikasi redirect ke Home dgn data asli dari emulator) -- butuh orkestrasi emulator+seed+interaksi UI (tap/type) yang di luar kapasitas sesi ini (cuma bisa screenshot pasif, gak ada tool buat simulasikan tap/ketik di simulator). Leo perlu coba sendiri: `npm run emulators` (root) lalu `flutter run` (apps/mobile), login pakai akun dari `npm run seed:local`.
- Belum: 7 dari 8 bagian Home PRD (IPL/CCTV/Pengumuman/Agenda/Laporan/Keuangan/Profile) -- masih `ComingSoonScreen`; app icon custom (masih ikon Flutter default); M6 CCTV; UI admin web (masih nol); semua item M7/M8 yang belum dari entri sebelumnya.
- CI (push berikutnya, fix gitleaks): gitleaks SEMPAT GAGAL -- apiKey placeholder (`AIzaSyDemoLocalEmulatorOnlyNotARealKey1`) match rule `gcp-api-key` bawaan gitleaks (konsekuensi dari sengaja diformat valid biar Firebase SDK gak crash). `.gitleaks.toml` baru (extend ruleset default + allowlist exact-string buat 1 placeholder itu doang, BUKAN pola longgar -- deteksi secret asli tetap penuh). Diverifikasi lokal (`gitleaks detect`) sebelum push ulang. Semua 5 job CI akhirnya hijau.

## 10 Oktober 2026 — App icon & nama app (Casa D'Ninety Nine), project dibuka di Android Studio

- Icon app SEBELUMNYA ikon Flutter default. Logo resmi (`assets/brand/casa-dninetynine-logo-official-no-tagline.png`) ikut wordmark teks "CASA D'NINETY NINE" -- gak kebaca di ukuran icon kecil, jadi di-crop manual (`sharp`) jadi cuma mark house+99+leaf, di-trim whitespace, dipadding ~16% ke kanvas persegi 1024x1024 putih -> `apps/mobile/assets/icon/app_icon.png` (sumber tunggal, commit-able, bisa di-crop ulang kalau logo berubah).
- `flutter_launcher_icons` (dev dependency baru) generate SEMUA ukuran iOS (`Icon-App-*.png`, termasuk beberapa ukuran yang SEBELUMNYA gak ada: 50x50, 57x57, 72x72) dan Android (mipmap semua densitas + adaptive icon `drawable-*dpi/ic_launcher_foreground.png` + `mipmap-anydpi-v26/ic_launcher.xml` + `colors.xml` background putih baru). `apps/mobile/flutter_launcher_icons.yaml` nyimpen config-nya (`dart run flutter_launcher_icons` buat regenerate kalau logo ganti lagi).
- Nama app: iOS `CFBundleDisplayName` (label di home screen) diganti "Casa D'Ninety Nine" (`CFBundleName` internal dibiarkan `casa_resident`, gak ada alasan ganti -- dipakai internal build, bukan user-facing). Android `android:label` di `AndroidManifest.xml` diganti "Casa D'Ninety Nine" juga. Desktop (macOS/Linux/Windows) SENGAJA TIDAK disentuh -- di luar scope (Leo minta Android Studio + icon, bukan desktop).
- Icon dicek visual langsung dari file hasil generate (`mipmap-xxxhdpi/ic_launcher.png`) -- bersih & jelas kebaca walau di ukuran kecil. TIDAK di-rebuild ulang ke simulator buat verifikasi (permintaan Leo: "ga perlu kamu yang compile").
- Project dibuka di Android Studio (`open -a "Android Studio" apps/mobile`) -- Leo build manual dari situ sendiri.
- `flutter analyze`: 0 masalah. `flutter test`: 2/2 PASS (tidak berubah).
- Belum: icon buat desktop (macOS/Linux/Windows) & web gak disentuh; splash screen belum pakai logo (masih default putih polos pas app pertama kali buka, keliatan di screenshot sesi sebelumnya).

## 10 Oktober 2026 — M6 CCTV: keputusan arsitektur disederhanakan (hand-off Hik-Connect), BUKAN integrasi API resmi

**PERUBAHAN ARSITEKTUR dari PRD §19** (keputusan Product Owner 10 Okt 2026, bukan Change Request formal -- dicatat di sini): integrasi API resmi Hikvision (ISAPI/HikCentral OpenAPI/Hik-Connect TPP) butuh daftar developer di `tpp.hikvision.com`, approval AK/SK dari Hikvision (BUKAN self-service instan), dan router Casa sendiri sebagai "Streaming Gateway" -- dinilai kemahalan buat kebutuhan sekarang. Diganti pendekatan **hand-off ke app Hik-Connect**:

- Pengurus share kamera ke warga LANGSUNG lewat fitur bawaan Hik-Connect ("Manage Sharing Settings", undang via email akun Hik-Connect, atur permission live view/playback/PTZ per kamera) -- DI LUAR sistem Casa sepenuhnya.
- App Casa TIDAK punya `cctv_channels`/`cctv_permissions`/streaming gateway sendiri. Menu CCTV cuma instruksi 4 langkah (install Hik-Connect -> buat akun -> hubungi pengurus -> accept undangan) + tombol buka App Store/Play Store.
- **Trade-off yang SENGAJA diterima**: akses CCTV gak tercatat di `audit_logs` Casa; `transferHouse`/`setResidentActive` (sudah dibangun, nonaktifkan warga di sistem Casa) **TIDAK ikut mencabut** sharing Hik-Connect -- pengurus harus cabut manual di Hik-Connect kalau ada warga pindah/nonaktif. Ini bukan bug, keputusan sadar demi kecepatan -- bisa di-upgrade ke integrasi API resmi nanti kalau kontrol terpusat jadi kebutuhan nyata.
- `CctvScreen` (ganti `ComingSoonScreen`): link toko aplikasi iOS pakai App Store ID Hik-Connect asli yang terverifikasi (`id1087803190`), Android pakai LINK PENCARIAN Play Store (bukan tebak package ID -- lebih aman). Paket baru `url_launcher`.
- SENGAJA TIDAK ada deep-link ke kamera tertentu di Hik-Connect -- Hikvision gak dokumentasikan URL scheme/intent buat itu, daripada nebak dan kemungkinan gak jalan, cukup tombol buka app/toko biasa.
- Admin Web TIDAK perlu bangun apa pun buat CCTV sama sekali sekarang (sharing dikelola native di Hik-Connect) -- M6 scope buat Admin Web jadi kosong/dihapus dari rencana sampai ada keputusan upgrade ke integrasi resmi.
- `flutter analyze`: 0 masalah. `flutter test`: 3/3 PASS (naik dari 2 -- 1 widget test baru buat CctvScreen).
- M6 CCTV sekarang **SELESAI** sesuai keputusan baru ini (bukan ditunda lagi) -- beda dari rencana awal PRD §19 yang butuh integrasi API + gateway custom.

## 10 Oktober 2026 — Mobile: fitur IPL (daftar tagihan, instruksi BCA, upload bukti)

- **Alur**: daftar tagihan (`/ipl`) -> detail (`/ipl/:id`) -> instruksi transfer BCA dari backend (`getPaymentInstructions`, nomor rekening TIDAK di-hardcode di client) -> pilih foto bukti -> `uploadPaymentProof` (backend validasi & re-encode gambar) -> `submitPayment` dengan `requestId` sekali per sesi layar (retry tidak bikin pembayaran dobel).
- **Baca data**: daftar tagihan dibaca langsung dari Firestore `ipl_bills` (rules sudah membatasi ke rumah sendiri). Semua aksi tulis lewat Cloud Functions, client TIDAK PERNAH set status `PAID` (sesuai aturan bisnis).
- **Index baru**: `ipl_bills` (`houseId` ASC, `period` DESC) ditambahkan ke `firestore.indexes.json` -- query daftar tagihan butuh ini.
- **Paket baru**: `image_picker` (pilih foto bukti dari galeri).
- Status tagihan ditampilkan sebagai chip berwarna; tombol kirim hanya muncul untuk tagihan UNPAID/OVERDUE.
- `flutter analyze`: 0 masalah. `flutter test`: 7/7 PASS (termasuk unit test model: pemetaan status, aturan `canPay`, format rupiah).
- **BELUM dites end-to-end** (pilih foto -> upload -> submit di simulator dengan data emulator). Perlu Leo jalankan sendiri: `npm run emulators`, `npm run seed:local`, lalu `flutter run`.
- Belum: Pengumuman, Agenda, Laporan, Keuangan, Profil di mobile masih placeholder.

## 10 Oktober 2026 — Mobile: fitur Laporan warga (buat & riwayat)

- **Alur**: riwayat laporan (`/reports`, FAB "Buat Laporan") -> form (`/reports/new`: kategori, judul, deskripsi) -> `createResidentReport` (backend, idempotent via requestId sekali per sesi form).
- Riwayat dibaca langsung dari Firestore `reports` (rules membatasi ke `residentId == uid`), diurutkan `createdAt` terbaru. Client tidak pernah menulis `reports` langsung.
- Kategori tetap sama persis dengan backend (FACILITIES, SECURITY, CLEANLINESS, ENVIRONMENT, INTERNET, OTHER), label Indonesia di client.
- **Index baru**: `reports` (`residentId` ASC, `createdAt` DESC) di `firestore.indexes.json`.
- Status ditampilkan sebagai chip (Terkirim, Ditinjau, Diproses, Selesai, Ditolak, Ditutup).
- `flutter analyze`: 0 masalah. `flutter test`: 11/11 PASS (termasuk unit test pemetaan status, daftar kategori vs backend, dan label kategori).
- **BELUM dites end-to-end** di simulator. Lampiran foto laporan belum ada (backend belum menyediakannya).
- Belum: Pengumuman/Agenda (Informasi, masih placeholder), Keuangan, Profil, dan detail laporan (riwayat event status belum ditampilkan).

## 10 Oktober 2026 — Mobile: Informasi (Pengumuman & Agenda)

- Layar Informasi dengan dua tab (Pengumuman, Agenda), sesuai handoff UI/UX bagian Informasi.
- Data dibaca lewat callable `listPublishedContent` -- backend yang menyaring status PUBLISHED dan memaginasi hasil (`limit` + `afterId`). Client tidak pernah melihat draft atau arsip.
- Paginasi: halaman berikutnya dimuat saat daftar mendekati akhir; tarik untuk memuat ulang dari awal.
- Agenda menampilkan waktu mulai dan lokasi bila tersedia. Waktu yang tidak bisa diparse dibiarkan kosong supaya tampilan tidak gagal.
- Tidak ada index baru: query dilakukan backend, bukan client.
- `flutter analyze`: 0 masalah. `flutter test`: 16/16 PASS (termasuk unit test parsing pengumuman/agenda dan format waktu).
- **BELUM dites end-to-end** di simulator. Detail konten (layar baca penuh, bagikan, simpan agenda) belum dibuat -- saat ini daftar hanya menampilkan ringkasan.
- Belum: Keuangan, Profil, detail pengumuman/agenda, dan fitur simpan/bagikan dari handoff.

## 10 Oktober 2026 — Mobile: Keuangan (transparansi, data published)

- Layar `/keuangan`: pilih periode (dropdown dari periode yang dipublikasikan, default terbaru), kartu pemasukan / pengeluaran / selisih, dan daftar transaksi periode itu.
- Data dibaca lewat callable `listFinancePublications`. Backend hanya mengirim periode yang sudah dipublikasikan, dan client TIDAK menghitung ulang total dari transaksi, jadi angka yang tampil sama persis dengan yang dipublikasikan pengurus.
- Format rupiah memakai helper yang sama dengan IPL.
- `flutter analyze`: 0 masalah. `flutter test`: 19/19 PASS (termasuk unit test parsing periode dan transaksi).
- **Belum sesuai mockup sepenuhnya**: mockup `resident-finance-v1.png` menampilkan "Saldo Awal" dan "Saldo Akhir" serta diagram donat. Backend belum menyediakan saldo awal/akhir, jadi belum ditampilkan agar tidak menampilkan angka yang tidak dihitung backend. Diagram belum dibuat. Perlu keputusan: apakah saldo awal/akhir masuk ke ringkasan periode di backend.
- Keuangan saat ini berupa rute sendiri, belum masuk tab Informasi seperti di handoff. Perlu dipindah saat tab Informasi diubah.
- **BELUM dites end-to-end** di simulator.
- Belum: Profil (satu-satunya layar mobile yang masih placeholder), dan detail transaksi.

## 10 Oktober 2026 — Mobile: Profil (data warga, anggota keluarga, kendaraan)

- Layar `/profile`: header (inisial, nama, badge Kepala Keluarga, rumah), Data Warga (telepon bisa diubah, email kontak), daftar anggota keluarga, daftar kendaraan, dan tombol keluar.
- Data dibaca dari `users`/`residents` (rules membatasi ke pemilik) dan dari callable `listFamilyMembers`/`listVehicles`. Perubahan telepon lewat `updateResidentProfile` dengan `expectedVersion`; kalau versinya sudah usang, backend menolak dan app menampilkan pesannya.
- Placeholder `ComingSoonScreen` dihapus karena tidak dipakai lagi oleh rute mana pun. Semua layar resident sekarang sudah punya implementasi (walau belum diuji di simulator).
- `flutter analyze`: 0 masalah. `flutter test`: 25/25 PASS.
- **Belum dibangun dari mockup**: "Ubah PIN" dan "Perangkat Aktif" (auth saat ini email+password, tidak ada PIN; perangkat aktif tidak ada di backend). "Status Hunian" juga belum ada sebagai field. Hubungi Pengurus dan Kebijakan Privasi belum dibuat. Keluar sudah berfungsi.
- Anggota keluarga dan kendaraan masih read-only di app. Tambah/ubah/hapus lewat app belum dibuat (backend sudah siap).
- Email yang tampil adalah email login Firebase Auth. Field `email` di backend `residents` adalah kontak terpisah yang belum ditampilkan.
- **BELUM dites end-to-end** di simulator.

## 10 Oktober 2026 — Lupa kata sandi, ubah kata sandi, status hunian, hubungi pengurus, kebijakan privasi

- **Lupa kata sandi** (layar login): kirim tautan reset ke email lewat Firebase Auth. Pesan hasilnya SAMA apa pun (email terdaftar atau tidak) supaya tidak bisa dipakai menebak akun.
- **Ubah kata sandi** (Profil > Akun): verifikasi kata sandi lama (reauthenticate, syarat Firebase), minimal 8 karakter, harus beda dari yang lama. Keputusan Leo 10 Okt 2026: tidak ada PIN, akun memakai email + kata sandi saja (menggantikan "Ubah PIN" di mockup).
- **Status hunian** (backend `setHouseOccupancy`, committee/super_admin saja, idempoten, audit): OWNER (milik sendiri) atau RENTER (sewa/kontrak). Warga TIDAK bisa mengklaim sendiri. Ditampilkan read-only di Profil ("Belum diatur pengurus" kalau kosong). `getMyHousehold` sekarang mengembalikan `occupancyType`.
- **Hubungi pengurus**: daftar kontak (Ketua, Keuangan/Bendahara, Keamanan) dengan tombol Telepon dan WhatsApp. **Nomor BELUM diisi** -- layar menampilkan "Nomor belum tersedia" dan tidak menampilkan nomor palsu. Nomor diisi di `lib/core/config/contact_config.dart`.
- **Kebijakan privasi**: DRAFT, ditandai jelas di layar. Isinya merangkum data yang benar-benar dikumpulkan app. Jangka waktu penyimpanan dan alamat email privasi masih placeholder `[DRAFT: ...]`, dan belum boleh dipublikasikan ke toko aplikasi sebelum ditinjau.
- Tidak dibuat: "Perangkat Aktif" (tidak ada datanya di backend).
- Backend: `occupancy.integration.cjs` (3 test). Emulator suite: 41/41 lulus.
- Mobile: analyze bersih, 30/30 test lulus.
- **BELUM dites end-to-end** di simulator.
- Belum ada UI untuk pengurus mengatur status hunian di mobile; ini dikerjakan lewat Admin Web (belum dibangun).

## 10 Oktober 2026 — Lanjutan: admin (pengumuman, internet, pengaturan) dan tagihan internet di app

- **Admin web**: halaman Pengumuman & Agenda (buat, ubah, status Draft/Terbit/Arsip; agenda dengan waktu & lokasi), Layanan Internet (daftar langganan, aktivasi manual dari pembayaran yang sudah disetujui, perbarui status masa aktif), dan Pengaturan Sistem (hanya Super Admin dapat mengubah; pengurus biasa hanya melihat).
- **Backend**: `listAdminRecords` menerima resource `internet_subscriptions` (pengurus saja). Tes baru: `internet-admin.integration.cjs`. Emulator suite 42/42.
- **App warga**: tagihan internet sekarang ada. Layar Internet menampilkan status langganan dan tagihan internet. Kepala keluarga memilih paket (harga dari `getBillingCatalog`) lalu membuat tagihan (`requestId` acak per sesi). Alur bayar sama dengan IPL.
- Struktur kode: `features/ipl` digabung ke `features/tagihan` (model, repository, provider, detail) dengan `BillKind` (IPL/internet), sehingga satu alur dipakai dua jenis tagihan. Format rupiah dipindah ke `shared/format`.
- Tombol Internet ditambahkan di Beranda.
- Perbaikan kecil: generator token menulis CSS admin, output Dart tidak berubah.
- `flutter analyze`: 0 masalah. `flutter test`: 33/33 PASS. `tsc`: bersih. Build statis admin: 12 halaman.
- **Belum dites langsung di browser/simulator** setelah perubahan ini (lihat `docs/runbooks/PUBLISH_LOCAL.md`).
