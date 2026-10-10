# CASA D'NINETY NINE

Monorepo resmi untuk Resident Mobile App, Admin Web, backend Firebase, konfigurasi keamanan, pengujian, dan deployment Casa D'Ninety Nine.

Sumber kebutuhan produk: [`docs/product/CASA_DNINETY_NINE_PRD_v1.1.md`](docs/product/CASA_DNINETY_NINE_PRD_v1.1.md).

## Struktur utama

```text
apps/
  mobile/                 Flutter Resident Mobile App
  admin/                  Next.js / React Admin Web
backend/
  functions/              Firebase Cloud Functions dan business logic
firebase/
  firestore/              Firestore rules, indexes, dan seed definitions
  storage/                Storage rules
packages/
  contracts/              Kontrak data/API lintas aplikasi
  design_tokens/          Token desain lintas mobile dan web
  test_fixtures/          Data uji non-production
docs/
  architecture/           Arsitektur dan keputusan teknis
  product/                Requirement mapping dan acceptance criteria
  runbooks/               Operasional, deployment, backup, recovery
  testing/                Test plan dan bukti UAT
infra/
  environments/           Konfigurasi development, staging, production
scripts/                   Otomasi lokal dan CI/CD
tests/
  e2e/                     End-to-end test lintas sistem
  security/                Rules dan authorization test
.github/workflows/         CI/CD pipelines
```

## Dokumen utama implementasi

Lihat [`docs/architecture/IMPLEMENTATION_STRUCTURE.md`](docs/architecture/IMPLEMENTATION_STRUCTURE.md) untuk struktur dari hulu sampai siap publish.

Handoff implementasi terbaru:

- [`docs/MASTER_DELIVERY_INDEX.md`](docs/MASTER_DELIVERY_INDEX.md)
- [`docs/product/UI_UX_HANDOFF.md`](docs/product/UI_UX_HANDOFF.md)
- [`docs/product/SCREEN_STATE_MATRIX.md`](docs/product/SCREEN_STATE_MATRIX.md)
- [`docs/product/REQUIREMENT_TRACEABILITY_MATRIX.md`](docs/product/REQUIREMENT_TRACEABILITY_MATRIX.md)
- [`docs/security/SECURITY_AUDIT.md`](docs/security/SECURITY_AUDIT.md)
- [`docs/testing/UAT_ACCEPTANCE.md`](docs/testing/UAT_ACCEPTANCE.md)
- [`docs/runbooks/PUBLISH_READINESS.md`](docs/runbooks/PUBLISH_READINESS.md)
- [`packages/design_tokens/tokens.json`](packages/design_tokens/tokens.json)

## Keputusan yang dikunci

- Mobile: Flutter.
- Admin: Next.js / React.
- Backend: Firebase Auth, Firestore, Storage, Cloud Functions, FCM, dan App Check.
- Pembayaran IPL: transfer Bank BCA saja.
- Status pembayaran final hanya ditentukan backend setelah verifikasi pengurus.
- CCTV menggunakan Hikvision DVR melalui secure streaming gateway.
- Development, staging, dan production wajib terpisah.

Repositori ini belum menyimpan credential, nomor rekening, service account, atau secret production.
