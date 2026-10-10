# CASA D'NINETY NINE

# Product Requirements Document & Full System Blueprint

**Version:** 1.1\
**Status:** Proposed Design Freeze / Implementation Contract\
**Platform:** Resident Mobile App + Admin Web\
**Language:** Bahasa Indonesia\
**Primary Payment:** Transfer Bank BCA\
**Mobile:** Flutter\
**Admin Web:** Next.js / React\
**Backend:** Firebase

------------------------------------------------------------------------

## 0. Document Control

### Purpose

Dokumen ini adalah **single source of truth** untuk pembangunan aplikasi
Casa D'Ninety Nine.

Dokumen mencakup:

-   Product Requirements
-   Business Rules
-   Information Architecture
-   UI/UX Specification
-   Frontend Architecture
-   Backend Architecture
-   Firestore Data Model
-   API / Cloud Functions Contract
-   Authentication & Authorization
-   Payment Architecture
-   CCTV Architecture
-   Security Architecture
-   Data Privacy
-   Notifications
-   Audit Logs
-   Testing
-   Deployment
-   Backup & Disaster Recovery
-   Monitoring
-   Development Roadmap
-   Definition of Done
-   Change Control

Dokumen ini adalah **implementation contract**, bukan sekadar dokumen
bisnis.

------------------------------------------------------------------------

# 1. Product Overview

## 1.1 Product Vision

Casa D'Ninety Nine adalah platform digital untuk mengelola kehidupan
komunitas perumahan secara terpusat, transparan, aman, dan mudah
digunakan oleh penghuni maupun pengurus.

Platform menjadi pusat layanan:

-   Informasi penghuni
-   Informasi rumah
-   IPL
-   Pembayaran IPL
-   Pengumuman
-   Agenda
-   Laporan warga
-   Transparansi keuangan
-   CCTV
-   Notifikasi
-   Profil penghuni

## 1.2 Product Goals

1.  Mempermudah penghuni mendapatkan informasi komunitas.
2.  Mempermudah proses pembayaran IPL.
3.  Membuat verifikasi pembayaran lebih terkontrol.
4.  Menyediakan transparansi keuangan.
5.  Menyediakan akses CCTV secara aman.
6.  Mempermudah pengurus mengelola data penghuni.
7.  Mengurangi proses administrasi manual.
8.  Menyediakan audit trail aktivitas penting.
9.  Menjaga privasi dan keamanan data penghuni.

------------------------------------------------------------------------

# 2. User Roles

## 2.1 Resident

Penghuni rumah.

Hak utama:

-   Melihat profil sendiri
-   Melihat rumah sendiri
-   Melihat IPL
-   Mengunggah bukti transfer
-   Melihat status pembayaran
-   Melihat pengumuman
-   Melihat agenda
-   Membuat laporan
-   Melihat informasi keuangan yang dipublikasikan
-   Mengakses CCTV jika memiliki izin
-   Menerima notifikasi

## 2.2 Household Member

Anggota keluarga yang terhubung dengan rumah.

Hak dapat dibatasi berdasarkan konfigurasi rumah dan pengurus.

## 2.3 Committee / Pengurus

Pengurus komunitas.

Hak utama:

-   Mengelola penghuni
-   Mengelola rumah
-   Membuat IPL
-   Memverifikasi pembayaran
-   Mengelola pengumuman
-   Mengelola agenda
-   Mengelola laporan
-   Mengelola transparansi keuangan
-   Mengelola CCTV permission
-   Mengirim notifikasi
-   Melihat audit log sesuai kewenangan

## 2.4 Super Admin

Administrator dengan akses tertinggi.

Hak:

-   Seluruh fungsi Committee
-   Mengelola role
-   Mengelola system settings
-   Mengelola permission
-   Mengakses audit log penuh
-   Administrative recovery
-   Mengelola konfigurasi CCTV
-   Mengelola konfigurasi sistem

------------------------------------------------------------------------

# 3. Non-Goals

