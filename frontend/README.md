# Frontend SMP Nurul Huda

Seluruh website publik dan dashboard admin berada di folder ini. Frontend memakai React 19, TypeScript, Vinext, dan Vite.

## Menjalankan dari root workspace

```bash
npm install
npm run dev
```

Website tersedia di `http://localhost:3000` dan dashboard di `http://localhost:3000/admin`.
Gunakan `npm run check` sebelum menyerahkan perubahan.

## Titik integrasi backend

- `app/lib/api-client.ts`: HTTP client dan konfigurasi base URL.
- `app/lib/local-cms.ts`: barrel export stabil untuk adapter mockup.
- `app/lib/cms/`: implementasi data lokal yang dipisah per domain.
- `app/school-directory-data.ts`: tipe dan seed struktur organisasi/guru.
- `../contracts/openapi.yaml`: kontrak endpoint yang disarankan.

Peta folder dan aturan penempatan kode baru tersedia di
[`../docs/FRONTEND_STRUCTURE.md`](../docs/FRONTEND_STRUCTURE.md).

Tanpa backend, tombol admin masuk ke mode demo lokal tanpa password hardcoded.
Saat `NEXT_PUBLIC_API_BASE_URL` tersedia, login memakai `/auth/login` dan session
cookie HttpOnly sesuai kontrak OpenAPI.

Salin `.env.example` menjadi `.env.local`, lalu isi `NEXT_PUBLIC_API_BASE_URL` ketika backend sudah tersedia. Jangan simpan token atau credential di repository.
