# CASA D'NINETY NINE — Security Audit Plan & Report

**Versi:** 1.0  
**Tanggal:** 7 Oktober 2026  
**Status audit:** `PLANNED — NOT YET EXECUTED`  
**Alasan:** Source code, Firebase project staging, Admin Web, mobile build, dan CCTV gateway belum tersedia untuk diuji.  
**Standar acuan:** OWASP ASVS, OWASP MASVS/MSTG, OWASP Top 10, Firebase Security Rules best practices, least privilege, privacy by default.

> Dokumen ini adalah kontrak audit dan template bukti. Dokumen ini bukan pernyataan bahwa aplikasi sudah aman atau sudah lulus penetration test.

## 1. Scope

### In scope

- Flutter Resident Mobile App Android/iOS.
- Next.js Admin Web.
- Firebase Authentication.
- Firestore, Storage, Cloud Functions, FCM, App Check.
- IPL dan pembayaran internet melalui transfer BCA.
- Payment proof upload dan verifikasi admin.
- Resident, household, house, vehicle, report, announcement, event, finance publication.
- CCTV secure streaming gateway dan permission per kamera.
- CI/CD, secrets, environments, logging, monitoring, backup, restore, dan incident response.

### Out of scope sampai tersedia

- Infrastruktur vendor/ISP di luar kontrol CASA.
- Sistem internal Bank BCA.
- Firmware DVR; audit hanya mencakup konfigurasi, network exposure, credential handling, dan gateway integration.
- Social engineering terhadap warga/pengurus tanpa izin tertulis terpisah.

## 2. Data classification

| Kelas | Contoh | Perlindungan minimum |
|---|---|---|
| Public | Pengumuman/agenda published | Integrity, anti-abuse |
| Internal | Draft konten, konfigurasi non-secret | Committee-only, audit |
| Private | Profil, rumah, keluarga, kendaraan, IPL | Ownership/RBAC, encryption in transit/at rest |
| Sensitive | Bukti transfer, finance internal, CCTV, audit log | Strict RBAC, protected Storage, short retention, monitoring |
| Secret | Service account, signing key, DVR credential | Secret manager, rotation, never in client/repo/log |

## 3. Threat actors dan abuse cases

- Resident mencoba membaca rumah, pembayaran, attachment, atau kamera milik warga lain.
- Resident memodifikasi request agar bill menjadi `PAID` atau masa aktif internet bertambah.
- Committee mencoba melakukan aksi Super Admin.
- Attacker memakai stolen token, replay request, credential stuffing, atau emulator/script tidak resmi.
- File upload berbahaya, spoofed MIME, oversized payload, atau path traversal.
- Public URL/Storage token membocorkan bukti transfer.
- XSS/CSRF/session fixation pada Admin Web.
- SSRF, command injection, atau URL injection pada CCTV gateway.
- RTSP URL atau credential DVR bocor ke client, log, crash report, atau repository.
- Audit log diubah/dihapus untuk menutupi aksi.
- Duplicate submission atau race condition menghasilkan double approval/perpanjangan.
- Supply-chain dependency atau CI secret compromise.
- Backup tidak terenkripsi atau restore tidak teruji.

## 4. Security invariants

1. Resident hanya dapat membaca resource milik UID/house yang sah.
2. Client tidak dapat menetapkan payment `APPROVED`, bill `PAID`, role, permission CCTV, atau audit event.
3. Approve/reject payment berlangsung atomik, idempotent, dan diaudit.
4. Harga IPL dan internet dihitung/diambil dari konfigurasi server, bukan dipercaya dari client.
5. Payment proof tidak memiliki public read URL permanen.
6. Finance internal tidak pernah otomatis terlihat resident.
7. CCTV hanya melalui authenticated gateway dengan camera-level authorization dan session singkat.
8. Secret tidak berada di source repository, mobile bundle, browser bundle, Firestore publik, analytics, atau log.
9. Setiap aksi administratif kritis memiliki actor, timestamp, result, resource, old/new value, dan correlation ID.
10. Production, staging, dan development tidak berbagi project, data, credential, atau signing key.

