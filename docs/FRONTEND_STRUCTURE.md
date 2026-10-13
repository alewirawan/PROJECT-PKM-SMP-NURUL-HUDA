# Struktur frontend

Frontend dibagi berdasarkan domain agar perubahan pada satu fitur tidak membuat
file utama kembali menjadi monolitik.

```text
frontend/app/
├── components/
│   ├── admin/              # Modul per halaman dashboard admin
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
    ├── public/             # Blog, program, pendaftaran, kontak, dan footer
    ├── base.css
    ├── accessibility.css
    └── *.css               # Aggregator import; jangan isi logic fitur di sini
```

## Aturan maintenance

- `AdminDashboard.tsx`, `StudentRecordsModule.tsx`, dan
  `SchoolDirectoryModule.tsx` hanya mengatur state, navigasi, dan aliran data.
- UI spesifik fitur ditempatkan di subfolder domain terkait.
- Operasi data baru ditambahkan ke modul `lib/cms/` yang sesuai, kemudian
  diekspor melalui `lib/local-cms.ts`.
- Style ditambahkan ke stylesheet domain yang paling dekat. Jangan kembalikan
  seluruh style ke `globals.css`.
- Hindari import langsung lintas subfitur. Shared type dan helper ditempatkan
  pada `shared.ts` atau `types.ts` di dalam domain.
- Jalankan `npm run check` dari root project sebelum merge atau membuat ZIP.

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
