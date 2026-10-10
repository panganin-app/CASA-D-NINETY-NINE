# Stitch Prompt — Resident Mobile Home Screen

## Input asset

Upload logo resmi berikut sebagai visual reference:

```text
assets/brand/casa-dninetynine-logo-official-no-tagline.png
```

Gunakan desain Login Screen terpilih sebagai style reference jika sudah tersedia.

---

## Primary prompt

```text
Design a polished, production-ready resident mobile Home Screen for CASA D'NINETY NINE, a modern residential community application in Indonesia.

Use the uploaded official CASA logo only as a brand reference. Preserve its dark navy blue, warm gold, white, and warm-gray color language. The interface must feel visually consistent with the approved CASA login screen.

Product context:
- this is the authenticated home screen for residents
- the application centralizes residential information, IPL billing, announcements, events, resident reports, finance transparency, CCTV access, notifications, and profile information
- the experience should feel warm, safe, organized, community-oriented, and easy to use
- do not make it look like a dense enterprise dashboard

Canvas:
- portrait mobile screen
- approximately 390 x 844 logical pixels
- Android and iOS compatible
- respect top and bottom safe areas
- vertically scrollable content with fixed bottom navigation

Visual direction:
- modern residential community
- premium but approachable
- clean card-based layout
- dark navy as primary color
- warm gold as restrained accent only
- off-white page background
- white content surfaces
- soft warm-gray borders
- geometric sans-serif typography
- medium rounded corners
- restrained shadows
- accessible contrast
- minimum touch target 44 x 44 pixels

Header:
1. Create a compact top header with a small CASA brand mark or wordmark on the left.
2. Add a notification bell on the right with a small unread indicator.
3. Do not use a large logo that consumes excessive vertical space.

Resident greeting section:
1. Show greeting: "Selamat pagi, Bapak Andi"
2. Show supporting identity: "Blok A2 No. 15"
3. Add a small circular resident avatar or initials.
4. Add a subtle contextual line: "Semoga hari Anda menyenangkan."
5. Keep this section compact and friendly.

IPL status card — highest priority content:
1. Create one prominent card near the top.
2. Title: "Tagihan IPL"
3. Period: "Oktober 2026"
4. Amount: "Rp100.000"
5. Due date: "Jatuh tempo 15 Oktober 2026"
6. Status badge: "Belum Dibayar"
7. Primary action: "Lihat Tagihan"
8. Add a simple receipt or home-fee icon.
9. Add compact supporting text: "Keamanan • Kebersihan • Lingkungan"
10. Use clear hierarchy and restrained gold accent.
11. Do not show QRIS, e-wallet, virtual account, payment gateway, or payment methods other than transfer BCA.

Quick actions:
1. Section title: "Akses Cepat"
2. Use a compact grid of four actions:
   - "Bayar IPL"
   - "CCTV"
   - "Buat Laporan"
   - "Keuangan"
3. Use simple consistent line icons.
4. Avoid oversized colorful icon tiles.

Latest announcement:
1. Section title: "Pengumuman Terbaru"
2. Add action: "Lihat Semua"
3. Show one primary announcement card:
   - category badge: "Informasi"
   - title: "Kerja Bakti Lingkungan"
   - summary: "Kerja bakti rutin akan dilaksanakan pada Minggu pagi."
   - date: "11 Oktober 2026"
   - unread indicator
4. Keep the summary to two lines maximum.

Upcoming agenda:
1. Section title: "Agenda Terdekat"
2. Add action: "Lihat Semua"
3. Show one compact event card:
   - date block: "18 OCT"
   - title: "Pertemuan Warga Bulanan"
   - time: "19.30 WIB"
   - location: "Balai Warga CASA"
4. Use clear date, time, and location hierarchy.

Bottom navigation — locked information architecture:
1. Fixed bottom navigation with exactly five destinations:
   - "Home"
   - "IPL"
   - "CCTV"
   - "Informasi"
   - "Profil"
2. Home is the active destination.
3. Use icons plus short Indonesian labels.
4. Use dark navy for the active item and neutral gray for inactive items.
5. Do not add a floating action button.
6. Do not rename, remove, or add navigation destinations.

Interaction and state requirements:
- tapping the IPL card or "Lihat Tagihan" opens the current IPL bill
- tapping quick actions routes to the corresponding feature
- tapping the notification bell opens notifications
- announcement and agenda cards are individually tappable
- content uses backend-confirmed status; never visually mark IPL as paid without confirmed backend data
- preserve clear loading, empty, error, offline, unauthorized, and forbidden states
- use skeleton loading for first load
- show a compact offline banner without blocking cached read-only content

Do not add:
- marketplace
- e-commerce
- visitor management
- delivery tracking
- chat
- social feed
- ads
- promotions
- QRIS
- DANA
- GoPay
- OVO
- virtual account
- payment gateway
- unrelated metrics or charts
- invented features not defined above

Output:
1. One high-fidelity default Home Screen using the UNPAID IPL state.
2. One variation with IPL status PENDING_VERIFICATION.
3. One loading/skeleton state.
4. One offline state with cached read-only content.
5. Reusable component structure suitable for transfer to Figma and implementation in Flutter.
```

