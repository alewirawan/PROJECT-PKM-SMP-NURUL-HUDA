# Backend SMP Nurul Huda

Backend dasar menggunakan Fastify, TypeScript, PostgreSQL, dan Drizzle ORM. Target
deployment adalah satu VPS untuk satu sekolah.

## Isi fondasi saat ini

- konfigurasi environment tervalidasi;
- PostgreSQL client dan schema Drizzle;
- tabel `admins`, `admin_sessions`, `applications`, dan
  `application_documents`;
- migration SQL awal;
- autentikasi admin berbasis cookie session;
- rate limit login dan global request;
- CORS allowlist, Helmet, multipart limit, dan error envelope konsisten;
- endpoint health dan readiness;
- test untuk health, 404, dan validasi login;
- Dockerfile dan Compose PostgreSQL.
- modul ekstrakurikuler (tambah, edit, nonaktif) dan agenda (tambah, edit, hapus);
- daftar publik terfilter, izin super_admin/editor, serta pemeriksaan Origin untuk mutasi konten;
- migration `0001_many_colossus.sql` untuk tabel klub dan agenda.

CRUD pendaftar, dokumen, direktori, artikel, pesan, dan settings berikutnya
dibuat per modul dengan mengikuti `../contracts/openapi.yaml`.

## Ekstrakurikuler dan agenda

Jalankan migration yang sudah tersedia sebelum memakai modul ini. Tabel baru
awalnya kosong; tambahkan konten lewat admin, bukan mengimpor data demo otomatis.

| Endpoint (prefix /api/v1) | Akses |
| --- | --- |
| GET /clubs | Publik; hanya kegiatan aktif |
| GET /admin/clubs | super_admin/editor; termasuk nonaktif |
| POST /clubs, PATCH /clubs/:clubId | super_admin/editor |
| GET /agenda | Publik; hanya visibility=Publik |
| GET /admin/agenda | super_admin/editor; termasuk internal |
| POST /agenda, PATCH /agenda/:agendaId, DELETE /agenda/:agendaId | super_admin/editor |

PATCH klub menerima sebagian field. PATCH agenda mengirim seluruh AgendaInput.
Mutasi harus membawa cookie session dan header Origin yang cocok dengan
FRONTEND_ORIGINS. Browser mengirim Origin otomatis. Klien CLI harus mengirimkannya
secara eksplisit. Role admin_ppdb tidak boleh mengelola konten ini.

Di frontend, atur NEXT_PUBLIC_API_BASE_URL ke alamat API dengan prefix /api/v1,
lalu restart dev server. Gunakan hostname konsisten untuk frontend/backend
(misalnya localhost untuk keduanya) agar cookie same-site bekerja. Tanpa URL API,
kedua modul berjalan sebagai demo browser. Dalam mode API, kegagalan tidak diganti
dengan data demo. Modul lain masih mengikuti status implementasi masing-masing.

Konfigurasi CSP frontend saat ini mengizinkan API HTTP lokal hanya melalui
http://localhost:4000. Gunakan alamat ini untuk pengujian browser; port HTTP
lain memerlukan penyesuaian CSP yang direview bersama anggota 10. Daftarkan
origin frontend yang persis sama pada FRONTEND_ORIGINS backend.
Setelah menambahkan metode HTTP baru, uji OPTIONS/preflight dan aksi browser,
bukan hanya app.inject; CORS harus mengizinkan PATCH/DELETE untuk edit/hapus.

Tes PostgreSQL opsional hanya boleh memakai database lokal terpisah bernama
team2_test (atau team2_test_suffix). Jangan arahkan ke database kerja/produksi.
Tes menjalankan migration dan menambahkan data fiktif:

```bash
TEST_DATABASE_URL=postgres://USER@127.0.0.1:PORT/team2_test npm run test --workspace=@nurul-huda/backend
```

Tanpa TEST_DATABASE_URL, unit/API tests tetap berjalan dan tes database dilewati.

## Struktur

```text
backend/
├── src/
│   ├── config/             # environment
│   ├── db/
│   │   ├── client.ts
│   │   └── schema/         # schema per domain
│   ├── modules/
│   │   ├── auth/
│   │   └── health/
│   ├── scripts/            # command administratif
│   ├── shared/             # error dan HTTP helpers
│   ├── types/
│   ├── app.ts              # komposisi Fastify
│   └── index.ts            # process entrypoint
├── drizzle/                # migration SQL versioned
├── tests/
├── .env.example
├── Dockerfile
├── drizzle.config.ts
└── package.json
```

Untuk modul baru gunakan pola:

```text
modules/applications/
├── application.routes.ts
├── application.service.ts
├── application.repository.ts
└── application.schema.ts
```

Route menangani HTTP, service menangani aturan bisnis, dan repository menjadi
satu-satunya lapisan yang mengakses database.

## Menjalankan lokal

Dari root project:

```bash
npm ci
cp backend/.env.example backend/.env
```

Ubah `DATABASE_URL` dan credential lokal. Jangan commit `.env`.

Jalankan PostgreSQL melalui Compose:

```bash
docker compose --env-file backend/.env -f compose.dev.yaml up -d
```

Sebelum menyalakan database pertama kali, isi `POSTGRES_PASSWORD` dan password di
`DATABASE_URL` pada `backend/.env` dengan nilai yang sama. Compose development
membuka PostgreSQL hanya ke `127.0.0.1:5432`, sehingga API dapat berjalan langsung
di komputer anggota. Setelah database healthy, jalankan:

```bash
npm run db:migrate --workspace=@nurul-huda/backend
npm run admin:create --workspace=@nurul-huda/backend
npm run dev:backend
```

API tersedia di `http://127.0.0.1:4000/api/v1`.

- `GET /api/v1/health`: proses API hidup, tidak memeriksa database.
- `GET /api/v1/ready`: memastikan PostgreSQL dapat diakses.
- `POST /api/v1/auth/login`: membuat session admin.
- `GET /api/v1/auth/session`: membaca session aktif.
- `POST /api/v1/auth/logout`: menghapus session.

## Migration

Setelah mengubah file pada `src/db/schema/`:

```bash
npm run db:generate --workspace=@nurul-huda/backend
npm run db:migrate --workspace=@nurul-huda/backend
```

Review SQL hasil generate sebelum migration dijalankan. Jangan menjalankan
migration production tanpa backup database.

## Penyimpanan dokumen

File KK, ijazah, akta, dan pasfoto tidak disimpan sebagai BLOB di PostgreSQL.
Database hanya menyimpan metadata dan `storageKey`. Di VPS gunakan direktori
privat seperti:

```text
/srv/nurul-huda/private/uploads/
```

Direktori ini tidak boleh dijadikan static/public directory. Akses file nantinya
harus melalui endpoint terautentikasi dan authorization check.

## Production minimum

- jalankan backend sebagai user non-root;
- PostgreSQL tidak diekspos ke internet;
- gunakan HTTPS melalui Nginx atau Caddy;
- isi `TRUST_PROXY=true` bila backend berada di belakang reverse proxy;
- gunakan password database unik;
- backup PostgreSQL dan direktori upload ke mesin/object storage lain;
- jalankan `npm run check` sebelum deploy.
