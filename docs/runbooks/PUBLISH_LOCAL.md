# Cara Publish & Jalankan di Simulator (Lokal)

Dokumen ini menjelaskan cara menjalankan **backend**, **web admin**, dan **app warga** di komputer sendiri
(emulator Firebase + iOS Simulator + Android Emulator). Semua langkah di sini **tidak** menyentuh
project Firebase production dan **tidak** menulis data ke internet.

> Yang dimaksud "publish" di tahap ini adalah menjalankan build di lingkungan lokal.
> Publish ke production (Firebase, App Store, Play Store) dijelaskan di bagian akhir dan
> **belum dilakukan**.

---

## 1. Prasyarat (sekali saja)

| Alat | Versi yang sudah dipakai | Catatan |
|---|---|---|
| macOS + Xcode | Xcode terbaru + iOS Simulator | Untuk app di iPhone Simulator |
| Android Studio | terbaru, dengan Android Virtual Device | Untuk app di Android Emulator & build APK |
| Flutter | 3.47.x (stable) | `flutter doctor` harus hijau untuk iOS & Android |
| Node.js | 22.x | Untuk backend, web, dan Firebase CLI |
| Java | 21 (`brew install openjdk@21`) | Dibutuhkan Firebase Emulator Suite |
| Firebase CLI | dipasang lewat `npm install` di root (`firebase-tools` 15.x) | Tidak perlu install global |

Cek cepat:

```bash
flutter doctor
node -v        # v22.x
java -version  # 21.x
```

**Penting: lokasi folder project tanpa tanda kutip atau spasi.** Tooling Flutter gagal
kalau path mengandung apostrof (mis. `CASA D'NINETY NINE`). Project ini sudah di-rename
menjadi `CASA DNINETY NINE`. Kalau nanti dipindah, pastikan path-nya tidak punya apostrof.

---

## 2. Pasang dependensi (sekali, dan setiap ada perubahan paket)

Jalankan dari folder root project:

```bash
npm install                                # root: firebase-tools, emulator, test
npm --prefix backend/functions ci          # backend (Cloud Functions)
npm --prefix apps/admin ci                 # web admin (Next.js)
cd apps/mobile && flutter pub get && cd -  # app warga (Flutter)
```

---

## 3. Backend: jalankan emulator Firebase

Backend tidak dijalankan sebagai server terpisah. Ia berjalan di dalam **Emulator Suite**
(Auth, Firestore, Functions, Storage), yang meniru Firebase sungguhan di komputer Anda.

```bash
npm run build          # compile TypeScript backend
npm run emulators      # biarkan terminal ini tetap terbuka
```

- UI emulator: <http://127.0.0.1:4000> (lihat data Firestore, akun Auth, dan **tautan reset kata sandi**).
- Port yang dipakai: Auth 9099, Firestore 8080, Functions 5001, Storage 9199.
- Data disimpan saat berhenti (`--export-on-exit`) dan dimuat lagi saat jalan berikutnya.

Buat akun uji (sekali, atau setiap kali data emulator direset):

```bash
npm run seed:local
```

Perintah ini membuat akun **warga** (`demo-resident`, `demo-other`) dan **pengurus**
(`demo-committee`) dengan kata sandi acak. Kata sandi disimpan di file `.local/seed-credentials-*.json`
(mode 0600, di-ignore git). **Jangan bagikan file itu atau menempelkannya ke chat.**

Verifikasi backend sebelum lanjut:

```bash
npm run test:billing   # 41 tes emulator (rules + integrasi); harus 41/41 lulus
npm test               # 4 tes unit
```

---

## 4. Web admin (pengurus): jalankan di browser

Web admin adalah aplikasi statis yang bicara ke emulator lewat Cloud Functions.

**Opsi A -- mode pengembangan (paling mudah):**

```bash
cd apps/admin
NEXT_PUBLIC_USE_EMULATOR=true npm run dev     # http://localhost:3000
```

**Opsi B -- hasil build statis (mirip yang nanti di-host):**

```bash
cd apps/admin
NEXT_PUBLIC_USE_EMULATOR=true npm run build   # hasil di apps/admin/out/
python3 -m http.server 3000 --directory out   # http://127.0.0.1:3000/login/
```

Login dengan akun **pengurus** (`demo-committee`). Email ada di file kredensial seed,
kata sandi juga ada di file itu. Akun warga akan ditolak dengan pesan "Akses ditolak".

Cek data layer web (tanpa browser):

```bash
node scripts/smoke-admin-web.mjs   # harus "SEMUA LULUS" (4 cek)
```

Catatan: `NEXT_PUBLIC_USE_EMULATOR=true` **harus** diset saat build. Build tanpa flag ini
mengarah ke konfigurasi Firebase production yang belum ada.

---

## 5. App warga: jalankan di simulator

Pastikan emulator backend (langkah 3) **sudah berjalan** sebelum membuka app.

### iPhone Simulator

```bash
open -a Simulator                       # atau: flutter emulators --launch apple_ios_simulator
flutter devices                         # catat ID simulator, mis. 3C4E69A0-...
cd apps/mobile
flutter run -d <ID-simulator>
```

