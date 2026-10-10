# CASA D'NINETY NINE — Struktur Implementasi Hulu ke Hilir

**Versi:** 1.0  
**Acuan:** CASA D'NINETY NINE PRD v1.1  
**Tujuan:** Menjadi struktur kerja teknis dari persiapan sampai aplikasi siap dipublikasikan.

---

## 1. Outcome akhir

Sistem dinyatakan siap publish apabila seluruh keluaran berikut tersedia dan lulus gate:

1. Resident Mobile App Flutter siap Android dan iOS.
2. Admin Web Next.js siap production deployment.
3. Backend Firebase production terkonfigurasi aman.
4. Pembayaran IPL melalui transfer BCA dan verifikasi manual berjalan end-to-end.
5. Streaming CCTV melewati authenticated secure gateway.
6. Firestore Rules, Storage Rules, RBAC, App Check, audit log, dan rate limiting sudah diuji.
7. Monitoring, backup, restore, incident response, dan rollback tersedia.
8. UAT bisnis, pembayaran, keamanan, admin, dan CCTV telah ditandatangani.
9. Store assets, privacy policy, release notes, dan metadata publikasi sudah lengkap.
10. Production smoke test selesai tanpa isu kritis.

---

## 2. Alur besar dari hulu ke hilir

```text
PRD & Design Freeze
        ↓
Requirement Traceability + Acceptance Criteria
        ↓
UX/UI + Design System + API/Data Contracts
        ↓
Environment & Repository Foundation
        ↓
Firebase Auth + RBAC + Security Rules
        ↓
Core Data + Cloud Functions + Audit
        ↓
Resident Mobile + Admin Web
        ↓
IPL/BCA + Community + Finance + CCTV
        ↓
Unit + Integration + Security + E2E Tests
        ↓
Staging + UAT + Performance/Operational Readiness
        ↓
Production Provisioning + Data Migration
        ↓
Android/iOS/Admin Web Publication
        ↓
Monitoring + Backup + Incident Response + Maintenance
```

---

## 3. Struktur monorepo target

```text
casa-dninetynine/
├── apps/
│   ├── mobile/                         # Flutter
│   │   ├── android/
│   │   ├── ios/
│   │   ├── assets/
│   │   ├── integration_test/
│   │   ├── test/
│   │   └── lib/
│   │       ├── app/
│   │       │   ├── bootstrap/
│   │       │   ├── routing/
│   │       │   └── app.dart
│   │       ├── core/
│   │       │   ├── config/
│   │       │   ├── errors/
│   │       │   ├── firebase/
│   │       │   ├── permissions/
│   │       │   ├── security/
│   │       │   ├── theme/
│   │       │   └── utils/
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   ├── home/
│   │       │   ├── ipl/
│   │       │   ├── payments/
│   │       │   ├── announcements/
│   │       │   ├── events/
│   │       │   ├── reports/
│   │       │   ├── finance/
│   │       │   ├── cctv/
│   │       │   ├── notifications/
│   │       │   └── profile/
│   │       └── shared/
│   │           ├── models/
│   │           ├── widgets/
│   │           └── components/
│   └── admin/                          # Next.js / React / TypeScript
│       ├── app/
│       │   ├── (auth)/login/
│       │   └── (protected)/
│       │       ├── dashboard/
│       │       ├── residents/
│       │       ├── houses/
│       │       ├── ipl/
│       │       ├── payments/
│       │       ├── finance/
│       │       ├── reports/
│       │       ├── announcements/
│       │       ├── events/
│       │       ├── cctv/
│       │       ├── notifications/
│       │       ├── audit-logs/
│       │       └── settings/
│       ├── components/
│       ├── features/
│       ├── lib/
│       │   ├── auth/
│       │   ├── firebase/
│       │   ├── permissions/
│       │   ├── validation/
│       │   └── errors/
│       ├── public/
│       └── tests/
├── backend/
│   └── functions/
│       ├── src/
│       │   ├── auth/
│       │   ├── common/
│       │   │   ├── authorization/
│       │   │   ├── errors/
│       │   │   ├── idempotency/
│       │   │   ├── logging/
│       │   │   ├── validation/
│       │   │   └── audit/
│       │   ├── modules/
│       │   │   ├── residents/
│       │   │   ├── houses/
│       │   │   ├── ipl/
│       │   │   ├── payments/
│       │   │   ├── announcements/
│       │   │   ├── events/
│       │   │   ├── reports/
│       │   │   ├── finance/
│       │   │   ├── cctv/
│       │   │   └── notifications/
│       │   ├── scheduled/
│       │   └── index.ts
│       └── test/
├── firebase/
│   ├── firestore/
│   │   ├── firestore.rules
│   │   ├── firestore.indexes.json
│   │   └── tests/
│   ├── storage/
│   │   ├── storage.rules
│   │   └── tests/
│   ├── firebase.json
│   └── .firebaserc.example
├── packages/
│   ├── contracts/                      # Schema, enum, payload dan error contract
│   ├── design_tokens/                  # Warna, tipografi, spacing, radius
│   └── test_fixtures/                  # Fixture anonim/non-production
├── docs/
│   ├── architecture/
│   ├── product/
│   ├── runbooks/
│   └── testing/
├── infra/
│   └── environments/
│       ├── development/
│       ├── staging/
│       └── production/
├── scripts/
├── tests/
│   ├── e2e/
│   └── security/
└── .github/workflows/
```

