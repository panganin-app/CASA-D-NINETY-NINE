# Internet Billing and Payment Blueprint

## 1. Prinsip

Modul internet adalah domain terpisah dari IPL. Keduanya dapat memakai pola pembayaran transfer BCA dan upload bukti, tetapi bill, payment, status, serta audit trail tidak boleh digabung.

```text
IPL Bill      → IPL Payment      → IPL Status
Internet Bill → Internet Payment → Internet Active Period
```

Tidak ada perubahan otomatis pada router. Sistem hanya mencatat status administratif langganan.

## 1.1 Paket resmi

Paket internet tersedia dalam periode bulanan:

| Paket | Kecepatan | Harga per bulan |
|---|---:|---:|
| Internet 25 | 25 Mbps | Rp125.000 |
| Internet 50 | 50 Mbps | Rp180.000 |
| Internet 100 | 100 Mbps | Rp250.000 |

Tidak ada paket lain tanpa Change Request. Harga dan package ID harus berasal dari backend configuration, bukan dari client.

## 2. Resident flow

```text
Home / Informasi
      ↓
Internet
      ↓
Lihat Paket dan Masa Aktif
      ↓
Lihat Tagihan Internet
      ↓
Instruksi Transfer BCA
      ↓
Upload Bukti Transfer
      ↓
PENDING_VERIFICATION
      ↓
Committee Review
      ├── APPROVED
      │      ↓
      │  Bill = PAID
      │  Subscription activeUntil diperpanjang backend
      │
      └── REJECTED
             ↓
         Bill tetap UNPAID
         Masa aktif tidak berubah
```

## 3. Masa aktif

Perhitungan dilakukan backend:

```text
baseDate = max(current activeUntil, payment verified date)
newActiveUntil = baseDate + purchased duration
```

Aturan ini berarti:

- Renewal sebelum masa aktif habis meneruskan dari `activeUntil` sebelumnya.
- Renewal setelah masa aktif habis dimulai dari tanggal pembayaran diverifikasi.
- Retry verification tidak boleh menambah periode dua kali.
- Rejected payment tidak mengubah masa aktif.
- Perubahan manual wajib memiliki alasan dan audit log.

Timezone bisnis untuk tanggal masa aktif:

```text
Asia/Jakarta
```

## 4. Status

### Subscription status

```text
PENDING_ACTIVATION
ACTIVE
EXPIRING_SOON
EXPIRED
SUSPENDED
TERMINATED
```

`SUSPENDED` dan `TERMINATED` adalah status administratif. Sistem tidak mengeksekusi pemutusan jaringan.

### Bill status

```text
UNPAID
PENDING_VERIFICATION
PAID
OVERDUE
CANCELLED
```

### Payment status

```text
PENDING_VERIFICATION
APPROVED
REJECTED
```

## 5. Data model

### Internet packages

```text
internet_packages/{packageId}
```

```text
name
description
speedLabel
price
durationValue
durationUnit
status
createdAt
updatedAt
```

Seed package production:

```text
INTERNET_25
speedLabel = "25 Mbps"
price = 125000
durationValue = 1
durationUnit = "MONTH"

INTERNET_50
speedLabel = "50 Mbps"
price = 180000
durationValue = 1
durationUnit = "MONTH"

INTERNET_100
speedLabel = "100 Mbps"
price = 250000
durationValue = 1
durationUnit = "MONTH"
```

`speedLabel` hanya informasi paket, bukan hasil pembacaan router.

### Internet subscriptions

```text
internet_subscriptions/{subscriptionId}
```

```text
houseId
primaryResidentId
packageId
status
activeFrom
activeUntil
lastApprovedPaymentId
createdAt
updatedAt
```

### Internet bills

```text
internet_bills/{billId}
```

```text
subscriptionId
houseId
residentId
packageId
period
durationValue
durationUnit
amount
dueDate
status
createdAt
updatedAt
```

### Internet payments

```text
internet_payments/{paymentId}
```

```text
billId
subscriptionId
houseId
residentId
amount
bank
transferDate
proofUrl
proofUploadedAt
status
verifiedBy
verifiedAt
rejectionReason
idempotencyKey
createdAt
updatedAt
```

## 6. Verification transaction

`verifyInternetPayment()` harus menjalankan satu transaksi atomik:

1. Validasi authentication dan role.
2. Ambil payment, bill, subscription, dan package.
3. Pastikan payment masih `PENDING_VERIFICATION`.
4. Pastikan amount berasal dari bill/backend, bukan client.
5. Ubah payment menjadi `APPROVED`.
6. Ubah bill menjadi `PAID`.
7. Hitung dan simpan `activeUntil` baru.
8. Simpan `lastApprovedPaymentId` untuk idempotency.
9. Tulis audit log.
10. Commit transaction.
11. Kirim notifikasi setelah commit; kegagalan notifikasi tidak membatalkan transaksi.

## 7. Resident screens

### Internet Overview

- Package name dan speed label.
- Status subscription.
- `Aktif sampai` dengan tanggal jelas.
- Days remaining.
- Current bill.
- CTA `Bayar Internet` atau `Lihat Status`.
- Payment history.

### Payment

- Package dan periode yang dibeli.
- Harga backend-confirmed.
- Instruksi transfer BCA.
- Upload bukti.
- Pending verification.
- Approved dan active-period confirmation.
- Rejected dengan alasan dan upload ulang.

## 8. Admin screens

- Packages.
- Subscriptions.
- Internet bills.
- Pending payment verification.
- Subscription detail dan active-period history.
- Manual correction dialog dengan mandatory reason.
- Audit log.

## 9. Notifications

```text
Internet bill generated
Payment submitted
Payment approved
Payment rejected
Subscription expiring soon
Subscription expired
```

Notifikasi `expired` tidak berarti koneksi router sudah diputus.

## 10. Configuration still required

Nilai berikut harus disediakan melalui backend/admin configuration, bukan hard-coded di client:

- Due date policy.
- Expiring-soon threshold.
- Rekening BCA tujuan: sama dengan IPL atau rekening internet terpisah.

## 11. Acceptance criteria

- Resident hanya melihat subscription dan payment milik household-nya.
- Satu approved payment memperpanjang masa aktif tepat satu kali.
- Renewal sebelum expiry melanjutkan dari tanggal expiry lama.
- Renewal setelah expiry dimulai dari tanggal verifikasi.
- Rejected payment tidak mengubah masa aktif.
- Client tidak dapat mengubah `PAID` atau `activeUntil`.
- Tidak ada credential atau API router pada mobile/admin/backend modul ini.
- Semua approval, rejection, dan manual correction tercatat pada audit log.
