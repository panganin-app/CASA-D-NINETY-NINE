# Design Tokens

Kontrak token CASA berada di [`tokens.json`](tokens.json) dan berstatus `design-freeze` v1.0.0.

Implementasi harus menghasilkan:

- Flutter `ThemeData`/`ThemeExtension` untuk mobile.
- CSS custom properties dan theme mapping untuk Next.js/Admin Web.
- Visual regression test untuk color, type scale, spacing, radius, dan status semantic.

Nilai warna, spacing, radius, dan typography tidak boleh disalin acak ke feature code. Perubahan token memerlukan version bump dan visual regression review.

Sumber nilai terpusat untuk colors, typography, spacing, radius, elevation, dan semantic states. Implementasi Flutter dan web harus dihasilkan atau dipetakan dari kontrak token yang sama.