Versi ini **tidak** mencakup:

-   Payment gateway
-   QRIS
-   DANA
-   GoPay
-   OVO
-   Virtual Account
-   COD
-   Marketplace
-   E-commerce
-   Integrasi kurir
-   Integrasi payment gateway pihak ketiga

Payment IPL hanya menggunakan:

> **TRANSFER BANK BCA**

------------------------------------------------------------------------

# 4. Core Business Rules

## 4.1 IPL Payment Rule

Pembayaran IPL hanya dapat dilakukan melalui:

> **Transfer Bank BCA**

Tidak boleh tersedia metode pembayaran lain.

## 4.2 IPL Payment Flow

``` text
IPL Bill Generated
        ↓
Resident melihat tagihan
        ↓
Resident melihat instruksi transfer BCA
        ↓
Resident melakukan transfer ke rekening BCA
        ↓
Resident upload bukti transfer
        ↓
Payment status = PENDING_VERIFICATION
        ↓
Committee melakukan verifikasi
        ↓
        ├── APPROVED
        │      ↓
        │   Payment = PAID
        │
        └── REJECTED
               ↓
           Resident mendapat alasan
```

## 4.3 Critical Payment Security Rule

Client **tidak boleh** menentukan:

``` text
payment.status = PAID
```

Client hanya boleh:

-   Melihat invoice
-   Melihat instruksi BCA
-   Upload bukti transfer
-   Submit payment proof

Perubahan menjadi `PAID` hanya boleh dilakukan backend melalui
authorized operation setelah Committee/Super Admin melakukan verifikasi.

------------------------------------------------------------------------

# 5. Information Architecture

## 5.1 Resident Mobile App

Main navigation:

``` text
HOME
IPL
CCTV
INFORMASI
PROFILE
```

Informasi mencakup:

-   Pengumuman
-   Agenda
-   Laporan
-   Keuangan

## 5.2 Resident Screens

### Home

-   Greeting
-   Nama penghuni
-   Nomor rumah
-   Status IPL
-   Quick actions
-   Pengumuman terbaru
-   Agenda terdekat
-   Notification indicator

### IPL

-   Current bill
-   Billing history
-   Payment status
-   BCA transfer instructions
-   Upload payment proof
-   Payment detail

### CCTV

-   Camera list
-   Camera status
-   Live stream
-   Access denied state

### Pengumuman

-   Announcement list
-   Announcement detail
-   Read/unread status

### Agenda

-   Event list
-   Event detail
-   Date/time/location

### Laporan

-   Create report
-   Report history
-   Report status
-   Report detail

### Keuangan

-   Published financial summary
-   Income
-   Expenses
-   Categories
-   Period filter

### Profile

-   Resident information
-   Household
-   Family members
-   Vehicles
-   Account
-   Notification preferences
-   Logout

------------------------------------------------------------------------

# 6. Admin Web Information Architecture

Admin navigation:

``` text
Dashboard
Residents
Houses
IPL
Payments
Finance
Reports
Announcements
Events
CCTV
Notifications
Audit Logs
Settings
```

------------------------------------------------------------------------

# 7. UI/UX Design Specification

## 7.1 General Principles

UI harus:

-   Modern
-   Clean
-   Professional
-   Residential/community oriented
-   Mudah digunakan
-   Konsisten
-   Accessible
-   Responsive

UI tidak boleh terasa seperti dashboard enterprise yang terlalu kompleks
untuk pengguna komunitas.

## 7.2 Design System

Design system harus memiliki token terpusat untuk:

``` text
Colors
Typography
Spacing
Radius
Elevation
Iconography
Buttons
Forms
Cards
Badges
Dialogs
Navigation
```

Contoh struktur:

``` text
colors/
  primary
  secondary
  background
  surface
  text
  success
  warning
  error
  info

spacing/
  xs
  sm
  md
  lg
  xl

radius/
  sm
  md
  lg
  xl
```

