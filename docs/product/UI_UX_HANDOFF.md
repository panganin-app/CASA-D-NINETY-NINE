# CASA D'NINETY NINE — UI/UX Handoff v1.0

**Status:** Design Freeze Candidate  
**Platform:** Flutter Resident Mobile + Next.js Admin Web  
**Bahasa:** Indonesia  
**Acuan:** PRD v1.1, CR-001 IPL, CR-002 Internet

## 1. Aturan produk yang tidak boleh berubah

- IPL adalah **Rp100.000 per kepala keluarga per bulan** dan mencakup keamanan, kebersihan, serta lingkungan.
- Pembayaran IPL dan internet hanya melalui **transfer Bank BCA**.
- Nomor rekening, nama penerima, dan instruksi transfer berasal dari konfigurasi backend; mockup tidak boleh dijadikan sumber data rekening.
- Client tidak pernah menetapkan tagihan sebagai `PAID`. Status final hanya dari backend setelah persetujuan pengurus.
- Paket internet resmi hanya 25 Mbps/Rp125.000, 50 Mbps/Rp180.000, dan 100 Mbps/Rp250.000 per bulan.
- Pembayaran internet memperpanjang masa aktif. Aktivasi/pemutusan jaringan dilakukan manual dan aplikasi tidak terhubung otomatis ke router.
- CCTV menggunakan sesi sementara dari secure gateway. Credential DVR dan URL RTSP tidak boleh berada di client.
- Resident hanya melihat data keuangan yang telah dipublikasikan.

## 2. Navigasi resident

Bottom navigation final terdiri dari empat item:

1. **Beranda** — ringkasan, quick action, agenda, notifikasi.
2. **Tagihan** — IPL dan internet.
3. **Informasi** — pengumuman, agenda, laporan, dan transparansi keuangan.
4. **Profil** — data warga, rumah, keamanan akun, bantuan.

CCTV dibuka dari quick action Beranda. Struktur ini merangkum lima domain PRD tanpa membuat bottom navigation terlalu padat.

## 3. Inventaris layar resident

| Domain | Layar/acuan | Aksi utama |
|---|---|---|
| Auth | `resident-login-screen-v3.png` | Masuk, lupa kata sandi, bantuan admin |
| Home | `resident-home-screen-v2.png` | Buka tagihan, internet, CCTV, informasi |
| IPL | `resident-ipl-overview-v1.png` | Lihat tagihan dan riwayat |
| IPL | `resident-ipl-payment-v1.png` | Lihat instruksi BCA, pilih bukti |
| IPL | `resident-ipl-payment-ready-v1.png` | Kirim bukti |
| IPL | `resident-ipl-pending-v1.png` | Pantau verifikasi |
| IPL | `resident-ipl-approved-v1.png` | Unduh tanda terima |
| IPL | `resident-ipl-rejected-v1.png` | Unggah ulang bukti |
| Internet | `resident-internet-overview-v1.png` | Lihat masa aktif |
| Internet | `resident-internet-renewal-v2.png` | Pilih paket/perpanjangan |
| Internet | `resident-internet-payment-v1.png` | Instruksi BCA dan upload |
| Internet | `resident-internet-payment-ready-v1.png` | Kirim bukti |
| Internet | `resident-internet-pending-v1.png` | Pantau verifikasi |
| Internet | `resident-internet-approved-v1.png` | Lihat masa aktif baru |
| Internet | `resident-internet-rejected-v1.png` | Perbaiki bukti |
| Internet | `resident-internet-history-v1.png` | Riwayat transaksi |
| Informasi | `resident-community-feed-v1.png` | Filter dan buka konten |
| Informasi | `resident-community-detail-v1.png` | Baca, bagikan, simpan agenda |
| Laporan | `resident-report-history-v1.png` | Pantau laporan |
| Laporan | `resident-report-create-v1.png` | Kirim laporan |
| Keuangan | `resident-finance-v1.png` | Lihat data published |
| CCTV | `resident-cctv-list-v1.png` | Pilih kamera |
| CCTV | `resident-cctv-live-v1.png` | Lihat live stream, lapor gangguan |
| Profil | `resident-profile-v1.png` | Kelola akun dan bantuan |

