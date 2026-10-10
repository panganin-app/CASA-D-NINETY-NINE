# IPL Business Rules

## Current source of truth

### Nominal

IPL ditetapkan sebesar:

> **Rp100.000 per kepala keluarga per periode bulanan**

`Per kepala keluarga` berarti satu tagihan untuk satu household/rumah aktif pada satu periode, bukan satu tagihan untuk setiap akun anggota keluarga.

### Cakupan iuran

Nominal IPL tersebut sudah mencakup:

- Keamanan
- Kebersihan
- Lingkungan

### Billing identity

- Bill harus terikat pada `houseId`/household yang memiliki kepala keluarga aktif.
- `residentId` pada bill menunjuk primary resident/kepala keluarga pada saat bill dibuat.
- Household member dapat diberi akses melihat tagihan sesuai permission, tetapi tidak menghasilkan tagihan tambahan.
- Satu household aktif hanya memiliki satu bill IPL aktif untuk periode yang sama.

### Payment method

Metode pembayaran tetap hanya:

> **Transfer Bank BCA**

### Critical state rule

Client tidak boleh menetapkan status bill menjadi `PAID`. Status final hanya ditentukan backend setelah payment proof diverifikasi Committee atau Super Admin.

## UI copy

```text
Iuran Pengelolaan Lingkungan
Rp100.000 / bulan
Mencakup keamanan, kebersihan, dan lingkungan
```

## Effective date

Aturan ini dicatat pada 7 Oktober 2026 dan berlaku sebagai acuan desain serta implementasi berikutnya.
