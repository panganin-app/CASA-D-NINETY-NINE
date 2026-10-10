# Requirement Traceability Matrix v1.0

| Requirement | UI | Backend boundary | Data | Test wajib |
|---|---|---|---|---|
| Login resident | Login v3 | Firebase Auth/session bootstrap | users, residents | auth recovery, disabled account |
| IPL Rp100.000/KK | Home v2, IPL overview | generate monthly bill | iplBills | one bill/house/period |
| BCA-only payment | IPL/internet payment | submitPaymentProof | payments, Storage | reject unsupported method |
| Backend-only PAID | Pending/approved/rejected | verifyPayment | bills, payments, auditLogs | client write denied; atomic approve |
| Internet catalog | Renewal v2 | getActivePackages | internetPackages | exactly 3 active official packages |
| Internet active period | Overview/approved | approveInternetPayment, activateService | subscriptions | approval extends correct date |
| Manual router operation | Admin Internet | activateInternetService | subscriptions, auditLogs | no router credential/API in client |
| Published information | Feed/detail | publishAnnouncement/Event | announcements, events | draft unreadable by resident |
| Resident report | Create/history | createReport/updateReportStatus | reports | ownership, attachment limits |
| Finance transparency | Finance | publishFinancePeriod | financePublications | only published records readable |
| CCTV permission | CCTV list/live | createCctvSession | cameras, cctvPermissions, auditLogs | unauthorized camera denied |
| Resident privacy | Profile | updateAllowedProfileFields | residents, households | cross-house access denied |
| Admin payment queue | Payment verification | approve/reject operations | payments, bills | role, idempotency, audit |
| Auditability | Admin activity/audit views | immutable audit writer | auditLogs | client create/update/delete denied |
| Notifications | Bell/status changes | notification dispatcher | notifications | transaction remains valid if FCM fails |

## Exit rule

Update 8 Oktober 2026: foundation lokal tersedia. `backend/functions/src/index.ts` menyediakan `getBillingCatalog`; `tests/security/rules.test.mjs` menguji household ownership, larangan PAID/role/audit write, akun nonaktif, dan anonymous. Build, empat unit test, tiga rules test, serta smoke Auth/Functions/Firestore lulus. Requirement payment dan internet end-to-end pada tabel belum selesai; upload, transaksi verification, dan persistence subscription belum diimplementasikan.

Suatu requirement belum selesai bila salah satu kolom UI, backend, rule, atau test belum memiliki implementasi dan bukti pada staging.

## Update billing lokal — 8 Oktober 2026

| Requirement | Implementasi | Bukti test | Status |
|---|---|---|---|
| IPL Rp100.000 satu rumah/periode | `backend/functions/src/billing.ts` createBill | concurrent creation, amount tampering | Backend lokal tersedia; scheduler belum |
| Submit/approve/reject | billing.ts submitPayment/verifyPayment | retry, double approve, reject/resubmit, authorization | Backend lokal tersedia |
| Internet satu bulan kalender | billing.ts + domain.ts | 3 approval bersamaan menambah periode satu kali | Backend lokal tersedia; aktivasi manual belum |
| Bukti transfer privat | proofs.ts + Storage deny-all | decoder, private access, owner/admin access | Backend lokal tersedia; cleanup orphan belum |
| Rekening terpisah | index.ts getPaymentInstructions | HTTP memilih config IPL/internet terpisah | Lokal tersedia; konfigurasi cloud belum |
| Data rumah/warga | getMyHousehold + seed-local.mjs | HTTP household read | Seed/read tersedia; admin CRUD belum |
| Notifikasi hasil verifikasi | notification_outbox | outbox atomik saat approval | Dispatcher FCM belum |

Full requirement tidak dinyatakan selesai hanya dengan hasil backend ini. UI, end-to-end perangkat, rate limit seluruh API, operasional production, dan audit menyeluruh belum selesai.

## Update operasional admin — 8 Oktober 2026

| Requirement | Implementasi | Evidence | Status |
|---|---|---|---|
| Kelola rumah/warga | operations.ts createHouse/registerResident/setResidentActive | integration fixture Auth, duplicate house/head, immutable role, account active | Tahap dasar lokal tersedia; pindah hunian/edit kontak belum |
| Antrean verifikasi admin | operations.ts listAdminRecords | pagination, allowlist, resident denied, pending filter | Lokal tersedia; Admin Web belum |
| Aktivasi internet manual | operations.ts activateInternetService | retry concurrent, payment reference, activeUntil unchanged, single audit | Lokal tersedia; UI teknisi belum |
| Proteksi provisioning client | Firestore deny-all writes | houses/residents/subscriptions/admin_operations write denied | Rules lokal lulus |

## Update komunitas/inbox/batch IPL — 8 Oktober 2026

| Requirement | Implementasi | Evidence | Status |
|---|---|---|---|
| Published information | community.ts saveCommunityContent/listPublishedContent, rules published-only | draft/archive deny, admin-only write, stale version/date validation | Backend lokal tersedia; UI belum terintegrasi |
| Resident report | createResidentReport/updateReportStatus, reports/report_events owner read | retry, field injection, transition/version, history, ownership rules | Teks tersedia; lampiran dan anti-flood belum |
| Notifications | notifications.ts, dispatchInAppNotification trigger | trigger nyata di emulator, retry, private inbox, held inactive, owner readAt | IN_APP lokal; FCM belum |
| IPL bulanan | monthly-ipl.ts generateMonthlyIpl | limit/cursor, repeat, PAID tetap | Batch admin lokal; clock scheduler/due date belum |

Build dan 21 tes total lulus (4 unit, 10 integration groups, 7 rules tests). Tidak menggantikan staging, audit production, atau exit rule aplikasi secara utuh.