## 5. Audit control matrix

| ID | Area | Kontrol yang diuji | Metode | Evidence | Status |
|---|---|---|---|---|---|
| AUTH-01 | Authentication | Session expiry, logout, disabled account | Integration/E2E | Pending | NOT TESTED |
| AUTH-02 | Authentication | Brute-force/rate limit dan generic error | Dynamic | Pending | NOT TESTED |
| RBAC-01 | Authorization | Resident tidak membaca rumah lain | Emulator rules test | Pending | NOT TESTED |
| RBAC-02 | Authorization | Committee tidak memakai Super Admin operation | Function test | Pending | NOT TESTED |
| RBAC-03 | Authorization | Role claim diverifikasi dengan resource ownership | Code review/test | Pending | NOT TESTED |
| PAY-01 | Payment | Client tidak dapat menulis PAID/APPROVED | Rules + API abuse test | Pending | NOT TESTED |
| PAY-02 | Payment | Approve/reject atomik dan idempotent | Concurrency test | Pending | NOT TESTED |
| PAY-03 | Payment | Nominal server-authoritative | Tampered request test | Pending | NOT TESTED |
| PAY-04 | Payment | Duplicate proof/submission ditolak aman | Replay test | Pending | NOT TESTED |
| STG-01 | Storage | Proof hanya uploader dan authorized admin | Storage rules test | Pending | NOT TESTED |
| STG-02 | Storage | MIME, extension, magic bytes, size | Upload fuzz/validation | Pending | NOT TESTED |
| WEB-01 | Admin Web | XSS pada judul, laporan, reason, rich text | DAST/manual | Pending | NOT TESTED |
| WEB-02 | Admin Web | CSRF/session cookie/security headers/CSP | Header/session test | Pending | NOT TESTED |
| API-01 | Functions | Schema validation dan mass assignment | API negative tests | Pending | NOT TESTED |
| API-02 | Functions | App Check, auth, rate limit | Integration test | Pending | NOT TESTED |
| CCTV-01 | CCTV | DVR/RTSP tidak internet-facing | Network scan/config review | Pending | NOT TESTED |
| CCTV-02 | CCTV | Camera permission dan expiry | Authorization tests | Pending | NOT TESTED |
| CCTV-03 | CCTV | Token pendek, revoke, replay protection | Dynamic test | Pending | NOT TESTED |
| CCTV-04 | CCTV | SSRF/URL injection tidak mungkin | Code review/fuzz | Pending | NOT TESTED |
| PRIV-01 | Privacy | PII dimasking dan tidak masuk analytics/log | Log review | Pending | NOT TESTED |
| AUD-01 | Audit | Resident/client tidak menulis/mengubah log | Rules test | Pending | NOT TESTED |
| AUD-02 | Audit | Aksi kritis menghasilkan event lengkap | E2E evidence | Pending | NOT TESTED |
| SEC-01 | Secrets | Repo, bundle, image, log bebas secret | Secret scan/binary review | Pending | NOT TESTED |
| DEP-01 | Supply chain | Lockfile, vulnerability/license scan | SCA/CI | Pending | NOT TESTED |
| INF-01 | Infrastructure | IAM least privilege dan environment isolation | Config review | Pending | NOT TESTED |
| BAK-01 | Recovery | Backup encrypted dan restore berhasil | Restore drill | Pending | NOT TESTED |
| MON-01 | Monitoring | Alert untuk auth/payment/CCTV anomaly | Alert simulation | Pending | NOT TESTED |

## 6. Firestore rules negative-test catalog

Wajib diuji menggunakan Firebase Emulator Suite:

