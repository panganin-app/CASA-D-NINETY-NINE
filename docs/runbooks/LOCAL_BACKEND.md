# Backend lokal

Keputusan pengguna: bangun dan uji backend lokal dahulu, baru staging/production Firebase.

## Menjalankan

Dari root proyek:

```sh
npm ci
npm --prefix backend/functions ci
npm test
npm run test:rules
npm run emulators
```

Butuh Node 22 dan Java 21. Launcher mendeteksi Homebrew openjdk@21 pada Mac ini; platform lain dapat mengisi JAVA_HOME. Semua port terikat pada loopback. Project selalu `demo-casa-local`; tidak membutuhkan project cloud atau service account.

| Layanan | Alamat |
|---|---|
| Emulator UI | http://127.0.0.1:4000 |
| Auth | 127.0.0.1:9099 |
| Firestore | 127.0.0.1:8080 |
| Functions | 127.0.0.1:5001 |
| Storage | 127.0.0.1:9199 |

Smoke test terisolasi: `npm run build` lalu `node scripts/emulators.mjs smoke`. Emulator otomatis berhenti sesudah test. Data belum diekspor/persisten; restart emulator menghapus data sesi.

## Implementasi tersedia

- Callable `getBillingCatalog`: Firebase Auth, pemeriksaan akun aktif, harga resmi dari server; App Check diwajibkan di luar emulator.
- Firestore: baca tagihan/subscription/payment hanya household sendiri; akun aktif diperlukan; seluruh write client ditolak.
- Storage: deny-all sampai alur upload tervalidasi dibuat.
- Fungsi domain penambahan satu bulan dengan timezone Jakarta dan clamp akhir bulan.
- Unit test, rules test, dan smoke test Auth → Function → Firestore.

## Riwayat batas tahap awal (sudah diperluas di bawah)

Belum tersedia pembuatan tagihan, upload/approval bukti, konfigurasi rekening, seed pengurus, notifikasi, atau backend modul community/CCTV. Rekening IPL dan internet harus terpisah mengikuti keputusan pengguna. Pada fondasi awal nomor asli belum disimpan; konfigurasi lokal sekarang dijelaskan pada update di bawah.

Jangan deploy rules awal ini sebagai backend lengkap: admin belum memiliki operasi pengelolaan dan Storage masih menolak semua akses.

## Migrasi nanti

Source Cloud Functions dan rules lokal akan digunakan kembali untuk staging. Project cloud, rekening, secrets, IAM, App Check, indexes, dan integrasi layanan harus dikonfigurasi serta diuji ulang. Emulator tidak membuktikan IAM atau keamanan production.

Acuan: https://firebase.google.com/docs/emulator-suite/install_and_configure

## Update 8 Oktober — billing dan proof

Callable tersedia di region `asia-southeast2`:

| Operasi | Payload | Hak akses |
|---|---|---|
| getMyHousehold | `{}` | Warga aktif, rumah aktif |
| createBill | `{kind:'ipl', houseId, period:'YYYY-MM'}` | Committee/Super Admin |
| createBill | `{kind:'internet', houseId, period, packageId, requestId}` | Kepala keluarga rumah sendiri |
| getPaymentInstructions | `{kind, billId}` | Warga aktif pada rumah tagihan |
| uploadPaymentProof | `{kind, billId, imageBase64}` | Pemilik tagihan; JPG/PNG maksimum 5 MB, 16 juta piksel |
| getPaymentProof | `{proofId}` | Pemilik bukti atau pengurus aktif |
| submitPayment | `{kind, billId, proofId, requestId}` | Pemilik tagihan; bukti harus divalidasi server |
| verifyPayment | `{kind, paymentId, decision, reason?}` | Pengurus, dilarang verifikasi pembayaran sendiri |

`kind` hanya `ipl` atau `internet`. Payload amount/status/role dari client tidak diterima pada operasi mutasi. Request ID harus stabil saat retry. Transaksi Firestore mengunci pembayaran pending dan approval; audit serta notification outbox ditulis dalam transaksi yang sama. Outbox belum mempunyai dispatcher FCM.

