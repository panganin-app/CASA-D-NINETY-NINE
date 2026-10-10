# Stitch Prompt — Resident Mobile Login Screen

## Input assets

Upload dua gambar berikut ke Stitch sebagai visual references:

1. `assets/brand/casa-dninetynine-logo-official-no-tagline.png`
2. `assets/images/casa-99-house-clean-v1.png`

Logo adalah identitas brand yang harus dipertahankan. Foto rumah adalah hero/background login screen.

---

## Primary prompt — image-first revision

```text
Design a polished, production-ready mobile login screen for the resident application of CASA D'NINETY NINE, a modern residential community in Indonesia.

Use the uploaded CASA logo exactly as provided. Do not redraw, restyle, recolor, distort, or add a tagline to the logo. Use the uploaded clean house photo as the main hero/background image. Keep the central facade and roof visible when cropping.

Visual direction:
- modern residential
- warm, trustworthy, secure, and community-oriented
- premium but approachable
- clean and calm, not an enterprise dashboard
- use the existing dark navy blue and warm gold from the official logo as the primary brand colors
- white and soft warm-gray surfaces
- generous spacing and clear visual hierarchy
- accessible contrast and readable typography

Canvas:
- portrait mobile screen
- Android and iOS compatible
- approximately 390 x 844 logical pixels
- respect top and bottom safe areas

Image-first composition — critical requirement:
- The residential image must remain the dominant visual and must not be covered by a large login container.
- Use the house photo as a full-screen edge-to-edge background.
- Keep at least 60 percent of the screen visually open for the house and sky.
- The roofline, upper facade, main windows, and architectural identity must remain clearly visible.
- Do not place a large opaque white panel across the middle of the house.

Layout:
1. Use the house photo as a full-screen edge-to-edge background with focal point on the central facade.
2. Add only a restrained vertical gradient: transparent over the sky and building, gradually becoming slightly darker near the bottom to support readability. Do not blur or dim the entire photograph.
3. Place the CASA logo near the top safe area, centered, using contain sizing. Give it a small clean white backing or subtle local shadow only if required for contrast; do not create a large logo panel.
4. Place the login form in a compact bottom sheet anchored to the bottom edge.
5. The bottom sheet should occupy approximately 34 to 38 percent of the screen in its default state and never more than 42 percent.
6. Use a warm off-white surface with rounded top corners only. Keep internal spacing efficient and avoid excessive vertical gaps.
7. Let the upper edge of the bottom sheet begin below the important facade and window details.
8. Do not center the form in a tall floating card.
9. Add compact heading: "Selamat Datang Warga"
10. Place an input labeled "Email atau Nomor Telepon" directly below the heading with a simple user icon. Do not add supporting description between the heading and the field.
11. Add an input labeled "Kata Sandi" with a lock icon and show/hide password control.
12. Place "Lupa Kata Sandi?" on the same compact row below the password field.
13. Add a full-width primary button labeled "Masuk" using dark navy blue.
14. Add a subtle support action: "Butuh bantuan? Hubungi Admin"
15. Do not add a separate security badge if it increases the height of the bottom sheet.

Component behavior to represent:
- default input
- focused input
- invalid input with inline Indonesian error message
- disabled login button
- loading login button
- keyboard-safe layout
- offline/network error banner
- when the keyboard opens, allow the bottom sheet content to scroll or move upward temporarily; preserve the image-first default state when the keyboard is closed

Interaction rules:
- never imply that login succeeded before authentication confirmation
- preserve entered values after recoverable errors
- password visibility control must have an accessible label
- minimum touch target 44 x 44 pixels
- avoid tiny text
- avoid social login because it is not defined in the product requirements
- do not add registration, Google login, Apple login, OTP, biometrics, QR code, payment, or unrelated features

Style details:
- geometric sans-serif typography
- medium rounded corners, not excessively pill-shaped
- restrained shadows
- flat, production-friendly UI
- no full-screen glassmorphism
- no excessive gradients
- no decorative illustration beyond the supplied house image
- no generic stock-house icon
- no oversized login card
- no container covering most of the building

Output:
- one high-fidelity default login screen
- one version showing validation error
- one version showing loading state
- reusable component structure suitable for transfer to Figma and implementation in Flutter
```

---

## Refinement prompt

Gunakan prompt ini jika hasil awal terlalu generik:

```text
Refine the selected login screen without changing its information architecture.

Make the layout feel more specific to CASA D'NINETY NINE by deriving the color palette directly from the uploaded logo. Keep the uploaded house photo and official logo unchanged. Make the residential image more prominent and reduce the login bottom sheet to approximately 34 to 38 percent of the screen. The roofline, facade, and main windows must remain clearly visible. Tighten spacing, typography hierarchy, and field alignment without reducing usability. Ensure the form remains usable on a compact mobile screen when the keyboard is open by allowing temporary scrolling or upward movement.

Do not introduce a large opaque container, new features, new navigation, social login, registration, OTP, or a tagline.
```

---

## Review checklist

- [ ] Logo persis dari file resmi dan tanpa tagline.
- [ ] Foto rumah memakai source image yang sudah dibersihkan.
- [ ] Atap dan fasad tengah tidak terpotong buruk.
- [ ] Foto tetap menjadi elemen dominan dan terlihat pada minimal 60 persen layar.
- [ ] Bottom sheet hanya sekitar 34–38 persen layar pada kondisi default.
- [ ] Container tidak menutupi bagian penting rumah.
- [ ] Tidak ada fitur yang tidak disebut PRD.
- [ ] Warna mengikuti navy, gold, white, dan warm gray.
- [ ] Teks menggunakan Bahasa Indonesia.
- [ ] Input, tombol, serta error mudah dibaca.
- [ ] Layout aman ketika keyboard terbuka.
- [ ] Minimum touch target terpenuhi.
- [ ] Default, invalid, dan loading state tersedia.
- [ ] Struktur dapat dipindahkan ke Figma.

## Handoff

Setelah satu desain dipilih:

1. Export/pindahkan desain ke Figma.
2. Rapikan Auto Layout dan layer naming.
3. Konversi warna, typography, spacing, dan radius menjadi variables.
4. Buat component variants untuk input dan button.
5. Tambahkan state offline, network error, inactive account, dan session expired.
6. Buat prototype login sebelum implementasi Flutter.