- Unauthenticated read/write semua private collections → deny.
- Resident A membaca/mengubah resident, house, bill, payment, report Resident B → deny.
- Resident membuat atau mengubah `auditLogs` → deny.
- Resident mengubah `role`, `houseId`, `status`, amount, package price, `published`, atau CCTV permission → deny.
- Committee tanpa scope yang sesuai mengubah system settings/role Super Admin → deny.
- Resident membaca draft announcement/event/finance → deny.
- Query yang berpotensi melewati ownership constraint → deny.
- Deleted/disabled account menggunakan cached token → deny setelah propagation/revocation policy.

Positive tests harus memastikan akses yang sah tetap bekerja dan tidak menghasilkan false-deny.

## 7. Storage audit

- Path wajib mengikat UID/house/payment/report dan tidak menerima path dari client tanpa normalisasi.
- Maksimum file sesuai kontrak; MIME dari client tidak dipercaya sendirian.
- Rename file dengan UUID server; nama asli disanitasi dan hanya metadata bila diperlukan.
- Bukti transfer dan attachment tidak public.
- Download melalui authenticated/authorized flow; URL bertempo panjang dilarang.
- Malware scanning/quarantine dipertimbangkan untuk seluruh attachment sebelum admin preview.
- EXIF yang tidak dibutuhkan dihapus; thumbnail aman dibuat server-side.
- Retention dan deletion policy mengikuti kebutuhan hukum/operasional yang disetujui.

## 8. Payment audit

### Test kritis

1. Kirim amount Rp1 atau ubah package ID setelah UI selection → backend menolak/menghitung ulang.
2. Dua submit paralel untuk bill sama → hanya satu active submission.
3. Dua admin approve bersamaan → satu hasil final; tidak ada double effect.
4. Retry setelah timeout memakai idempotency key sama → tidak membuat transaksi baru.
5. Resident memanggil endpoint approve/reject → `403` dan security event.
6. Rejected proof tidak mengubah bill menjadi paid atau masa aktif internet.
7. Kegagalan FCM tidak me-rollback transaksi payment utama.
8. Semua perubahan memiliki audit event dan correlation ID.

## 9. Admin Web audit

- Protected route harus divalidasi server-side/backend, bukan hanya sembunyikan menu.
- Output encoding untuk seluruh resident-generated content.
- Rich-text editor memiliki allowlist sanitizer.
- CSP ketat; tidak menggunakan `unsafe-eval` di production kecuali pengecualian terdokumentasi.
- Cookie bila digunakan: `Secure`, `HttpOnly`, `SameSite` sesuai arsitektur.
- Aksi approve/reject, publish finance, role, CCTV permission menggunakan confirmation dan fresh authorization.
- PII dimasking di list, export, screenshot, dan log.
- CSV export mencegah formula injection.
- Error production tidak memuat stack trace, key, query sensitif, atau internal path.

## 10. Mobile audit

- Tidak menyimpan password, service account, DVR credential, atau payment proof di insecure storage.
- Token menggunakan secure platform storage bila perlu; logout membersihkan local sensitive state.
- Release build tidak mengizinkan debug logging sensitif.
- Deep link tidak melewati authorization.
- Screenshot/recents protection dipertimbangkan untuk bukti transfer dan CCTV sesuai kebutuhan UX.
- Certificate/TLS validation tidak dinonaktifkan.
- Root/jailbreak detection bila digunakan hanya menjadi risk signal, bukan satu-satunya kontrol.
- Offline cache tidak menyimpan private data tanpa proteksi dan retention yang jelas.

## 11. CCTV audit

- Scan dari internet memastikan DVR/RTSP port tidak public.
- Gateway hanya dapat mengakses camera allowlist internal.
- Request user tidak boleh menentukan arbitrary upstream URL/host.
- Token mencakup user, camera, expiry, nonce/session ID, dan audience; replay ditolak.
- Permission dievaluasi ulang saat membuat session dan dapat direvoke.
- Stream URL sementara tidak dicatat penuh pada analytics/log.
- Rate limit per user/device/IP; anomaly alert untuk enumerasi kamera atau session churn.
- Akses tercatat dengan actor, camera, start/end, result, dan correlation ID tanpa merekam isi video.