Nilai final harus didefinisikan dalam design system, bukan hard-coded
secara acak.

## 7.3 UI States

Setiap screen harus memiliki:

``` text
Loading
Success
Empty
Error
Offline
Unauthorized
Forbidden
```

Contoh status IPL:

``` text
NO_BILL
UNPAID
PENDING_VERIFICATION
PAID
OVERDUE
```

------------------------------------------------------------------------

# 8. User Flows

## 8.1 Authentication

``` text
Open App
 ↓
Authentication
 ↓
Login
 ↓
Validate Account
 ↓
Load Role
 ↓
Load Resident Data
 ↓
Home
```

## 8.2 IPL Payment

``` text
Home
 ↓
IPL
 ↓
View Bill
 ↓
View BCA Instructions
 ↓
Transfer BCA
 ↓
Upload Proof
 ↓
Submit
 ↓
PENDING_VERIFICATION
 ↓
Committee Review
 ↓
APPROVED / REJECTED
```

------------------------------------------------------------------------

# 9. Frontend Architecture

## 9.1 Resident Mobile

Technology:

``` text
Flutter
Dart
Riverpod
GoRouter
Firebase Auth
Cloud Firestore
Firebase Storage
Firebase Cloud Messaging
Cloud Functions
```

Recommended architecture:

``` text
Presentation
     ↓
Application / State
     ↓
Domain
     ↓
Data
     ↓
Firebase / Backend
```

Frontend tidak boleh mengandung business logic sensitif yang seharusnya
dilakukan backend.

## 9.2 Mobile Project Structure

``` text
lib/
├── core/
│   ├── constants/
│   ├── errors/
│   ├── extensions/
│   ├── network/
│   ├── permissions/
│   ├── theme/
│   └── utils/
│
├── config/
├── routing/
│
├── features/
│   ├── auth/
│   ├── home/
│   ├── ipl/
│   ├── payments/
│   ├── announcements/
│   ├── events/
│   ├── reports/
│   ├── finance/
│   ├── cctv/
│   ├── notifications/
│   └── profile/
│
├── shared/
│   ├── widgets/
│   ├── models/
│   └── components/
│
└── main.dart
```

## 9.3 State Management

Riverpod digunakan sebagai state management utama.

Contoh providers:

``` text
authProvider
residentProvider
iplProvider
paymentProvider
announcementProvider
eventProvider
reportProvider
financeProvider
cctvProvider
notificationProvider
```

Tidak boleh membuat satu global state besar yang mencampur seluruh
domain.

## 9.4 Routing

Gunakan GoRouter.

Routes harus protected berdasarkan:

-   Authentication
-   Role
-   Permission

Contoh:

``` text
/login

/home
/ipl
/ipl/:id
/payments/:id
/cctv
/announcements
/events
/reports
/finance
/profile
```

------------------------------------------------------------------------

# 10. Admin Web Architecture

Technology:

``` text
Next.js
React
TypeScript
Firebase
```

Admin web harus menggunakan protected routes.

Struktur:

``` text
app/
├── login/
├── dashboard/
├── residents/
├── houses/
├── ipl/
├── payments/
├── finance/
├── reports/
├── announcements/
├── events/
├── cctv/
├── notifications/
├── audit-logs/
└── settings/
```

Admin UI harus menerapkan role-based UI, tetapi UI restriction bukan
pengganti backend authorization.

------------------------------------------------------------------------

# 11. Backend Architecture

Core architecture:

``` text
Resident Mobile
      │
      ▼
Firebase Authentication
      │
      ▼
Firestore
      │
      ├── Resident Data
      ├── IPL
      ├── Payments
      ├── Reports
      ├── Announcements
      └── Finance
      │
      ▼
Cloud Functions
      │
      ├── Business Logic
      ├── Authorization
      ├── Payment Verification
      ├── Notifications
      ├── Audit Logging
      └── Scheduled Jobs
      │
      ▼
Firebase Storage
      │
      └── Payment Proof
```