---

## 4. Batas tanggung jawab sistem

### Resident Mobile

Mobile menangani presentasi, input pengguna, state UI, cache non-sensitif, upload bukti, dan pemutaran CCTV melalui sesi resmi. Mobile tidak boleh menetapkan status bisnis final, memberikan permission, menulis audit log, atau menyimpan credential sensitif.

### Admin Web

Admin menyediakan UI operasional untuk pengurus. Role-based UI hanya meningkatkan UX; setiap tindakan tetap harus melalui authorization backend. Aksi kritis harus meminta konfirmasi, menggunakan operation ID, dan menghasilkan audit log.

### Cloud Functions

Cloud Functions menjadi boundary untuk seluruh mutasi kritis: pembuatan tagihan, submit bukti pembayaran, approve/reject pembayaran, publikasi konten, transaksi keuangan, permission CCTV, notifikasi, dan audit log.

### Firestore dan Storage

Firestore adalah source of truth data aplikasi. Storage menyimpan payment proof dan attachment sesuai ownership. Rules menerapkan deny-by-default dan least privilege.

### CCTV Gateway

Gateway berada di luar client Firebase. Gateway melakukan koneksi privat ke Hikvision DVR, memvalidasi token/sesi, memeriksa camera-level permission, mengeluarkan stream sementara, dan mencatat akses. Credential DVR tidak pernah dikirim ke mobile.

---

## 5. Kontrak domain utama

### Identity dan access

- Role: `resident`, `committee`, `super_admin`.
- Status akun harus divalidasi sebelum data domain dimuat.
- Custom claims dapat menjadi sinyal role, tetapi resource ownership tetap diperiksa terhadap data server.
- Perubahan role hanya melalui operasi Super Admin yang diaudit.

### IPL dan payment

```text
Bill: UNPAID → PENDING_VERIFICATION → PAID
                          └──────────→ UNPAID (jika ditolak)

Payment: PENDING_VERIFICATION → APPROVED
                              └→ REJECTED
```

- Bank wajib BCA.
- Satu bill tidak boleh memiliki lebih dari satu active submission.
- `verifyPayment` harus atomik: validasi status, update payment, update bill, tulis audit event, lalu memicu notifikasi secara asynchronous.
- Kegagalan notifikasi tidak boleh membatalkan transaksi utama.
- Semua operasi retry-sensitive harus memiliki idempotency key.

### Community content

- Resident hanya membaca announcement/event yang published.
- Draft dan arsip hanya dapat dikelola role berwenang.
- Laporan warga selalu terikat `residentId` dan `houseId`.

### Finance

- Data internal dan data published harus dibedakan eksplisit.
- Resident hanya membaca record/ringkasan yang sudah dipublikasikan.
- Perubahan finansial harus memiliki actor, timestamp, dan audit record.

### CCTV

- Permission per user dan camera.
- Sesi singkat, dapat dicabut, dan memiliki expiry.
- Tidak ada URL RTSP publik atau credential DVR di client.

---

## 6. Environment dan konfigurasi