---

## Compact prompt

Gunakan versi ini jika Stitch lambat ketika menerima prompt panjang:

```text
Create a high-fidelity mobile Home Screen for the authenticated resident app CASA D'NINETY NINE. Use the uploaded official logo as the brand reference and derive a clean palette of dark navy, restrained warm gold, off-white, white, and warm gray.

The UI must feel modern, warm, secure, premium but approachable, and suitable for a residential community. Use a vertically scrollable layout with a fixed five-item bottom navigation.

Include:
- compact header with CASA brand mark and notification bell with unread dot
- greeting "Selamat pagi, Bapak Andi"
- resident identity "Blok A2 No. 15"
- prominent IPL card: "Oktober 2026", "Rp100.000", "Jatuh tempo 15 Oktober 2026", "Keamanan • Kebersihan • Lingkungan", status "Belum Dibayar", button "Lihat Tagihan"
- quick actions: "Bayar IPL", "CCTV", "Buat Laporan", "Keuangan"
- latest announcement: "Kerja Bakti Lingkungan", dated "11 Oktober 2026"
- upcoming event: "Pertemuan Warga Bulanan", "18 OCT", "19.30 WIB", "Balai Warga CASA"
- fixed bottom navigation with exactly: Home, IPL, CCTV, Informasi, Profil

Use clean white cards, medium corner radius, restrained shadows, simple line icons, readable Indonesian typography, accessible contrast, and minimum 44 x 44 pixel touch targets. Home is active in the navigation.

Do not add new features, social feeds, chat, ads, marketplace, visitor management, floating action buttons, charts, QRIS, e-wallets, virtual accounts, or payment gateways. IPL payment is only through bank transfer BCA and the client must never imply PAID without backend confirmation.

Create the default UNPAID state, PENDING_VERIFICATION variation, skeleton loading state, and offline state.
```

---

## State refinement prompts

### Pending verification

```text
Keep the Home Screen layout and all design tokens unchanged. Change only the IPL card to the PENDING_VERIFICATION state. Replace the unpaid badge with "Menunggu Verifikasi", use a calm warning color, replace the primary action with "Lihat Status", and add supporting text "Bukti pembayaran sedang diperiksa pengurus." Do not display PAID or success confirmation.
```

### Loading

```text
Keep the Home Screen layout unchanged and create its initial loading state. Replace dynamic resident, IPL, announcement, and agenda content with subtle skeleton placeholders. Keep the bottom navigation visible. Do not use a full-screen spinner and do not show fake data while loading.
```

### Offline

```text
Keep the Home Screen layout unchanged and create an offline state. Show a compact non-blocking banner reading "Anda sedang offline. Data terakhir ditampilkan." Preserve available cached read-only content, visually disable actions that require a network connection, and provide a small "Coba Lagi" action. Never imply that an online operation succeeded.
```

---

## Review checklist

- [ ] Home screen tidak terasa seperti dashboard enterprise.
- [ ] Header dan greeting tetap compact.
- [ ] Status IPL menjadi fokus utama.
- [ ] Tidak ada metode pembayaran selain transfer BCA.
- [ ] Client tidak mengesankan status `PAID` tanpa konfirmasi backend.
- [ ] Quick actions hanya berisi fitur PRD.
- [ ] Announcement dan agenda mudah dipindai.
- [ ] Bottom navigation tepat lima item sesuai PRD.
- [ ] Tidak ada floating action button atau fitur tambahan.
- [ ] Warna konsisten dengan logo resmi.
- [ ] Bahasa Indonesia konsisten.
- [ ] Loading, pending verification, dan offline state tersedia.
- [ ] Struktur dapat ditransfer ke Figma dan Flutter.