## 11.1 Firebase Services

Required:

``` text
Firebase Authentication
Cloud Firestore
Firebase Storage
Cloud Functions
Firebase Cloud Messaging
Firebase App Check
Firebase Emulator Suite
```

Monitoring dapat menggunakan:

``` text
Crashlytics
Performance Monitoring
Cloud Logging
```

## 11.2 Backend Principle

Client tidak dipercaya untuk menentukan business-critical state.

Backend adalah source of truth.

Operasi yang harus backend-authorized:

``` text
Create IPL
Generate Monthly Bill
Submit Payment Proof
Verify Payment
Reject Payment
Publish Announcement
Create Finance Transaction
Grant CCTV Access
Revoke CCTV Access
Send Notification
Write Audit Log
```

------------------------------------------------------------------------

# 12. Cloud Functions

Recommended functions:

``` text
createIPLBill()
generateMonthlyBills()

submitPaymentProof()
verifyPayment()
rejectPayment()

publishAnnouncement()
publishEvent()

createReport()
updateReportStatus()

createFinanceTransaction()
publishFinanceReport()

grantCCTVAccess()
revokeCCTVAccess()

sendNotification()

writeAuditLog()
```

Setiap function harus:

1.  Memvalidasi authentication.
2.  Memvalidasi authorization.
3.  Memvalidasi input.
4.  Memvalidasi ownership/resource.
5.  Menjalankan business logic.
6.  Menggunakan transaction/idempotency bila diperlukan.
7.  Membuat audit log untuk operasi kritis.
8.  Mengembalikan response yang konsisten.

------------------------------------------------------------------------

# 13. Firestore Data Model

Core collections:

``` text
users
residents
households
houses
vehicles
family_members

ipl_bills
ipl_payments

announcements
events
reports

finance_transactions
finance_categories

cctv_channels
cctv_permissions

notifications

audit_logs

system_settings
```

## 13.1 Users

``` text
users/{userId}
```

Fields:

``` text
uid
email
phone
displayName
role
status
createdAt
updatedAt
lastLoginAt
```

Roles:

``` text
resident
committee
super_admin
```

## 13.2 Residents

``` text
residents/{residentId}
```

Fields:

``` text
userId
houseId
fullName
phone
email
status
photoUrl
createdAt
updatedAt
```

## 13.3 Houses

``` text
houses/{houseId}
```

Fields:

``` text
houseNumber
block
status
primaryResidentId
createdAt
updatedAt
```

## 13.4 IPL Bills

``` text
ipl_bills/{billId}
```

Fields:

``` text
houseId
residentId
period
amount
dueDate
status
createdAt
updatedAt
```

Status:

``` text
UNPAID
PENDING_VERIFICATION
PAID
OVERDUE
CANCELLED
```

## 13.5 IPL Payments

``` text
ipl_payments/{paymentId}
```

Fields:

``` text
billId
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
createdAt
updatedAt
```

Status:

``` text
PENDING_VERIFICATION
APPROVED
REJECTED
```

------------------------------------------------------------------------

# 14. BCA Payment Configuration

BCA account information harus berada pada backend/system configuration.

Contoh:

``` text
bankName
accountNumber
accountHolder
paymentInstruction
```

Sensitive financial configuration tidak boleh hard-coded di aplikasi.

------------------------------------------------------------------------

# 15. Payment Proof Storage

Recommended structure:

``` text
payment-proofs/
  {houseId}/
    {billId}/
      {paymentId}/
        receipt.jpg
```

Storage access harus protected.

Resident hanya boleh mengakses bukti pembayaran miliknya sendiri.

Committee hanya dapat mengakses sesuai authorization.

------------------------------------------------------------------------

# 16. Payment Verification

Committee membuka:

``` text
Payments
 ↓
Pending Verification
 ↓
Payment Detail
 ↓
Review Proof
 ↓
Approve / Reject
```

Approve:

``` text
Payment = APPROVED
Bill = PAID
```