| Area | Development | Staging | Production |
|---|---|---|---|
| Firebase | Emulator/local project | Project khusus staging | Project khusus production |
| Data | Fixture sintetis | Data UAT anonim | Data resmi |
| App Check | Debug provider | Enforced bertahap | Enforced |
| BCA | Dummy config | Rekening test/terkontrol | Konfigurasi resmi via secret/config |
| CCTV | Mock stream | Gateway staging | Gateway production |
| FCM | Test devices | UAT devices | Production users |
| Logging | Verbose tanpa secret | Structured | Structured + alerting |

Konfigurasi yang boleh berada di client hanya identifier publik yang memang diperlukan SDK. Secret, service account, credential CCTV, dan konfigurasi finansial sensitif harus berada di secret manager atau protected backend configuration.

---

## 7. Milestone implementasi

### M0 — Requirement lock dan traceability

Keluaran:

- PRD disalin ke `docs/product/` sebagai referensi versioned.
- Requirement Traceability Matrix dibuat: requirement → screen → API/function → collection → rule → test.
- Acceptance criteria per fitur tersedia.
- Ambiguity register dan Change Request register tersedia.

Gate: tidak ada keputusan arsitektur locked yang belum terpetakan.

### M1 — Foundation

Keluaran:

- Flutter app, Next.js app, dan Firebase Functions diinisialisasi.
- Linting, formatting, dependency policy, commit checks, dan CI dasar aktif.
- Firebase Emulator Suite berjalan.
- Design tokens dan shared contracts memiliki versioning.
- Development/staging/production dipisahkan.

Gate: clean install, build, lint, dan test berhasil di CI.

### M2 — Identity, resident, dan household

Keluaran:

- Login/logout/session recovery.
- RBAC dan protected routing.
- Resident, house, household, family member, vehicle, dan profile.
- Admin management untuk resident dan house.
- Rules dan ownership test.

Gate: resident tidak dapat membaca atau mengubah data rumah lain.

### M3 — IPL dan pembayaran BCA

Keluaran:

- Bill generation dan monthly scheduled job.
- Instruksi rekening BCA dari backend configuration.
- Protected upload payment proof.
- Queue pending verification pada Admin Web.
- Approve/reject yang atomik, idempotent, dan diaudit.
- Riwayat pembayaran dan notifikasi status.

Gate: client gagal ketika mencoba menulis `PAID`; duplicate submission tertolak; happy path dan rejection path lulus E2E.

### M3B — Internet billing dan masa aktif

Keluaran:

- Internet packages dan subscription assignment.
- Bill internet terpisah dari IPL.
- Pembayaran transfer BCA dan protected payment proof.
- Manual verification oleh Committee/Super Admin.
- Backend-controlled active-period extension.
- Expiring-soon dan expired notifications.
- Tidak ada integrasi otomatis ke router/perangkat ISP.

Gate: approved payment memperpanjang masa aktif tepat satu kali; rejected payment tidak mengubah masa aktif; client tidak dapat menulis `PAID` atau `activeUntil`.

### M4 — Community

Keluaran:

- Announcement draft/publish/archive.
- Event/agenda.
- Report creation, attachment, status lifecycle.
- Notification inbox dan FCM.

Gate: hanya konten published terlihat resident dan notification failure tidak merusak transaksi utama.

### M5 — Finance transparency

Keluaran:

- Category dan finance transaction.
- Internal/published boundary.
- Ringkasan periode, income, expense, dan filter.
- Audit trail seluruh mutasi.

Gate: resident tidak dapat membaca record internal yang belum dipublikasikan.

### M6 — CCTV

Keluaran:

- Inventaris channel/camera.
- Grant/revoke/expire permission.
- Authenticated streaming gateway.
- Short-lived playback session.
- Rate limiting, revocation, dan access audit.

Gate: tidak ada public RTSP; user tanpa permission gagal mengakses stream; revoke berlaku sesuai SLA.

### M7 — Admin dan operasional lengkap

Keluaran:

- Dashboard, audit log viewer, notifications, dan settings.
- Search, filter, pagination, empty/error/loading states.
- Administrative recovery yang terkontrol.
- Export hanya jika disetujui sebagai requirement dan dilindungi authorization.

