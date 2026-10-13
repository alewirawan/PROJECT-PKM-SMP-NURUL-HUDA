# Kontrak Frontend–Backend

`openapi.yaml` adalah sumber acuan integrasi. Backend boleh memakai teknologi apa pun, tetapi nama field, tipe data, status HTTP, dan bentuk error sebaiknya mengikuti kontrak ini.

Alur migrasi dari mockup lokal:

1. Jalankan backend di `http://localhost:4000/api/v1`.
2. Salin `frontend/.env.example` menjadi `frontend/.env.local`.
3. Implementasikan repository async menggunakan `frontend/app/lib/api-client.ts`.
4. Ganti pemanggilan fungsi sinkron di `frontend/app/lib/local-cms.ts` secara bertahap per resource.
5. Pertahankan tipe TypeScript yang sama agar komponen UI tidak perlu ditulis ulang.
6. Implementasikan cookie session dengan atribut `HttpOnly`, `Secure` di production,
   dan `SameSite=Lax` atau kebijakan yang lebih ketat.

Kontrak mencakup autentikasi, pendaftar, dokumen, struktur/guru, artikel, agenda,
pesan, newsletter, dan pengaturan. Validasi `SchoolDirectory` membatasi maksimal
satu posisi `principal`.