IPL memakai identitas deterministik rumah+periode. Internet hanya menerima satu tagihan terbuka per rumah; pembayaran yang disetujui memperpanjang satu bulan kalender dan menghasilkan PENDING_ACTIVATION. Belum ada kontrol router atau endpoint aktivasi manual.

Bukti di-decode dan di-encode ulang menjadi JPEG tanpa metadata sebelum disimpan. Maksimal lima percobaan upload per pengguna per menit. Semua client read/write Storage langsung tetap ditolak; akses bukti melalui callable. Jangan menjadikan payload bukti bagian dari log. Proses cleanup orphan akibat crash belum dijadwalkan.

### Akun uji lokal

Jalankan `npm run seed:local` saat emulator standar aktif. Script membuat tiga akun sintetis (resident, resident rumah lain, committee) dengan password acak yang disimpan hanya di `.local/seed-credentials-*.json` berizin 0600. Akun yang sudah ada dipertahankan. Script hanya menggunakan alamat loopback dan demo project.

Rekening terpisah berada di `.local/payment-config.json` berizin 0600, dikecualikan oleh `.gitignore`. Seed menyalinnya ke collection backend-only `payment_config/ipl` dan `payment_config/internet`. File ini mengandung nomor asli: jangan commit, lampirkan ke issue, atau pakai sebagai fixture. Tanpa konfigurasi, instruksi pembayaran gagal tertutup dengan failed-precondition. File akun dan rekening adalah plaintext lokal berizin terbatas, bukan secret manager production.

### Pengujian billing terisolasi

`npm run test:billing` membangun kode lalu menjalankan project `demo-casa-billing` pada port berbeda, tanpa menghapus data demo utama. Pengujian mencakup concurrency, retry, reject/resubmit, nominal, ownership, periode, Storage privat, validasi gambar, dan endpoint HTTP. Konfigurasi sementara `.firebase.test.local.json` tidak masuk Git.

Batas: provisioning production, due-date policy, worker notifikasi, aktivasi manual, pengelolaan warga oleh admin, quota global, dan audit production belum selesai.

## Update operasional admin — 8 Oktober 2026

| Callable | Payload | Perilaku |
|---|---|---|
| createHouse | `{houseId, block, houseNumber}` | Committee/Super Admin; ID dan alamat unik; retry tidak membuat rumah kedua |
| registerResident | `{residentUid, houseId, fullName, isHead}` | Akun Firebase Auth harus sudah ada; role hanya resident; satu kepala keluarga per rumah |
| setResidentActive | `{residentUid, active, reason}` | Hanya akun resident; alasan wajib; role pengurus tidak dapat diubah melalui endpoint ini |
| activateInternetService | `{houseId, paymentId, requestId, reason}` | Pembayaran terakhir harus APPROVED, rumah/warga aktif, subscription menunggu aktivasi dan belum expired |
| listAdminRecords | `{resource, limit?, afterId?}` | Resource houses/residents/ipl_payments/internet_payments; limit 1–50; antrean payment hanya PENDING_VERIFICATION |

Aktivasi manual hanya mencatat konfirmasi teknisi/pengurus. Tidak memanggil router, tidak memperpanjang activeUntil, dan memiliki request ID serta audit atomik. Retry dengan request ID dan payload yang sama mengembalikan hasil lama; payload berubah ditolak. Penonaktifan warga memblokir akses domain melalui pengecekan active di backend/rules; belum menonaktifkan Firebase Auth atau merevoke refresh token.

Pendaftaran tidak memindahkan warga yang sudah terdaftar antar-rumah dan tidak mengganti kepala keluarga lama. Perubahan hunian/pemilik membutuhkan workflow migrasi yang belum dibuat. Tidak ada pembuatan credential lewat endpoint ini; proses signup/provision Auth terpisah.

List admin memakai projection field yang eksplisit dan pagination berdasarkan document ID. Antrean ini belum diurutkan berdasarkan usia pembayaran. Nomor rekening, payload bukti, email/nomor telepon tidak dimasukkan ke respons list.

### Data emulator tersimpan