## 4. Inventaris layar admin

| Domain | Layar/acuan | Aksi utama |
|---|---|---|
| Dashboard | `admin-dashboard-v2.png` | Pantau KPI dan antrean |
| Payment | `admin-payment-verification-v1.png` | Setujui/tolak IPL dan internet |
| Internet | `admin-internet-management-v1.png` | Kelola masa aktif manual |
| Informasi | `admin-community-content-v1.png` | Draft/publish/archive konten |
| Warga & rumah | `admin-resident-house-management-v1.png` | Kelola akun, household, dan hunian |
| Laporan | `admin-report-management-v1.png` | Assign, beri catatan, ubah status |
| Keuangan | `admin-finance-publication-v1.png` | Pilih kategori dan publish ringkasan |
| CCTV | `admin-cctv-access-v1.png` | Kelola kamera, permission, dan audit akses |

Halaman admin lain menggunakan shell dan komponen yang sama: IPL generation, Events, Notifications, Audit Logs, dan Settings. Spesifikasi perilaku serta state wajib mengikuti matriks state dan PRD; tidak perlu membuat pola visual baru.

## 5. Komponen reusable

### Mobile

- `CasaAppBar`, `CasaBottomNavigation`, `CasaPrimaryButton`, `CasaOutlinedButton`
- `CasaCard`, `StatusBadge`, `AmountText`, `InfoBanner`, `EmptyState`
- `BillSummaryCard`, `BankTransferCard`, `ProofUploader`, `PaymentTimeline`
- `FeedCard`, `EventCard`, `ReportCard`, `CameraCard`, `ProfileMenuRow`
- `LoadingSkeleton`, `InlineError`, `OfflineBanner`, `AccessDeniedState`

### Admin

- `AdminShell`, `SidebarNav`, `PageHeader`, `KpiCard`, `FilterBar`
- `DataTable`, `StatusChip`, `DetailDrawer`, `ConfirmDialog`, `AuditMeta`
- `ProofViewer`, `PeriodPicker`, `CurrencyCell`, `PublishedBadge`

## 6. Responsive dan accessibility

- Mobile baseline 360–430 logical px; konten memakai safe area dan tidak mengandalkan ukuran mockup raster.
- Admin: desktop ≥1280 px, tablet 768–1279 px dengan sidebar collapse; tabel berubah menjadi cards jika ruang tidak cukup.
- Target sentuh minimum 48×48 px, kontras teks minimum WCAG AA, fokus keyboard terlihat, label tidak hanya bergantung warna.
- Currency memakai locale `id-ID`; tanggal ditampilkan dalam Bahasa Indonesia; waktu memakai zona Asia/Jakarta.
- Loading tidak boleh menggeser layout secara drastis; aksi mutasi harus memiliki progress, timeout, dan safe retry.

## 7. Handoff developer

1. Import `packages/design_tokens/tokens.json` dan turunkan ke Flutter `ThemeExtension` serta CSS variables/Tailwind theme.
2. Implementasikan reusable shell dan state components sebelum feature screen.
3. Gunakan data fixture anonim saat visual regression; jangan hard-code data contoh mockup ke production.
4. Hubungkan semua mutasi kritis ke callable HTTPS/Cloud Functions dengan App Check, authorization, idempotency key, dan audit event.
5. Jalankan acceptance test di `docs/testing/UAT_ACCEPTANCE.md` sebelum design sign-off.

## 8. Catatan fidelity

Mockup PNG adalah **visual reference**, bukan source code dan bukan source of truth bisnis. Jika teks contoh pada raster berbeda dengan kontrak produk, kontrak produk dan data backend selalu menang.