Reject:

``` text
Payment = REJECTED
Bill = UNPAID
```

Semua perubahan wajib menghasilkan audit log.

------------------------------------------------------------------------

# 17. Security Architecture

Security diterapkan berlapis:

``` text
Authentication
Authorization
Firestore Rules
Cloud Functions
Storage Rules
App Check
CCTV Access Control
Audit Logging
Data Validation
Rate Limiting
```

## 17.1 RBAC

  Resource         Resident     Committee   Super Admin
  ---------------- ------------ ----------- -------------
  Own Profile      RW           RW          RW
  Other Resident   \-           R           RW
  Own IPL          R            RW          RW
  Payment Proof    Own          R/W         R/W
  Verify Payment   \-           Yes         Yes
  Audit Logs       \-           Limited     Full
  CCTV             Permission   Manage      Manage
  Settings         \-           Limited     Full

## 17.2 Firestore Security Principles

Resident:

``` text
read/write own data only
```

Resident tidak boleh:

-   Read payment resident lain
-   Write `PAID`
-   Approve payment
-   Write audit log
-   Modify system settings
-   Grant CCTV access

Committee:

``` text
authorized management access
```

Super Admin:

``` text
full administrative access
```

Semua akses harus divalidasi berdasarkan UID + role + resource
ownership.

## 17.3 Storage Security

Tidak boleh menggunakan rules terbuka seperti:

``` text
allow read, write: if true;
```

Payment proof harus protected.

## 17.4 Firebase App Check

App Check digunakan untuk membantu mencegah request dari client yang
tidak legitimate pada Android, iOS, dan admin web sesuai dukungan
production Firebase saat deployment.

------------------------------------------------------------------------

# 18. Data Privacy

## Public

-   Published announcements
-   Published agenda
-   Public community information

## Resident Private

-   Resident profile
-   Household
-   Family
-   Vehicles
-   IPL
-   Payment history

## Sensitive

-   Payment proof
-   Financial records
-   CCTV
-   Audit logs
-   Administrative configuration

Prinsip:

> Least privilege + privacy by default.

------------------------------------------------------------------------

# 19. CCTV Architecture

Existing environment:

``` text
Hikvision DVR
      ↓
Streaming Gateway
      ↓
Authenticated Streaming Layer
      ↓
Casa Mobile App
```

## 19.1 Critical CCTV Security Rule

Hikvision DVR / RTSP stream **tidak boleh diekspos langsung ke
internet/mobile application**.

Tidak boleh:

``` text
Mobile App → public RTSP → DVR
```

Harus:

``` text
Mobile App
    ↓
Authentication
    ↓
Authorization
    ↓
Streaming Gateway
    ↓
Hikvision DVR
```

## 19.2 CCTV Permission

Collection:

``` text
cctv_permissions
```

Fields:

``` text
userId
cameraId
permission
grantedBy
grantedAt
expiresAt
status
```

Status:

``` text
GRANTED
REVOKED
EXPIRED
```

## 19.3 CCTV Session Security

Gunakan:

-   Authenticated session
-   Short-lived token bila diperlukan
-   Authorization
-   Camera-level permission
-   Revocation
-   Rate limiting
-   Audit logging

------------------------------------------------------------------------

# 20. Audit Logs

Collection:

``` text
audit_logs
```

Fields:

``` text
actorId
actorRole
action
resourceType
resourceId
timestamp
oldValue
newValue
result
metadata
```

Contoh:

``` text
actor: committee-user-123
action: VERIFY_PAYMENT
resource: payment-123
result: APPROVED
timestamp: ...
```

Audit log tidak boleh dapat diubah oleh Resident.

------------------------------------------------------------------------

# 21. Notifications

FCM digunakan.

Triggers:

``` text
IPL generated
Payment submitted
Payment approved
Payment rejected
New announcement
New event
Report status changed
Community alert
```

Flow:

