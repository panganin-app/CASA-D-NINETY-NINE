# Stitch Master Prompt — CASA D'NINETY NINE

Gunakan prompt ini sebagai system brief proyek, lalu kirim satu screen request per generation agar Stitch tetap cepat dan konsisten.

```text
Design a production-ready UI system for CASA D'NINETY NINE, an Indonesian residential community platform with a Flutter resident mobile app and a Next.js admin web app.

LANGUAGE
- All user-facing copy in Bahasa Indonesia.
- Dates use Indonesian format and Asia/Jakarta timezone.
- Currency uses id-ID formatting.

BRAND
- Primary navy #0B3568, dark navy #06264D, gold #C99A43.
- Warm off-white canvas #F7F8FA, white cards, accessible semantic colors.
- Modern, premium, calm residential-community feeling; not an overly complex enterprise dashboard.
- Use the official CASA logo without the tagline.

MOBILE LAYOUT
- 360–430 logical-pixel responsive canvas; no device frame.
- Four-item bottom navigation: Beranda, Tagihan, Informasi, Profil.
- Minimum 48px touch targets, readable typography, rounded cards, restrained shadows.

ADMIN LAYOUT
- Responsive desktop dashboard with navy sidebar and white content canvas.
- Sidebar: Dashboard, Warga, Rumah, IPL, Pembayaran, Internet, Keuangan, Laporan, Informasi, Agenda, CCTV, Notifikasi, Audit Log, Pengaturan.
- Tables must support search, filters, pagination, empty/loading/error, keyboard focus, and detail drawer.

LOCKED BUSINESS RULES
- IPL is Rp100.000 per household head per month and covers Keamanan, Kebersihan, Lingkungan.
- Payment is bank transfer BCA only. Never show QRIS, wallet, card, cash, or invented account numbers.
- The client never marks a payment PAID. Only backend approval does.
- Internet packages: 25 Mbps Rp125.000/month; 50 Mbps Rp180.000/month; 100 Mbps Rp250.000/month.
- Internet payment follows the resident active period. Network/router activation is manual; no router automation.
- Residents see only published finance data.
- CCTV uses authorized short-lived live sessions; no face recognition, PTZ, recording download, RTSP URL, or DVR credential.

GLOBAL STATES
Every screen must define Loading, Success, Empty, Error, Offline, Unauthorized, and Forbidden. Critical actions need disabled/loading/success/failure states and confirmation where destructive or irreversible.

ACCESSIBILITY
- WCAG AA text contrast, visible focus, color plus text/icon status cues, semantic form labels, screen-reader order.

Do not add ads, social engagement metrics, marketplace features, payment gateways, or English UI labels.
```

## Urutan generation

1. Login → Home → shared mobile shell/components.
2. IPL overview → payment → ready → pending → approved → rejected.
3. Internet overview → package selection → payment states → history.
4. Information feed/detail → report history/create → finance → CCTV list/live → profile.
5. Admin shell/dashboard → payments → internet → residents/houses → reports → finance → content → CCTV.

Gunakan mockup pada `assets/mockups/` sebagai visual reference. Hindari meminta banyak layar dalam satu prompt karena hasil teks dan hierarchy cenderung menurun.
