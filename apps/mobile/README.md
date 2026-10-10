# Resident Mobile App

Flutter + Dart + Riverpod + GoRouter + Firebase SDK (Auth, Firestore, Functions, Storage). Business-critical state tetap ditentukan backend (`backend/functions`) -- app ini cuma presentasi + panggilan ke Cloud Functions/baca Firestore sesuai rules.

## Menjalankan lokal (emulator)

1. Dari root repo: `npm run emulators` (atau `npm run seed:local` dulu kalau mau akun uji `demo-resident`/`demo-committee`).
2. Dari folder ini: `flutter run` -- app otomatis konek ke Emulator Suite lokal (lihat `lib/core/network/firebase_emulator.dart`), BUKAN project Firebase production (belum ada, lihat `lib/firebase_options.dart`).

## Struktur (PRD §9.2)

```
lib/
  core/        # theme (design tokens), network (Firebase client), errors
  routing/     # GoRouter, protected routes
  features/    # 1 folder per domain (auth, home, ipl, cctv, ...)
  shared/      # widget/komponen lintas fitur
```

## Token desain

`lib/core/theme/casa_tokens.dart` di-GENERATE dari `packages/design_tokens/tokens.json` -- jangan edit manual, jalankan `npm run generate:tokens` dari root repo setelah ubah `tokens.json`.

## Status

Lihat `docs/IMPLEMENTATION_PROGRESS.md` di root repo untuk status per fitur (mana yang sudah jalan vs masih placeholder "Coming soon").
