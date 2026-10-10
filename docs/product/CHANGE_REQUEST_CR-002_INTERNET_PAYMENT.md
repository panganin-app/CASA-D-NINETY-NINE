# Change Request CR-002 — Internet Billing and Payment

**Change Request ID:** CR-002  
**Date:** 7 Oktober 2026  
**Requested By:** Product Owner  
**PRD Version:** 1.1  

## Reason

Menambahkan pembayaran layanan internet melalui Resident Mobile App dan pengelolaan masa aktif pelanggan tanpa integrasi otomatis ke perangkat jaringan/router.

## Current Behavior

PRD v1.1 hanya mendefinisikan billing dan pembayaran IPL melalui transfer Bank BCA.

## Proposed Behavior

- Internet menjadi modul billing terpisah dari IPL.
- Paket yang tersedia hanya 25 Mbps seharga Rp125.000/bulan, 50 Mbps seharga Rp180.000/bulan, dan 100 Mbps seharga Rp250.000/bulan.
- Resident dapat melihat status langganan, paket, periode aktif, tanggal berakhir, tagihan, dan riwayat pembayaran internet.
- Pembayaran mengikuti pola transfer Bank BCA dan upload bukti pembayaran.
- Committee/Super Admin melakukan verifikasi manual.
- Setelah pembayaran disetujui, backend memperpanjang `activeUntil` sesuai durasi paket/periode yang dibayar.
- Tidak ada integrasi otomatis ke router, MikroTik, OLT, RADIUS, captive portal, atau sistem pemutusan/aktivasi jaringan.
- Status masa aktif pada aplikasi adalah catatan administrasi/source of truth aplikasi, bukan kontrol teknis koneksi internet.

## Impact

### Navigation Impact

Internet dapat diakses dari:

- Home Quick Action `Internet`.
- `Informasi > Internet`, atau route langsung `/internet`.

Core bottom navigation tetap tidak berubah:

```text
Home
IPL
CCTV
Informasi
Profil
```

### Database Impact

Menambahkan collections:

```text
internet_packages
internet_subscriptions
internet_bills
internet_payments
```

Package seed wajib menggunakan tiga paket resmi dan harga backend-controlled.

### API/Cloud Functions Impact

Menambahkan operasi backend-authorized:

```text
createInternetPackage()
assignInternetSubscription()
generateInternetBill()
submitInternetPaymentProof()
verifyInternetPayment()
rejectInternetPayment()
extendInternetActivePeriod()
```

### Frontend Impact

Resident Mobile:

- Internet overview.
- Package and active-period detail.
- Internet bill detail.
- BCA transfer instruction.
- Upload payment proof.
- Pending, approved, and rejected states.
- Payment history.

Admin Web:

- Package management.
- Subscription assignment.
- Bill management.
- Payment verification.
- Manual correction with mandatory reason and audit log.

### Security Impact

- Client tidak boleh menentukan status `PAID`.
- Client tidak boleh menentukan atau memperpanjang `activeUntil`.
- Client tidak boleh mengubah harga, periode, paket, atau subscription owner.
- Approval, rejection, dan perubahan masa aktif dilakukan backend dan diaudit.

### Test Impact

- Ownership dan cross-house access.
- Duplicate payment protection.
- Idempotent verification.
- Perhitungan masa aktif dari backend.
- Renewal sebelum/sesudah expiry.
- Rejection tidak memperpanjang masa aktif.
- Retry tidak memperpanjang masa aktif dua kali.
- Manual correction hanya role berwenang dan wajib audit reason.
- Client tidak dapat mengganti speed, package price, atau menambahkan package di luar tiga paket resmi.

## Explicit Non-Goal

Tidak ada automasi jaringan hingga router/perangkat ISP pada versi ini.

## Approval

Dicatat dari instruksi langsung Product Owner pada 7 Oktober 2026.
