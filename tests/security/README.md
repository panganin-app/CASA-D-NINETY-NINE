# Security Tests

Pengujian RBAC, ownership, privilege escalation, Firestore Rules, Storage Rules, App Check, replay/idempotency, token expiry, dan data leakage.

Kontrak audit lengkap: [`../../docs/security/SECURITY_AUDIT.md`](../../docs/security/SECURITY_AUDIT.md).

Folder ini akan berisi automated tests yang dapat dijalankan ulang di Firebase Emulator Suite dan CI. Hasil audit tidak boleh dinyatakan `PASS` hanya dari checklist; diperlukan test execution dan evidence.