Launcher `npm run emulators` kini memiliki `--export-on-exit .local/emulator-data`, lalu memuat export tersebut pada start berikutnya jika metadata tersedia. Penyimpanan terjadi saat shutdown normal (Ctrl+C); force-kill tidak menjamin export. Emulator yang sudah berjalan sebelum perubahan launcher perlu memakai launcher baru pada sesi berikutnya. Mekanisme import/export belum diuji restore pada tahap ini.

Direktori `.local` berizin 0700 dan dikecualikan Git. Export Auth/database mengandung data lokal; perlakukan sebagai data privat. Saat data belum mempunyai export, `npm run seed:local` dapat menyiapkan ulang akun sintetis dan rekening lokal.

## Komunitas, inbox, dan batch IPL — 8 Oktober 2026

| Callable | Payload | Batas akses |
|---|---|---|
| saveCommunityContent | `{type, contentId, title, description, status, expectedVersion, startsAt?, endsAt?, location?}` | Pengurus; type announcements/events; status DRAFT/PUBLISHED/ARCHIVED; optimistic version |
| listPublishedContent | `{type, limit?, afterId?}` | Akun aktif; hanya PUBLISHED |
| createResidentReport | `{requestId, category, title, description}` | Akun aktif dengan rumah aktif; ownership diambil dari backend |
| updateReportStatus | `{reportId, status, expectedVersion, reason, requestId}` | Pengurus; transisi tervalidasi; audit dan outbox atomik |
| markNotificationRead | `{notificationId}` | Pemilik inbox aktif; retry tidak mengganti readAt |
| reconcileNotifications | `{limit?, afterId?}` | Pengurus; kirim ulang outbox secara bounded, idempotent |
| generateMonthlyIpl | `{period, limit?, afterId?}` | Pengurus; periode YYYY-MM; nominal tetap Rp100.000 |

Agenda memakai startsAt/endsAt ISO UTC dengan endsAt setelah startsAt. Deskripsi adalah plain text: UI harus merender sebagai teks, bukan HTML mentah. Pengurus dapat membaca draft dan laporan melalui listAdminRecords resource announcements/events/reports; warga membaca laporan miliknya lewat Firestore query residentId == UID. Query feed wajib filter status == PUBLISHED; query report_events dan notifications wajib filter residentId == UID. Client write tetap ditolak untuk semua collection.

Kategori laporan: FACILITIES, SECURITY, CLEANLINESS, ENVIRONMENT, INTERNET, OTHER. Alur: SUBMITTED → IN_REVIEW → IN_PROGRESS → RESOLVED → CLOSED. SUBMITTED/IN_REVIEW dapat REJECTED, lalu CLOSED. Alasan dan expectedVersion wajib; requestId retry harus memakai payload identik. Upload lampiran laporan belum dibuat; attachments selalu kosong. Rate limiting seluruh API laporan/konten belum diterapkan.

Trigger dispatchInAppNotification mengonsumsi notification_outbox dan membuat satu notifications/{outboxId}. Retry trigger/reconcile tidak membuat inbox kedua. Field deliveryStatus terpisah dari status domain legacy: DELIVERED atau HELD_INACTIVE. Akun nonaktif ditahan; setelah aktif lagi, pengurus dapat reconcile (iterate nextCursor hingga null). Outbox baru otomatis diproses; outbox lama sebelum trigger tersedia perlu reconcile. Inbox tidak mengandung nomor rekening atau gambar bukti. Ini IN_APP, bukan FCM/push notification dan bukan bukti pengiriman ke perangkat.

Batch IPL memindai maksimal 50 rumah per call (default 25), cursor document ID. Panggil ulang menggunakan nextCursor sampai null. Rumah nonaktif/tanpa kepala keluarga aktif dilewati. Tagihan lama, termasuk PAID, tidak direset dan tidak diduplikasi. Gangguan di tengah batch dapat dipulihkan dengan retry; satu batch bukan transaksi lintas seluruh rumah. Tidak ada clock scheduler otomatis atau due-date/OVERDUE policy pada tahap ini; tanggal jatuh tempo belum ditetapkan.
