# Change Request CR-001 — IPL Fee Definition

**Change Request ID:** CR-001  
**Date:** 7 Oktober 2026  
**Requested By:** Product Owner  
**PRD Version:** 1.1  

## Reason

Menetapkan nominal serta cakupan IPL yang sebelumnya belum didefinisikan secara eksplisit pada PRD.

## Current Behavior

PRD mendefinisikan alur dan status IPL, tetapi tidak menetapkan nominal baku atau komponen layanan yang dicakup.

## Proposed Behavior

- IPL sebesar Rp100.000 per kepala keluarga per periode bulanan.
- Satu kepala keluarga mewakili satu household/rumah aktif.
- IPL mencakup keamanan, kebersihan, dan lingkungan.
- Household member tidak menghasilkan bill tambahan.

## Impact

### Database Impact

Tidak mengubah collection utama. Monthly bill generator harus menggunakan amount `100000` dari protected backend/system configuration dan memastikan uniqueness per `houseId + period`.

### Frontend Impact

Home, IPL Overview, IPL Detail, instruksi pembayaran, riwayat, dan bukti pembayaran menampilkan Rp100.000 serta cakupan layanan.

### Backend Impact

`generateMonthlyBills()` menghasilkan satu bill Rp100.000 untuk setiap household aktif dan bersifat idempotent per periode.

### Security Impact

Nominal tetap ditentukan backend. Client tidak boleh mengganti nominal saat submit payment proof.

### Test Impact

- Bill generator menghasilkan tepat satu bill Rp100.000 per household aktif per periode.
- Household member tidak menghasilkan bill terpisah.
- Client submission dengan nominal berbeda ditolak atau diabaikan sesuai server-side contract.
- Duplicate bill untuk `houseId + period` dicegah.

## Approval

Dicatat dari instruksi langsung Product Owner pada 7 Oktober 2026.
