# Login Screen — Asset Specification

## Status

Keputusan visual ini ditetapkan untuk Resident Mobile Login Screen.

## Asset resmi

### Logo

```text
assets/brand/casa-dninetynine-logo-official-no-tagline.png
```

Penggunaan:

- Identitas utama CASA D'NINETY NINE pada login screen.
- Jangan menambahkan kembali tagline `One App for Our Community`.
- Pertahankan bentuk, warna, proporsi, dan wordmark asli.
- Jangan stretch; gunakan fit/contain dengan clear space yang cukup.

### Gambar rumah

```text
assets/images/casa-99-house-clean-v1.png
```

Penggunaan:

- Hero image atau background visual login screen.
- Fokus rumah harus tetap terlihat pada ukuran layar mobile.
- Crop harus memakai `cover` dengan focal point pada fasad tengah rumah.
- Hindari crop yang memotong puncak atap atau pintu utama.
- Overlay dapat digunakan hanya untuk menjaga keterbacaan form login.

## Komposisi login screen

```text
┌──────────────────────────┐
│                          │
│      Gambar Rumah        │
│    Hero / Background     │
│                          │
│         Logo CASA        │
│                          │
├──────────────────────────┤
│ Selamat Datang Warga     │
│ Email / Nomor Telepon    │
│ Password                 │
│ Lupa Password            │
│                          │
│ [        MASUK         ] │
│                          │
│ Bantuan / Hubungi Admin  │
└──────────────────────────┘
```

## Aturan UI

- Form harus tetap terbaca di atas semua ukuran layar.
- Setelah heading `Selamat Datang Warga`, tampilkan field login secara langsung tanpa supporting description.
- Logo tidak boleh menyatu dengan area foto yang terlalu ramai.
- Gunakan safe area untuk notch dan navigation gesture.
- Keyboard tidak boleh menutupi field aktif atau tombol masuk.
- Password harus memiliki show/hide control.
- Tombol masuk memiliki loading dan disabled state.
- Error authentication ditampilkan dekat form tanpa menghapus input pengguna.
- Jangan menampilkan status login berhasil sebelum Firebase Authentication mengonfirmasi.

## State wajib

```text
DEFAULT
FOCUSED
VALIDATING
LOADING
INVALID_INPUT
INVALID_CREDENTIALS
INACTIVE_ACCOUNT
NETWORK_ERROR
OFFLINE
SESSION_EXPIRED
```

## Source of truth

Kedua file di atas merupakan asset source of truth untuk login screen. Perubahan atau penggantian asset harus dicatat pada dokumen ini.
