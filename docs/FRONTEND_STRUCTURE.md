# Struktur frontend

Frontend dibagi berdasarkan domain agar perubahan pada satu fitur tidak membuat
file utama kembali menjadi monolitik.

```text
frontend/app/
├── components/
│   ├── admin/              # Modul per halaman dashboard admin
│   ├── registration/       # Empat langkah PPDB, berkas, review, preview
│   ├── school-directory/   # Struktur, guru, dan editor profil
│   ├── student-records/    # Daftar, detail, dan form siswa offline
│   └── *.tsx               # Komponen publik atau orchestrator fitur
├── lib/
│   ├── cms/                # Data, storage, seed, dan operasi per domain
│   ├── local-cms.ts        # Public barrel; jaga import lama tetap stabil
│   └── api-client.ts       # Adapter HTTP untuk backend
└── styles/
    ├── admin/              # Shell, CMS, artikel, dan operasional admin
    ├── directory/          # Organisasi, guru, siswa, dan responsive rules
    ├── login/              # Motion, login, analytics, dan mobile navigation
    ├── public/             # Blog, program, PPDB, prestasi, kontak, dan footer
    ├── base.css
    ├── accessibility.css
    └── *.css               # Aggregator import; jangan isi logic fitur di sini
```

## Aturan maintenance

- `AdminDashboard.tsx`, `StudentRecordsModule.tsx`, dan
  `SchoolDirectoryModule.tsx` hanya mengatur state, navigasi, dan aliran data.
- UI spesifik fitur ditempatkan di subfolder domain terkait.
- Operasi data baru ditambahkan ke modul `lib/cms/` yang sesuai, kemudian
  diekspor melalui `lib/local-cms.ts` selama masih dalam mode simulasi. Integrasi
  server memakai client async `lib/api/<fitur>.ts` yang direncanakan, melalui
  `lib/api-client.ts`. Jangan menyimpan data produksi ke adapter mockup.
- Style ditambahkan ke stylesheet domain yang paling dekat. Jangan kembalikan
  seluruh style ke `globals.css`.
- Hindari import langsung lintas subfitur. Shared type dan helper ditempatkan
  pada `shared.ts` atau `types.ts` di dalam domain.
- Jalankan `npm run check` dari root project sebelum merge atau membuat ZIP.

## Pemilik modul terbaru

Pembagian lengkap dan status path ADA/BARU ada di [panduan tim](README-TIM-PKM.md),
versi 15 Oktober 2026. Struktur ini menjelaskan file yang sudah tersedia, bukan
perintah membuat seluruh folder rencana sekaligus.

- `registration/` dan `RegistrationForm.tsx`: anggota 5; client berkas dari 7.
- `student-records/`: anggota 6. `DocumentReview.tsx` sudah ada; jangan membuat
  panel dokumen kedua. `FilePreview.tsx` milik 5 dipakai bersama 6.
- `Achievements.tsx` dan `admin/AchievementsModule.tsx`: anggota 8.
- `ClubDirectory.tsx` dan `admin/ClubsModule.tsx`: anggota 2.
- `lib/cms/catalog.ts`, `lib/use-catalog.ts`, dan `styles/admin/catalog.css`
  digunakan anggota 2 dan 8. Perubahan lintas modul direview anggota 10.
- API, schema database, dan migration untuk fitur baru belum dibuat. Mengubah
  kontrak OpenAPI tidak mengubah runtime frontend/backend.

Saat memakai API, tambah loading/empty/error pada pemilik fitur. Backend adalah
sumber data; jangan fallback diam-diam ke seed jika request gagal. File biner
memerlukan client blob terautentikasi, bukan `requestApi<T>` yang membaca JSON.
Metadata pendaftar demo berada di sessionStorage dan File hanya di memori;
penyimpanan ini tidak memenuhi kebutuhan upload production.

Target revisi PPDB belum diterapkan pada UI: ekstrakurikuler multiselect opsional,
persyaratan berkas dari Pengaturan, jadwal manual, dan area pribadi pendaftar untuk
koreksi berkas. Path rencana dan pemiliknya tercantum di panduan tim; jangan
menganggap keberadaan kontrak v1.2.0 berarti fitur tersebut sudah berjalan.

## Guardrail navigasi sticky

- Bar pengumuman PPDB berada di luar `.site-navigation-shell` dan mengikuti
  scroll normal. Hanya navbar yang sticky.
- State `.is-scrolled` hanya boleh mengubah tampilan kosmetik, misalnya bayangan
  dan warna. Jangan mengubah tinggi, padding, margin, ukuran logo, atau posisi
  elemen berdasarkan state ini: scroll anchoring dapat memicu loop kedip.
- Tinggi navbar boleh berbeda berdasarkan breakpoint, tetapi harus tetap sama
  sebelum/sesudah scroll pada breakpoint yang sama.
- Uji scroll turun lalu kembali ke sekitar 24 px dan 8 px, berhenti tanpa input,
  lalu kembali ke 0. Posisi scroll dan tinggi halaman harus stabil. Ulangi pada
  mobile serta setelah navigasi antarhalaman.
- Test struktur HTML dan guard CSS berada di
  `frontend/tests/rendered-html.test.mjs`; tetap lakukan uji interaksi browser
  karena test tersebut tidak mensimulasikan scroll anchoring.