## 12. Secrets dan CI/CD

- Jalankan secret scan pada full Git history dan artifact build.
- Dependency harus lock, dipindai CVE, dan diperbarui melalui reviewed pull request.
- CI memakai workload identity/short-lived credential bila didukung; hindari long-lived service account JSON.
- Branch protection, review wajib, status checks, dan environment approval untuk production.
- Build artifact immutable dan memiliki provenance/checksum.
- Production deploy hanya dari tagged/reviewed commit.

## 13. Severity dan SLA remediation

| Severity | Definisi | Release | Target remediasi |
|---|---|---|---|
| P0 Critical | Data/credential exposure, auth bypass, arbitrary admin/payment/CCTV access | Block total | Segera, incident process |
| P1 High | Privilege escalation, cross-house data access, stored XSS admin, payment integrity failure | Block | Sebelum release candidate berikutnya |
| P2 Medium | Defense-in-depth lemah, limited information disclosure, rate-limit gap | Conditional block | Sebelum public rollout atau risk acceptance tertulis |
| P3 Low | Hardening/documentation issue dengan impact rendah | Track | Jadwal maintenance |

Risk acceptance untuk P2/P3 memerlukan owner, alasan, compensating control, expiry date, dan approval Super Admin/Product Owner. P0/P1 tidak boleh diterima untuk production.

## 14. Evidence structure

Simpan bukti tanpa secret/PII:

```text
docs/security/evidence/<release>/
  scope.md
  environment.md
  rules-test-report.json
  storage-test-report.json
  function-test-report.xml
  sast-summary.json
  sca-summary.json
  secret-scan-summary.json
  dast-summary.md
  mobile-review.md
  cctv-network-review.md
  backup-restore-drill.md
  findings.md
  remediation-retest.md
  sign-off.md
```

Raw reports yang mengandung detail eksploitasi, URL internal, atau PII harus berada di protected security storage, bukan repository.

## 15. Audit execution phases

1. **Design review:** threat model, data flow, trust boundary, security invariants.
2. **Static review:** source, dependency, secret, configuration, IaC, mobile binary.
3. **Automated rules/API tests:** emulator dan staging.
4. **Dynamic application test:** Admin Web, mobile, functions, upload, session.
5. **CCTV/network review:** exposure, gateway, token, permission, revocation.
6. **Operational audit:** IAM, logs, alerts, backup, restore, incident response.
7. **Remediation:** perbaikan berdasarkan severity.
8. **Re-test:** setiap finding harus memiliki evidence closure.
9. **Sign-off:** Security reviewer, Tech Lead, Product Owner.

## 16. Release security gate

Release hanya boleh berstatus `SECURITY PASS` jika:

- [ ] Seluruh control matrix berstatus PASS, NOT APPLICABLE dengan alasan, atau accepted P2/P3 yang belum kedaluwarsa.
- [ ] Tidak ada P0/P1 terbuka.
- [ ] Firestore dan Storage rules negative/positive tests lulus.
- [ ] Payment concurrency, tampering, replay, dan idempotency tests lulus.
- [ ] CCTV tidak public dan permission/session tests lulus.
- [ ] Secret scan repository serta artifacts bersih.
- [ ] Dependency critical/high telah diperbaiki atau dinilai secara tertulis.
- [ ] Backup dan restore drill berhasil.
- [ ] Monitoring/alert simulation berhasil.
- [ ] Re-test evidence dan sign-off tersedia.

## 17. Current audit conclusion

```text
Result: NOT TESTED
Release authorization: NOT GRANTED
Open findings: N/A — audit has not been executed
Next trigger: staging implementation complete and deployable
```

Security architecture telah didefinisikan, tetapi keamanan sistem aktual belum dapat diverifikasi sebelum code dan environment tersedia.