Gate: seluruh operasi kritis memiliki audit record dan tidak dapat dilakukan role yang salah.

### M8 — Hardening dan quality assurance

Keluaran:

- Unit, integration, E2E, Firestore Rules, Storage Rules, dan abuse tests.
- App Check enforcement.
- Rate limiting dan input validation.
- Dependency scan, secret scan, performance baseline, dan accessibility audit.
- Backup/restore drill dan rollback drill.

Gate: tidak ada severity critical/high yang terbuka; test kritis 100% lulus.

### M9 — Staging dan UAT

Keluaran:

- Release candidate terpasang di staging.
- UAT bisnis, payment, security, CCTV, dan admin.
- Data migration rehearsal.
- User guide, admin guide, privacy policy, dan support path.

Gate: UAT sign-off dan go-live checklist disetujui pemilik produk.

### M10 — Production dan publish

Keluaran:

- Firebase production, domain admin, SSL, monitoring, alerts, dan backup aktif.
- Android App Bundle signed dan iOS archive signed.
- Store listing, screenshots, app icon, privacy disclosures, dan release notes.
- Admin Web production deployment.
- Production smoke test dan rollback checkpoint.

Gate: seluruh checklist bagian 11 lulus.

---

## 8. CI/CD pipeline

### Pull request

```text
Install locked dependencies
  → format check
  → lint/static analysis
  → unit test
  → contract/schema test
  → Firestore/Storage rules test
  → build mobile/admin/functions
  → dependency and secret scan
```

### Merge ke main

```text
Semua PR checks
  → deploy preview/staging
  → integration test
  → E2E smoke test
  → publish test evidence
```

### Production release

```text
Version tag
  → immutable build artifacts
  → manual production approval
  → deploy rules/indexes/functions
  → deploy admin web
  → publish mobile builds
  → production smoke test
  → monitor release window
```

Urutan deployment harus mencegah client baru memanggil contract backend yang belum tersedia. Perubahan rules dan indexes harus diuji di emulator dan staging sebelum production.

---

## 9. Strategi testing minimum

| Layer | Fokus wajib |
|---|---|
| Unit | validator, mapper, status transition, permission helper, amount/date logic |
| Widget/UI | loading, empty, error, offline, unauthorized, forbidden, success |
| Functions | auth, role, ownership, validation, idempotency, transaction, audit |
| Firestore Rules | cross-house access, role escalation, direct `PAID` write, audit write |
| Storage Rules | ownership payment proof, path manipulation, file type/size |
| Integration | Auth, Firestore, Storage, Functions, FCM orchestration |
| E2E | login, IPL payment, approve/reject, report, finance publish, CCTV access |
| Security | privilege escalation, replay, duplicate submit, token expiry, data leakage |
| Operational | backup restore, rollback, alert delivery, disaster recovery |

Critical payment E2E wajib membuktikan:

1. Bill `UNPAID` terlihat oleh pemiliknya.
2. Instruksi transfer hanya BCA.
3. Proof berhasil diunggah pada path yang benar.
4. Payment menjadi `PENDING_VERIFICATION`.
5. Resident tidak dapat mengubah `APPROVED` atau bill `PAID`.
6. Committee dapat approve atau reject sesuai permission.
7. Approve mengubah payment dan bill secara konsisten.
8. Audit log selalu tercatat.
9. FCM dikirim tanpa menjadi bagian transaksi atomik.
10. Retry tidak membuat pembayaran ganda.

---

## 10. Observability dan operasi

Setiap request kritis memiliki correlation/operation ID. Structured log minimal menyimpan timestamp, environment, actor ID, role, action, resource, result, latency, dan error code—tanpa payment proof, credential, token, atau data pribadi sensitif.

Alert production minimum:

- Cloud Functions error rate atau latency melewati threshold.
- Payment verification gagal/inkonsisten.
- Unauthorized/forbidden anomaly meningkat.
- CCTV gateway unavailable.
- FCM failure rate meningkat.
- Storage atau Firestore usage anomali.
- Backup gagal.

Runbook minimum:

- Deploy dan rollback.
- Payment inconsistency recovery.
- Compromised account/role recovery.
- CCTV gateway outage.
- Backup dan restore.
- Notification outage.
- Incident communication dan postmortem.