``` text
Backend Event
      ↓
Cloud Function
      ↓
Validate Recipient
      ↓
Create Notification
      ↓
Send FCM
      ↓
Log Result
```

Notification failure tidak boleh merusak transaksi utama.

------------------------------------------------------------------------

# 22. Announcements

Committee dapat:

``` text
Create
Draft
Publish
Update
Archive
```

Resident:

``` text
Read published announcements
```

------------------------------------------------------------------------

# 23. Events / Agenda

Fields:

``` text
title
description
date
startTime
endTime
location
status
createdBy
createdAt
updatedAt
```

------------------------------------------------------------------------

# 24. Reports

Resident dapat membuat laporan.

Fields:

``` text
reportId
residentId
houseId
category
title
description
attachments
status
createdAt
updatedAt
resolvedAt
resolvedBy
```

Status:

``` text
SUBMITTED
IN_REVIEW
IN_PROGRESS
RESOLVED
REJECTED
CLOSED
```

------------------------------------------------------------------------

# 25. Finance Transparency

Finance module memberikan transparansi keuangan komunitas.

Resident hanya melihat data yang sudah dipublikasikan.

Contoh:

``` text
Income
Expense
Category
Period
Description
Amount
```

Data internal/private tidak boleh otomatis terlihat Resident.

------------------------------------------------------------------------

# 26. Error Handling

Setiap critical flow harus menangani:

``` text
Network Error
Timeout
Unauthorized
Forbidden
Invalid Input
Duplicate Submission
Storage Upload Failure
Backend Failure
Expired Session
Already Paid
Invalid Bill
Inactive Account
```

Aplikasi tidak boleh menampilkan transaksi sukses sebelum backend
mengonfirmasi keberhasilan.

------------------------------------------------------------------------

# 27. Offline Behavior

Saat internet tidak tersedia:

-   Tampilkan offline state.
-   Jangan menganggap operasi berhasil.
-   Jangan mengubah status bisnis secara lokal menjadi final.
-   Retry hanya untuk operasi yang aman/idempotent.

Contoh:

``` text
No Internet Connection
Please check your connection and try again.
```

------------------------------------------------------------------------

# 28. Duplicate Payment Protection

Backend harus mencegah duplicate active payment submissions untuk
invoice yang sama sesuai business rule.

Gunakan transaction/idempotency mechanism bila diperlukan.

------------------------------------------------------------------------

# 29. Testing Strategy

## Unit Testing

-   Business logic
-   Validators
-   State management
-   Mappers
-   Utilities

## Integration Testing

-   Authentication
-   Firestore
-   Storage
-   Cloud Functions
-   Notifications

## Security Testing

-   Firestore Rules
-   Storage Rules
-   Role escalation
-   Unauthorized payment modification
-   Unauthorized CCTV
-   Data leakage

## UAT

UAT dilakukan berdasarkan business acceptance criteria.

------------------------------------------------------------------------

# 30. Payment Acceptance Test

Happy path:

``` text
Resident melihat IPL
 ↓
Resident melihat rekening BCA
 ↓
Resident transfer
 ↓
Resident upload bukti
 ↓
Payment = PENDING_VERIFICATION
 ↓
Committee melihat payment
 ↓
Committee approve
 ↓
Bill = PAID
 ↓
Resident mendapat notification
 ↓
Audit log tercatat
```

Negative test:

``` text
Resident mencoba mengubah PAID
→ DENIED
```

------------------------------------------------------------------------

# 31. Deployment Environments

Minimum:

``` text
Development
Staging
Production
```

Development:

``` text
Firebase Emulator Suite
```

Staging:

``` text
Dedicated Firebase Project
```

Production:

``` text
Dedicated Firebase Production Project
```

Production database tidak boleh digunakan untuk development.

------------------------------------------------------------------------

# 32. Environment Configuration

Secrets/configuration harus dipisahkan:

``` text
Development
Staging
Production
```

Tidak boleh hard-code:

``` text
Private credentials
Service credentials
Financial secrets
CCTV credentials
Other sensitive secrets
```

