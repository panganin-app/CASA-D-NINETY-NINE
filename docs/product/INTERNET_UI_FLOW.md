# Resident Internet UI Flow

## Status

UI/UX baseline resident untuk modul Internet telah lengkap.

## Flow map

```text
Internet Overview
    │
    ├── Lihat Riwayat ───────────────→ Payment History
    │
    └── Perpanjang Masa Aktif
             ↓
       Package Selection
             ↓
       BCA Payment + Empty Proof
             ↓
       BCA Payment + Proof Ready
             ↓
       Submit Payment Proof
             ↓
       PENDING_VERIFICATION
             │
             ├── APPROVED
             │      ↓
             │   Bill PAID
             │   activeUntil extended once
             │
             └── REJECTED
                    ↓
                 Bill remains UNPAID
                 activeUntil unchanged
                 Upload proof again
```

## Screen inventory

| Order | Screen | File | Primary state |
|---:|---|---|---|
| 1 | Internet Overview | `assets/mockups/resident-internet-overview-v1.png` | ACTIVE |
| 2 | Package Selection | `assets/mockups/resident-internet-renewal-v2.png` | Internet 50 selected example |
| 3 | Payment Empty Proof | `assets/mockups/resident-internet-payment-v1.png` | submit disabled |
| 4 | Payment Proof Ready | `assets/mockups/resident-internet-payment-ready-v1.png` | submit enabled |
| 5 | Verification Pending | `assets/mockups/resident-internet-pending-v1.png` | PENDING_VERIFICATION |
| 6 | Payment Approved | `assets/mockups/resident-internet-approved-v1.png` | APPROVED / PAID |
| 7 | Payment Rejected | `assets/mockups/resident-internet-rejected-v1.png` | REJECTED / UNPAID |
| 8 | Payment History | `assets/mockups/resident-internet-history-v1.png` | mixed history |

## Locked package catalog

| ID | Speed | Price | Duration |
|---|---:|---:|---|
| INTERNET_25 | 25 Mbps | Rp125.000 | 1 month |
| INTERNET_50 | 50 Mbps | Rp180.000 | 1 month |
| INTERNET_100 | 100 Mbps | Rp250.000 | 1 month |

## Client state rules

### Package selection

- Package ID, speed label, price, and duration are read from backend configuration.
- Client may select a valid active package but does not calculate authoritative price.
- Backend returns the bill and total used for payment.

### Payment proof

- Empty proof keeps submit disabled.
- Supported visual contract: JPG/PNG, maximum 5 MB.
- Client validates early, but Storage Rules and backend validate again.
- Proof preview must not leak outside the owning household and authorized committee.

### Pending verification

- Payment remains `PENDING_VERIFICATION`.
- Bill remains `PENDING_VERIFICATION`.
- `activeUntil` remains unchanged.
- Resident cannot edit or cancel the submitted proof while verification is in progress.

### Approved

- Backend transaction changes payment to `APPROVED` and bill to `PAID`.
- Backend extends `activeUntil` exactly once.
- Notification failure does not roll back the approved transaction.
- Router/network activation remains manual.

### Rejected

- Payment changes to `REJECTED`.
- Bill remains/returns `UNPAID`.
- `activeUntil` remains unchanged.
- Rejection reason is required.
- Resident may start a new proof submission for the same unpaid bill according to duplicate-submission rules.

## Required implementation components

```text
InternetStatusCard
InternetPackageCard
PackageRadioRow
TransactionProgress
PaymentSummaryCard
BcaTransferCard
TransferDateField
PaymentProofPicker
PaymentProofPreview
VerificationStatusHero
VerificationTimeline
PaymentHistoryFilter
PaymentHistoryRow
AdministrativeNetworkNotice
```

## Accessibility

- Status is represented by text and icon, not color alone.
- Package rows and buttons use minimum 44 x 44 touch targets.
- Proof picker exposes accessible labels and upload progress.
- Error and rejection reasons are announced to screen readers.
- Dates use full Indonesian labels.
- Disabled controls maintain readable contrast.

## Testing scenarios

1. Load active subscription.
2. Select each of three official packages.
3. Reject unknown or inactive package ID.
4. Price shown by client matches backend bill.
5. Submit remains disabled without transfer date and proof.
6. Reject invalid type, oversize file, or unauthorized storage path.
7. Successful submission enters `PENDING_VERIFICATION`.
8. Retry does not create duplicate active payment.
9. Approval extends active period exactly once.
10. Rejection leaves active period unchanged.
11. History filter shows matching statuses.
12. Offline mode never shows a successful submit.
13. Notification failure does not corrupt payment state.
14. No screen implies router activation or disconnection.

## Out of scope

- Router, MikroTik, OLT, or RADIUS integration.
- Wi-Fi credential management.
- Signal diagnostics or speed test.
- Automatic activation or disconnection.
- Payment methods other than transfer Bank BCA.