---

## 11. Checklist siap publish

### Product

- [ ] Seluruh acceptance criteria prioritas rilis lulus.
- [ ] Tidak ada perubahan locked decision tanpa Change Request.
- [ ] Semua screen memiliki loading, success, empty, error, offline, unauthorized, dan forbidden yang relevan.
- [ ] Bahasa dan konten final disetujui.

### Security dan privacy

- [ ] Firestore dan Storage deny-by-default.
- [ ] App Check enforced di production.
- [ ] Tidak ada secret di repository atau application bundle.
- [ ] Resident tidak dapat mengakses data resident lain.
- [ ] Client tidak dapat menetapkan payment/bill ke status final.
- [ ] Audit log tidak dapat ditulis atau diubah resident.
- [ ] CCTV tidak mengekspos DVR/RTSP langsung.
- [ ] Privacy policy dan data-retention policy tersedia.

### Backend dan data

- [ ] Index production tersedia.
- [ ] Scheduled billing job teruji dan idempotent.
- [ ] Backup aktif dan restore drill berhasil.
- [ ] Data migration/import telah direhearsal di staging.
- [ ] BCA configuration production tervalidasi oleh pihak berwenang.

### Quality

- [ ] Unit, integration, rules, security, dan E2E tests lulus.
- [ ] Tidak ada critical/high issue terbuka.
- [ ] Crash-free dan performance baseline memenuhi target yang disepakati.
- [ ] Accessibility dan device/browser matrix lulus.

### Mobile stores

- [ ] Bundle ID/application ID final.
- [ ] Signing key/certificate tersimpan aman dan memiliki recovery owner.
- [ ] Android App Bundle dan iOS archive berasal dari release commit/tag yang sama.
- [ ] Icon, screenshots, description, support URL, privacy URL, dan age/data disclosure lengkap.
- [ ] Internal testing/TestFlight selesai sebelum production rollout.

### Admin web dan operations

- [ ] Production domain, SSL, headers, dan access policy aktif.
- [ ] Monitoring dashboard dan alert recipient aktif.
- [ ] On-call/support owner ditetapkan.
- [ ] Rollback plan dan incident runbook dapat dijalankan.
- [ ] Smoke test pascadeploy lulus.

---

## 12. Urutan go-live yang aman

1. Freeze release candidate dan buat version tag.
2. Verifikasi backup serta restore point sebelum migrasi.
3. Deploy Firestore indexes yang kompatibel.
4. Deploy dan verifikasi Security Rules.
5. Deploy Cloud Functions serta scheduled jobs dalam mode terkontrol.
6. Deploy Admin Web production dan jalankan admin smoke test.
7. Aktifkan monitoring, alerting, App Check, dan rate limits.
8. Import/validasi data production menggunakan tool terkontrol dan audit trail.
9. Jalankan payment, notification, dan CCTV smoke test dengan akun khusus.
10. Publish Android/iOS melalui staged rollout.
11. Monitor error, latency, auth anomalies, dan user feedback selama release window.
12. Lanjutkan rollout hanya jika release gates tetap hijau; rollback bila threshold terlewati.

---

## 13. Definition of Done per fitur

Sebuah fitur hanya selesai bila semua item berikut terpenuhi:

```text
Requirement mapped
→ UX/UI dan seluruh state selesai
→ contract/schema tervalidasi
→ frontend selesai
→ backend business logic selesai
→ authorization dan security rules selesai
→ validation/error/offline handling selesai
→ audit dan observability selesai
→ unit/integration/security/E2E test lulus
→ dokumentasi/runbook diperbarui
→ acceptance criteria/UAT diterima
```

Build yang berhasil tanpa security, test, audit, dan acceptance evidence belum dianggap selesai.

---

## 14. Change control

Perubahan database, payment, authentication, authorization, CCTV, roles, core navigation, API contract, security model, atau Firebase architecture harus memiliki Change Request yang mencatat alasan, dampak database/API/frontend/backend/security/test, approver, serta versi PRD tujuan.

Implementasi harus berhenti pada boundary perubahan tersebut sampai Change Request disetujui. Bug fix yang mengembalikan perilaku ke kontrak PRD tidak mengubah kontrak, tetapi tetap harus memiliki test regresi.
