# Screen State Matrix

Setiap feature wajib menangani `loading`, `success`, `empty`, `error`, `offline`, `unauthorized`, dan `forbidden`. Tabel berikut menambahkan state domain yang wajib.

| Feature | State domain | CTA/behavior |
|---|---|---|
| Login | idle, submitting, invalid_credentials, locked, reset_sent | Disable submit saat loading; error tidak mengungkap keberadaan akun |
| Home | loaded, no_announcement, no_event | Skeleton; empty cards tetap menjaga hierarchy |
| IPL Bill | NO_BILL, UNPAID, PENDING_VERIFICATION, PAID, OVERDUE, CANCELLED | Hanya UNPAID/OVERDUE dapat memulai pembayaran |
| IPL Payment | DRAFT, UPLOADING, PENDING_VERIFICATION, APPROVED, REJECTED | Tidak ada cancel/edit saat pending; rejected boleh resubmit |
| Internet | INACTIVE, ACTIVE, EXPIRING, EXPIRED, PENDING_PAYMENT, PENDING_ACTIVATION | Masa aktif berubah hanya setelah approval backend |
| Internet Payment | DRAFT, PENDING_VERIFICATION, APPROVED, REJECTED | Nominal berasal dari package catalog backend |
| Information | DRAFT, SCHEDULED, PUBLISHED, ARCHIVED | Resident hanya membaca PUBLISHED |
| Event | UPCOMING, ONGOING, COMPLETED, CANCELLED | Kalender lokal hanya setelah consent pengguna |
| Report | SUBMITTED, IN_REVIEW, IN_PROGRESS, RESOLVED, REJECTED, CLOSED | Riwayat status immutable dan terlihat resident pemilik |
| Finance | NO_PUBLISHED_DATA, PUBLISHED | Resident tidak melihat draft/internal ledger |
| CCTV | ONLINE, OFFLINE, DEGRADED, ACCESS_DENIED, SESSION_EXPIRED | Refresh session; jangan expose URL stream permanen |
| Profile | COMPLETE, INCOMPLETE, UPDATE_PENDING | Data sensitif dimasking; edit mengikuti permission |
| Admin queue | EMPTY, FILTERED_EMPTY, LOADING, ERROR, HAS_ITEMS | Aksi approve/reject membutuhkan confirmation dialog |

## Copy standar

- Offline: **“Tidak ada koneksi. Periksa jaringan lalu coba lagi.”**
- Error umum: **“Terjadi kendala. Coba beberapa saat lagi.”**
- Unauthorized: **“Sesi Anda berakhir. Silakan masuk kembali.”**
- Forbidden: **“Anda tidak memiliki akses ke halaman ini.”**
- Empty: gunakan konteks spesifik; jangan menampilkan ilustrasi error.

## Mutasi dan retry

- Tombol mutasi terkunci setelah ditekan sampai respons atau timeout.
- Retry memakai idempotency key yang sama jika hasil sebelumnya belum diketahui.
- Optimistic update dilarang untuk approval pembayaran, perubahan masa aktif internet, publikasi keuangan, role, dan permission CCTV.
- Semua error harus memiliki correlation ID untuk dukungan tanpa menampilkan stack trace ke pengguna.
