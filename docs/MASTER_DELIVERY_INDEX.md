# CASA D'NINETY NINE — Master Delivery Index

**Versi:** 1.0  
**Status:** Design dan blueprint selesai; implementasi belum dimulai  
**Fungsi:** Peta dokumen dari requirement sampai publikasi dan operasi production.

## 1. Hulu — Product dan keputusan bisnis

| Dokumen | Fungsi |
|---|---|
| `product/CASA_DNINETY_NINE_PRD_v1.1.md` | Single source of truth awal |
| `product/CHANGE_REQUEST_CR-001_IPL_FEE.md` | IPL Rp100.000/KK/bulan |
| `product/CHANGE_REQUEST_CR-002_INTERNET_PAYMENT.md` | Penambahan pembayaran internet |
| `product/IPL_BUSINESS_RULES.md` | Aturan domain IPL |
| `product/INTERNET_PACKAGE_CATALOG.md` | Paket 25/125k, 50/180k, 100/250k |
| `product/INTERNET_PAYMENT_BLUEPRINT.md` | Kontrak pembayaran dan masa aktif internet |

## 2. UX, UI, dan design system

| Dokumen/aset | Fungsi |
|---|---|
| `product/UI_UX_HANDOFF.md` | Kontrak layar, navigasi, komponen, dan accessibility |
| `product/SCREEN_STATE_MATRIX.md` | Loading, empty, error, offline, auth, dan state domain |
| `product/STITCH_MASTER_PROMPT.md` | Brief konsisten untuk Stitch |
| `../packages/design_tokens/tokens.json` | Token desain machine-readable |
| `../assets/mockups/` | 37 visual reference Resident dan Admin |

## 3. Arsitektur dan kontrak implementasi

| Dokumen | Fungsi |
|---|---|
| `architecture/IMPLEMENTATION_STRUCTURE.md` | Struktur monorepo, milestone, environment, release path |
| `product/REQUIREMENT_TRACEABILITY_MATRIX.md` | Requirement → UI → backend → data → test |
| `product/INTERNET_UI_FLOW.md` | State dan perpindahan layar internet |

## 4. Security dan privacy

| Dokumen | Fungsi |
|---|---|
| `security/SECURITY_AUDIT.md` | Threat model, audit controls, test cases, evidence, release gate |
| `../tests/security/README.md` | Lokasi dan ruang lingkup automated security tests |
| PRD bagian 17–20 | RBAC, rules, privacy, CCTV, audit log |

## 5. Testing dan acceptance

| Dokumen | Fungsi |
|---|---|
| `testing/UAT_ACCEPTANCE.md` | Acceptance gate UI, IPL, internet, community, CCTV, release |
| `product/REQUIREMENT_TRACEABILITY_MATRIX.md` | Memastikan setiap requirement memiliki test |

## 6. Hilir — Deployment dan publikasi

| Dokumen | Fungsi |
|---|---|
| `runbooks/PUBLISH_READINESS.md` | Provisioning, migration, build, rollout, rollback |
| `architecture/IMPLEMENTATION_STRUCTURE.md` | Roadmap M0 sampai production |

## 7. Status delivery

| Area | Status sekarang | Syarat selesai aktual |
|---|---|---|
| Product contract | Selesai | Change control aktif |
| UI/UX | Selesai sebagai design freeze candidate | Review visual terakhir oleh pemilik produk |
| Arsitektur | Selesai sebagai blueprint | ADR final saat implementasi |
| Source code | Belum dimulai | Build, lint, test, dan review lulus |
| Security design | Selesai | Kontrol diterapkan pada code dan infra |
| Security audit aktual | Belum dapat dieksekusi | Evidence staging/production dan hasil test tersedia |
| UAT | Belum dieksekusi | Checklist ditandatangani tanpa P0/P1 |
| Publish | Belum | Semua release gate lulus |

## 8. Urutan kerja wajib

```text
PRD dan change request
  → design freeze dan contracts
  → repository/environment foundation
  → authentication/RBAC/rules
  → backend business logic
  → mobile dan admin implementation
  → automated tests
  → security audit staging
  → remediation dan re-test
  → UAT
  → production readiness review
  → staged rollout
  → monitoring, incident response, backup, maintenance
```

Dokumen audit tidak boleh diberi status `PASS` hanya berdasarkan review desain. `PASS` memerlukan implementasi dan bukti yang dapat direproduksi.
