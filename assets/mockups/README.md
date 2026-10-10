# UI/UX Mockups

## Resident Login Screen

`resident-login-screen-v3.png` adalah baseline high-fidelity terbaru untuk Login Screen Resident Mobile App.

`resident-login-screen-v1.png` dan `resident-login-screen-v2.png` dipertahankan sebagai riwayat versi sebelumnya.

Coverage:

- Official CASA logo tanpa tagline
- Full-screen residential hero image
- Compact bottom-sheet login form
- Heading `Selamat Datang Warga`
- Heading langsung diikuti field login tanpa supporting copy
- Email/nomor telepon dan password fields
- Password visibility control
- Lupa kata sandi, primary login action, dan bantuan admin
- Image-first composition yang mempertahankan fasad rumah sebagai visual dominan

## Resident Home Screen

`resident-home-screen-v2.png` adalah baseline high-fidelity terbaru untuk Home Screen Resident Mobile App.

`resident-home-screen-v1.png` dipertahankan sebagai riwayat versi sebelumnya.

Coverage:

- Header dan notification indicator
- Resident greeting dan house identity
- IPL `UNPAID` status card dengan nominal Rp100.000
- Cakupan IPL: keamanan, kebersihan, dan lingkungan
- Quick actions
- Pengumuman terbaru
- Agenda terdekat
- Locked five-item bottom navigation

Mockup ini adalah visual reference. Implementasi final tetap harus memakai reusable Flutter components, design tokens, backend-confirmed state, accessibility, dan responsive behavior.

## Resident IPL

Baseline flow:

- `resident-ipl-overview-v1.png`
- `resident-ipl-payment-v1.png`
- `resident-ipl-payment-ready-v1.png`
- `resident-ipl-pending-v1.png`
- `resident-ipl-approved-v1.png`
- `resident-ipl-rejected-v1.png`

Flow mengunci IPL Rp100.000/KK/bulan, cakupan keamanan/kebersihan/lingkungan, transfer BCA, upload bukti, verifikasi admin, dan state approve/reject. Nomor rekening tetap berasal dari backend.

## Resident Internet Overview

`resident-internet-overview-v1.png` adalah baseline high-fidelity Internet Overview Screen.

Coverage:

- Subscription status `Aktif`
- Tanggal akhir dan sisa masa aktif
- Paket aktif tanpa mengarang harga atau kecepatan
- Perpanjang masa aktif
- Empty current-bill state
- Pembayaran terakhir
- Penjelasan bahwa aktivasi/pemutusan jaringan dilakukan manual
- Locked bottom navigation dengan `Informasi` aktif

## Resident Internet Renewal

`resident-internet-renewal-v2.png` adalah baseline high-fidelity terbaru untuk pemilihan paket dan perpanjangan internet.

`resident-internet-renewal-v1.png` adalah rancangan awal sebelum katalog paket ditetapkan dan disimpan sebagai riwayat.

Coverage:

- Katalog resmi 25 Mbps/Rp125.000, 50 Mbps/Rp180.000, dan 100 Mbps/Rp250.000 per bulan
- Selected-package state
- Current dan new active-period calculation
- Total pembayaran backend-controlled
- Manual network activation notice
- Transaction progress indicator

## Resident Internet Payment

`resident-internet-payment-v1.png` adalah baseline high-fidelity untuk instruksi transfer BCA dan upload bukti pembayaran internet.

Coverage:

- Paket Internet 50 dan total Rp180.000 sebagai selected-flow example
- Progress step `Pembayaran`
- Rekening BCA dari backend configuration dengan placeholder aman
- Tanggal transfer
- Protected payment-proof upload
- Pending-verification notice
- Disabled submit state sebelum bukti diunggah
- Tidak ada metode pembayaran selain transfer BCA

`resident-internet-payment-ready-v1.png` adalah state setelah tanggal transfer dan bukti dipilih, sebelum submit.

Coverage:

- Uploaded-file preview tanpa data sensitif
- Confirmation checkbox
- Active submit button
- Data belum berstatus paid/approved

## Resident Internet Pending Verification

`resident-internet-pending-v1.png` adalah state setelah bukti berhasil dikirim.

Coverage:

- Status `PENDING_VERIFICATION`
- Masa aktif belum berubah
- Verification timeline
- Tidak ada edit/cancel selama verifikasi

## Resident Internet Approved

`resident-internet-approved-v1.png` adalah state setelah pembayaran disetujui.

Coverage:

- Payment `APPROVED`
- Bill `PAID`/Lunas
- Masa aktif baru 20 Desember 2026 pada contoh flow
- Completed verification timeline
- Manual network-activation notice

## Resident Internet Rejected

`resident-internet-rejected-v1.png` adalah state setelah pembayaran ditolak.

Coverage:

- Payment `REJECTED`
- Rejection reason
- Bill tetap belum dibayar
- Masa aktif tidak berubah
- Upload ulang bukti

## Resident Internet Payment History

`resident-internet-history-v1.png` adalah baseline riwayat pembayaran internet.

Coverage:

- Filter Semua, Disetujui, Menunggu, Ditolak
- Grouping per bulan
- Official package prices only
- Approved dan rejected examples
- Tappable transaction detail rows

## Resident Community, CCTV, Reports, Finance, Profile

- `resident-community-feed-v1.png` — feed pengumuman/kegiatan/lingkungan.
- `resident-community-detail-v1.png` — detail konten dan agenda.
- `resident-cctv-list-v1.png` — daftar kamera serta health state.
- `resident-cctv-live-v1.png` — live session tanpa credential/URL permanen.
- `resident-report-history-v1.png` — riwayat dan status laporan.
- `resident-report-create-v1.png` — form laporan dengan attachment dan privacy notice.
- `resident-finance-v1.png` — ringkasan keuangan yang telah dipublikasikan.
- `resident-profile-v1.png` — profil, akun, keamanan, bantuan, dan logout.

## Admin Web

- `admin-dashboard-v2.png` — baseline dashboard terbaru; v1 disimpan sebagai riwayat.
- `admin-payment-verification-v1.png` — antrean dan drawer verifikasi IPL/internet.
- `admin-internet-management-v1.png` — masa aktif serta aktivasi manual.
- `admin-community-content-v1.png` — draft dan publish informasi.
- `admin-resident-house-management-v1.png` — warga, rumah, household, akun.
- `admin-report-management-v1.png` — laporan, assignment, timeline, status.
- `admin-finance-publication-v1.png` — selection dan publication snapshot.
- `admin-cctv-access-v1.png` — kamera, permission per user, dan audit akses.

Seluruh mockup adalah visual contract. Data contoh bersifat sintetis; implementasi wajib memask data sensitif dan memakai data backend.