Di terminal `flutter run`: tekan `r` untuk hot reload, `R` untuk hot restart, `q` untuk berhenti.

### Android Emulator

1. Android Studio -> **Device Manager** -> jalankan sebuah AVD.
2. `flutter devices` (akan muncul `emulator-5554` atau serupa).
3. `cd apps/mobile && flutter run -d emulator-5554`

App Android otomatis memakai `10.0.2.2` untuk menjangkau emulator di komputer Anda
(sudah diatur di `lib/core/network/firebase_emulator.dart`).

### Membuka project di Android Studio (untuk build APK manual)

- Buka Android Studio -> **Open** -> pilih folder `apps/mobile`.
- Build APK debug: **Build > Flutter > Build APK** (atau `flutter build apk --debug` di terminal).
- APK hasil build ada di `apps/mobile/build/app/outputs/flutter-apk/`.

### Login warga di app

Pakai akun `demo-resident` dari file kredensial seed. Setelah login, Beranda menampilkan
nama dan nomor rumah. Menu IPL, Informasi, Keuangan, Laporan, CCTV, dan Profil juga bisa dibuka.

> Catatan jujur: alur end-to-end (login -> pilih foto bukti -> kirim) **belum pernah dites
> langsung** di simulator. Lihat `docs/IMPLEMENTATION_PROGRESS.md` untuk status per fitur.

---

## 6. Masalah yang sudah pernah terjadi (dan solusinya)

| Gejala | Penyebab | Solusi |
|---|---|---|
| `flutter test` / `run` gagal dengan error `'NINETY'` atau mirip | Path folder mengandung apostrof | Pindahkan folder ke path tanpa `'` |
| App iOS langsung tertutup saat dibuka | `apiKey` Firebase di `firebase_options.dart` tidak sesuai format (harus 39 karakter, diawali `AIza`) | Pakai nilai placeholder yang sudah ada di repo; jangan diganti sembarangan |
| `Could not connect` / permintaan gagal di Android | Emulator Android tidak bisa pakai `localhost` | Sudah diatur (`10.0.2.2`); pastikan emulator backend jalan |
| `flutter emulators` kosong | Simulator/AVD belum dibuat | Buat lewat Xcode (iOS) atau Device Manager (Android) |
| Emulator Firebase gagal start, error Java | Java 21 tidak ada di PATH | `brew install openjdk@21`; `scripts/emulators.mjs` otomatis mencoba `/opt/homebrew/opt/openjdk@21` |
| Port sudah dipakai | Dua sesi emulator jalan bersamaan | Hentikan sesi lama; drill backup memakai port berbeda dan aman dijalankan terpisah |
| Lupa kata sandi di emulator | Email tidak terkirim sungguhan | Buka UI emulator (port 4000) -> Authentication -> salin tautan reset dari log |

---

## 7. Publish ke production (BELUM dilakukan -- baca dulu)

Langkah ini berbiaya dan memengaruhi data nyata. **Jangan dijalankan tanpa persetujuan eksplisit.**

1. **Firebase production**: buat project baru. Firebase Functions dan Cloud Storage **wajib plan Blaze**
   (tagihan pay-as-you-go; kuota gratis bulanan cukup besar untuk skala komplek).
2. **Konfigurasi app**: jalankan `flutterfire configure` untuk membuat `firebase_options.dart` yang asli.
   Ganti placeholder emulator; jangan commit kredensial.
3. **Backend**: `firebase deploy --only functions` dari root (setelah konfirmasi).
4. **Web admin**: `NEXT_PUBLIC_FIREBASE_*` diisi nilai production, lalu
   `npm --prefix apps/admin run build` dan `firebase deploy --only hosting` (konfigurasi `hosting` sudah ada di `firebase.json`).
5. **App warga**: build release (`flutter build ipa` / `flutter build appbundle`), lalu upload lewat
   Xcode/Transporter (App Store) dan Play Console (Play Store).
   - Akun developer: Apple Developer Program (berbayar tahunan) dan Google Play Console (sekali bayar).
   - **Kebijakan privasi harus sudah final** (saat ini masih draft, lihat layar Profil > Kebijakan Privasi).
   - Verifikasi ulang kebutuhan "hapus akun" di dalam app menurut kebijakan toko. Akun saat ini dibuat pengurus, bukan dari dalam app; tetap cek ketentuan terbaru Apple dan Google sebelum submit.
6. **Gerbang sebelum production**: UAT dengan pengurus dan warga nyata, dan security audit yang dilakukan
   pihak yang bisa dipertanggungjawabkan. Tes otomatis yang ada **bukan** pengganti audit.

---

## Ringkasan perintah cepat

```bash
# Terminal 1 -- backend
npm run build && npm run emulators

# Terminal 2 -- sekali saja, lalu setiap reset data
npm run seed:local

# Terminal 3 -- web admin
cd apps/admin && NEXT_PUBLIC_USE_EMULATOR=true npm run dev

# Terminal 4 -- app warga
cd apps/mobile && flutter run -d <ID-simulator>
```