Gunakan environment configuration / secret management yang sesuai.

------------------------------------------------------------------------

# 33. Backup & Disaster Recovery

Backup harus mencakup:

``` text
Firestore
Firebase Storage
Critical configuration
Critical metadata
```

Harus tersedia:

-   Backup frequency
-   Retention
-   Restore procedure
-   Recovery procedure
-   Responsible role

------------------------------------------------------------------------

# 34. Monitoring

Production monitoring:

``` text
Cloud Functions Logs
Firebase Logs
Crash Reporting
Performance
Authentication anomalies
Storage usage
Firestore usage
Notification failures
```

Critical errors harus dapat ditelusuri.

------------------------------------------------------------------------

# 35. Development Roadmap

## Phase 1 --- Foundation

-   Project setup
-   Firebase
-   Environment
-   Architecture
-   Design system
-   Authentication

## Phase 2 --- Resident

-   Resident profile
-   House
-   Household
-   Family
-   Vehicles

## Phase 3 --- IPL

-   IPL bills
-   BCA instructions
-   Payment proof
-   Verification
-   Payment history

## Phase 4 --- Community

-   Announcements
-   Events
-   Reports
-   Notifications

## Phase 5 --- Finance

-   Finance transactions
-   Finance categories
-   Published transparency

## Phase 6 --- CCTV

-   Camera management
-   Permission
-   Streaming gateway
-   Secure playback

## Phase 7 --- Admin

-   Dashboard
-   Resident management
-   IPL management
-   Payment verification
-   Finance
-   Reports
-   Announcements
-   Events
-   CCTV
-   Notifications
-   Audit logs
-   Settings

## Phase 8 --- Security Hardening

-   Security rules
-   App Check
-   RBAC
-   Storage security
-   CCTV security
-   Audit
-   Rate limiting

## Phase 9 --- UAT

-   Business UAT
-   Security UAT
-   Payment UAT
-   CCTV UAT
-   Admin UAT

## Phase 10 --- Production

-   Production Firebase
-   iOS build
-   Android build
-   Admin Web deployment
-   Monitoring
-   Backup
-   Release

------------------------------------------------------------------------

# 36. Definition of Done

Feature dianggap selesai hanya jika:

``` text
Requirement
   ↓
UI
   ↓
Frontend Logic
   ↓
Backend Logic
   ↓
Authorization
   ↓
Security Rules
   ↓
Validation
   ↓
Error Handling
   ↓
Audit Logging (jika diperlukan)
   ↓
Unit Test
   ↓
Integration Test
   ↓
UAT
   ↓
Accepted
```

Code yang hanya berhasil compile belum dianggap selesai.

------------------------------------------------------------------------

# 37. AI Development Rules

Jika proyek dikembangkan menggunakan AI coding agent:

1.  Ikuti PRD ini.
2.  Jangan mengarang business rule.
3.  Jangan mengubah payment architecture.
4.  Jangan menambahkan payment method tanpa Change Request.
5.  Jangan mengubah database schema secara sembarangan.
6.  Jangan melakukan refactor arsitektur besar tanpa approval.
7.  Jangan mengubah security model tanpa approval.
8.  Jangan membuat bypass authorization.
9.  Jangan menaruh secret di source code.
10. Jangan menganggap UI restriction sebagai security.
11. Jangan menandai payment sebagai PAID dari client.
12. Jangan mengekspos CCTV/RTSP secara langsung.
13. Tulis test untuk critical business logic.
14. Jaga separation development/staging/production.
15. Jelaskan setiap architectural change sebelum implementasi.

Sebelum coding, AI agent harus:

1.  Review seluruh requirement.
2.  Identifikasi dependency.
3.  Identifikasi ambiguity.
4.  Jangan mengarang requirement baru.
5.  Jangan mengubah locked decision.
6.  Buat implementation plan.
7.  Pecah pekerjaan menjadi milestone.
8.  Implementasikan incremental.
9.  Test setiap milestone.
10. Jangan menganggap project selesai hanya karena aplikasi dapat
    dijalankan.

------------------------------------------------------------------------

# 38. Change Control

Dokumen ini adalah:

> **DESIGN FREEZE / IMPLEMENTATION CONTRACT**

Perubahan terhadap:

-   Database
-   Payment
-   Authentication
-   Authorization
-   CCTV architecture
-   Roles
-   Core navigation
-   API contracts
-   Security architecture
-   Firebase architecture

harus melalui Change Request.

Format:

``` text
Change Request ID:
Date:
Requested By:
Reason:
Current Behavior:
Proposed Behavior:
Impact:
Security Impact:
Database Impact:
Frontend Impact:
Backend Impact:
Test Impact:
Approved By:
PRD Version:
```

------------------------------------------------------------------------

# 39. Locked Design Decisions

## Decision 001 --- Payment

**LOCKED**

IPL hanya:

> **TRANSFER BANK BCA**

Tidak ada:

``` text
QRIS
DANA
GoPay
OVO
Virtual Account
Payment Gateway
COD
```

## Decision 002 --- Backend

**LOCKED**

``` text
Firebase Auth
Firestore
Storage
Cloud Functions
FCM
App Check
```

## Decision 003 --- Mobile

**LOCKED**

Flutter untuk Resident Mobile App.

## Decision 004 --- Admin

**LOCKED**

Next.js / React untuk Admin Web.

## Decision 005 --- CCTV

**LOCKED**

Existing Hikvision DVR tetap menjadi source CCTV.

Mobile tidak boleh mengakses RTSP DVR secara langsung.

Streaming harus melalui secure streaming gateway.

------------------------------------------------------------------------

# 40. Final System Architecture

``` text
                         CASA D'NINETY NINE
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
       RESIDENT MOBILE                       ADMIN WEB
          Flutter                         Next.js / React
              │                                   │
              └─────────────────┬─────────────────┘
                                │
                         Firebase Auth
                                │
                     ┌──────────┴──────────┐
                     │                     │
                Firestore              Storage
                     │                     │
              ┌──────┴──────┐       Payment Proof
              │             │
         Cloud Functions    FCM
              │
      ┌───────┼───────────────┐
      │       │               │
     IPL    Finance        Community
      │                       │
 Payment Verification     Announcements
      │                    Events
      │                    Reports
      │
      └───────────┐
                  │
             Audit Logs


                    CCTV SYSTEM
                         │
                 Hikvision DVR
                         │
                         ▼
                Streaming Gateway
                         │
                         ▼
                 Authenticated App
```

------------------------------------------------------------------------

# 41. Implementation Principle

Casa D'Ninety Nine harus dibangun dengan prinsip:

``` text
Secure by Design
Backend as Source of Truth
Least Privilege
Privacy by Default
Auditability
Predictable Architecture
Testable Code
Maintainable Code
Production Readiness
```

------------------------------------------------------------------------

# 42. Final Instruction for Development Agent

Gunakan dokumen ini sebagai **source of truth**.

Sebelum menulis kode:

-   Review seluruh requirement.
-   Identifikasi dependency.
-   Identifikasi ambiguity.
-   Jangan mengarang requirement baru.
-   Jangan mengubah locked decision.
-   Buat implementation plan.
-   Pecah pekerjaan menjadi milestone.
-   Implementasikan secara incremental.
-   Test setiap milestone.

Untuk setiap perubahan besar, jelaskan:

``` text
WHAT changed
WHY it changed
FILES affected
DATABASE impact
API impact
SECURITY impact
TEST impact
```

Critical business logic harus berada di backend.

Client hanya menjadi presentation + interaction layer dan tidak boleh
dipercaya untuk menentukan state bisnis yang sensitif.

------------------------------------------------------------------------

# END OF CASA D'NINETY NINE PRD & FULL SYSTEM BLUEPRINT v1.1
