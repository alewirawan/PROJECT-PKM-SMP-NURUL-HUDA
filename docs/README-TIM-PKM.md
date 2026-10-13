# Panduan Kerja Tim PKM — Website SMP Nurul Huda

Tanggal penyusunan: 25 September 2026  
Jumlah anggota: 10 orang  
Tahap project: frontend mockup dan fondasi backend; implementasi fitur belum lengkap.

Pembaruan paket 28 September 2026: launcher frontend lintas shell dan
`compose.dev.yaml` untuk PostgreSQL lokal sudah ditambahkan. Gunakan
[Panduan Instalasi terbaru](../PANDUAN-INSTALASI.md) untuk menjalankan paket.
Analisis dan checklist di bawah merupakan acuan awal 25 September 2026;
modul fitur yang ditandai baru tetap belum diimplementasikan.

> Dokumen ini adalah panduan pembagian pekerjaan. Path bertanda **baru** merupakan
> rencana yang belum dibuat. Pembuatan panduan ini tidak menjalankan database,
> mengimplementasikan fitur, atau melakukan deployment.

## Daftar isi

1. [Cara menggunakan panduan](#cara-menggunakan-panduan)
2. [Status project dan batas lingkup](#status-project-dan-batas-lingkup)
3. [Persiapan sebelum kerja paralel](#persiapan-sebelum-kerja-paralel)
4. [Peta pembagian 10 anggota](#peta-pembagian-10-anggota)
5. [Struktur folder dan fungsi file](#struktur-folder-dan-fungsi-file)
6. [Anggota 1 — Beranda, Tentang, frontend Pengaturan](#anggota-1)
7. [Anggota 2 — Program dan Agenda](#anggota-2)
8. [Anggota 3 — Struktur dan Guru](#anggota-3)
9. [Anggota 4 — Blog dan Artikel](#anggota-4)
10. [Anggota 5 — Pendaftaran online dan Pendaftar](#anggota-5)
11. [Anggota 6 — Data siswa dan pendaftaran offline](#anggota-6)
12. [Anggota 7 — Backend dokumen](#anggota-7)
13. [Anggota 8 — Kontak, Pesan, pengujian](#anggota-8)
14. [Anggota 9 — Login, izin akses, backend Pengaturan](#anggota-9)
15. [Anggota 10 — Dashboard, setup, integrasi](#anggota-10)
16. [Kepemilikan file bersama](#kepemilikan-file-bersama)
17. [Kontrak API yang perlu disepakati](#kontrak-api-yang-perlu-disepakati)
18. [Urutan pengerjaan dan belajar](#urutan-pengerjaan-dan-belajar)
19. [Alur Git dan kriteria selesai](#alur-git-dan-kriteria-selesai)

## Cara menggunakan panduan

Root project pada komputer penyusun:

```text
/Users/vwxyesa/Project/project-k/
```

Semua path di dokumen ini relatif terhadap root tersebut. Pada komputer anggota
lain, lokasi root boleh berbeda. Contohnya, `frontend/app/page.tsx` berarti membuka
folder project, kemudian `frontend`, `app`, dan file `page.tsx`.

Urutan membaca untuk anggota:

1. Baca status project dan persiapan bersama.
2. Temukan nomor anggota dan isi nama penanggung jawab pada tabel pembagian.
3. Buka file yang sudah ada di bagian tugasnya.
4. Kerjakan tugas pertama, lalu lanjutkan checklist fungsi.
5. Periksa ketergantungan dan kriteria selesai sebelum mengajukan penggabungan.

Istilah yang digunakan:

| Istilah | Makna |
| --- | --- |
| Frontend | Tampilan dan interaksi website yang digunakan pengunjung/admin |
| Backend | Proses server yang menerima request, memeriksa data dan izin, lalu mengakses database |
| API | Jalur komunikasi frontend dengan backend |
| Schema tabel | Rancangan kolom, tipe data, dan hubungan tabel database |
| Migration | Riwayat perubahan struktur database yang dijalankan secara berurutan |
| CRUD | Membuat, membaca, mengubah, dan menghapus data |
| Mockup | Simulasi tampilan/fungsi yang belum sepenuhnya memakai sistem sebenarnya |
| Session | Informasi yang membuktikan admin sudah login |
| Pull request | Permintaan untuk memeriksa dan menggabungkan perubahan kode |

Bahasa utama frontend dan backend adalah TypeScript. Frontend menggunakan React;
backend menggunakan Fastify, PostgreSQL, dan Drizzle ORM.

## Status project dan batas lingkup

### Yang sudah tersedia

| Bagian | Status nyata |
| --- | --- |
| Website publik | Beranda, Tentang, Program, Struktur & Guru, Blog, Kontak, Pendaftaran sudah memiliki tampilan |
| Dashboard admin | Dashboard, Pendaftar, Data siswa, Struktur & guru, Artikel, Agenda, Pesan, Pengaturan sudah memiliki tampilan |
| Penyimpanan mockup | Data publik menggunakan penyimpanan browser; data pribadi simulasi menggunakan sessionStorage |
| Server backend | Konfigurasi environment, koneksi database, error handler, dan middleware dasar tersedia |
| Auth | Kode login, cek session, logout, serta script pembuatan admin tersedia |
| Database | Definisi tabel admins, admin_sessions, applications, application_documents dan migration awal tersedia |
| Health | Endpoint pengecekan proses API dan kesiapan koneksi database tersedia |
| Pengujian backend | Tiga test dasar: health, endpoint tidak ditemukan, dan payload login tidak valid |
| Deployment | Dockerfile dan Compose awal tersedia; belum dianggap teruji untuk deployment |

Endpoint yang sudah diimplementasikan pada kode, dengan awalan `/api/v1`:

```text
GET  /health
GET  /ready
POST /auth/login
GET  /auth/session
POST /auth/logout
```

Migration, login, dan container belum divalidasi lengkap dengan PostgreSQL nyata
pada tahap fondasi. File schema tersedia tidak berarti tabel sudah terbentuk.

### Yang belum selesai

- API fitur pendaftaran, dokumen, direktori, artikel, agenda, pesan, dan pengaturan.
- Integrasi data fitur sekolah dari frontend ke database.
- Pembatasan tindakan berdasarkan role pada seluruh endpoint admin.
- Upload dan download dokumen nyata.
- Dashboard dengan data server, identitas session, dan indikator yang terverifikasi.
- Pengujian alur lengkap, kesiapan VPS, HTTPS, dan backup yang teruji.

### Batas tahap pertama

- Satu website untuk satu sekolah.
- Menu Data siswa saat ini adalah data **calon siswa/pendaftar**, bukan sistem
  akademik siswa aktif. Nilai, absensi, pembagian kelas, dan jadwal pelajaran tidak
  otomatis termasuk lingkup.
- Program dan narasi profil boleh tetap statis. Editor seluruh isi Beranda,
  Tentang, dan Program merupakan tambahan jika nanti diperlukan.
- Foto guru dan ilustrasi artikel memakai aset contoh dahulu.
- Upload dokumen tahap pertama dilakukan admin. Upload mandiri oleh calon siswa
  membutuhkan mekanisme pembuktian kepemilikan pendaftaran tersendiri.
- Newsletter, jika dilanjutkan, mulai dari pencatatan langganan. Pengiriman email
  massal bukan pekerjaan yang sudah tersedia.
- Gunakan data dan dokumen fiktif untuk pengembangan serta demonstrasi.

## Persiapan sebelum kerja paralel

Pembagian menu sudah dapat menjadi acuan, tetapi beberapa file dan kontrak harus
dirapikan terlebih dahulu agar 10 orang tidak saling menimpa pekerjaan.

| Persiapan | Penanggung jawab | Bukti selesai |
| --- | --- | --- |
| Setup PostgreSQL lokal dan migration | 10, dibantu 9 | Instalasi bersih berhasil; endpoint ready mengonfirmasi koneksi |
| Verifikasi login dan izin dasar | 9 | Login, cek session, logout, dan penolakan akses tanpa session teruji |
| Batas data tiap menu admin | 10 dan pemilik menu | Modul mengurus request fiturnya; shell admin tidak menampung semua data |
| Pisahkan schema pendaftar/dokumen | 5 dan 7, review 10 | File terpisah tanpa mengganti nama atau membuat ulang tabel |
| Sepakati kontrak pendaftar dan dokumen | 5, 6, 7 | ID, field, status, ukuran file, dan endpoint tambahan tertulis |
| Sepakati frontend/backend Pengaturan | 1 dan 9 | Bentuk respons serta pemilik setiap file jelas |
| Tetapkan alur migration dan merge | 10 | Semua anggota memahami branch, review, dan urutan migration |

Temuan setup yang perlu dibereskan: Compose saat ini tidak membuka port PostgreSQL
ke host, sedangkan panduan menjalankan backend langsung pada Mac. Untuk development,
anggota 10 dapat membuat `compose.dev.yaml` yang membuka port database hanya ke
loopback. Alternatifnya adalah menjalankan backend bersama database dalam jaringan
container. Pilih satu alur utama dan tulis panduan yang sudah diuji.

Periksa juga Docker build context agar `.env`, dependency lokal, dan output build
tidak ikut tersalin. Audit terdahulu menunjukkan dependency runtime bersih, tetapi
masih ada advisory development pada tool migration. Status dependency perlu dicek
lagi pada saat integrasi/deploy; jangan memakai downgrade otomatis tanpa review.

## Peta pembagian 10 anggota

| Anggota | Nama | Menu utama | Bantuan/ketergantungan |
| --- | --- | --- | --- |
| 1 | Belum ditentukan | Beranda, Tentang, frontend Pengaturan | API artikel dari 4, direktori dari 3, pengaturan dari 9 |
| 2 | Belum ditentukan | Program dan Agenda | Izin akses dari 9 |
| 3 | Belum ditentukan | Struktur organisasi dan Guru | Izin akses dari 9; aset foto contoh dahulu |
| 4 | Belum ditentukan | Blog dan Artikel & berita | Menyediakan data berita terbaru untuk 1 |
| 5 | Belum ditentukan | Pendaftaran online dan menu Pendaftar | Berbagi data dengan 6; pengaturan PPDB dari 9 |
| 6 | Belum ditentukan | Data siswa, pencarian, input offline, UI dokumen | Pembuat nomor/status dari 5; API dokumen dari 7 |
| 7 | Belum ditentukan | Backend dokumen | ID pendaftar dari 5–6; izin dari 9; tampilan oleh 6 |
| 8 | Belum ditentukan | Kontak, Pesan, pengujian lintas menu | Pemilik fitur memperbaiki bug yang ditemukan |
| 9 | Belum ditentukan | Login, hak akses, backend Pengaturan | Frontend Pengaturan oleh 1; setup bersama 10 |
| 10 | Belum ditentukan | Dashboard ringkasan, setup, koordinasi integrasi | Setiap anggota menyelesaikan integrasi dan bug menunya sendiri |

Beban belum tentu sama karena kemampuan anggota belum dipetakan. Anggota 1 cocok
untuk pemula. Pendaftaran, dokumen, autentikasi, dan koordinasi teknis membutuhkan
anggota yang lebih siap atau pendampingan. Anggota 10 bukan penanggung jawab untuk
menyelesaikan semua fitur yang tertinggal.

## Struktur folder dan fungsi file

Struktur target tingkat utama:

```text
project-k/
├── frontend/
│   ├── app/
│   │   ├── page.tsx dan folder halaman   sudah ada
│   │   ├── components/                 sudah ada; tambah komponen bila perlu
│   │   ├── lib/
│   │   │   ├── api-client.ts            sudah ada: request HTTP bersama
│   │   │   ├── api/                     BARU: request per fitur
│   │   │   ├── content/                 BARU: konten statis per halaman
│   │   │   └── cms/                     sudah ada: mockup sementara
│   │   └── styles/                     sudah ada: CSS per bagian
│   └── tests/
├── backend/
│   ├── src/
│   │   ├── modules/                    auth/health ada; modul lain baru
│   │   ├── db/schema/                  schema per domain
│   │   ├── shared/
│   │   ├── config/
│   │   ├── app.ts
│   │   └── index.ts
│   ├── drizzle/
│   └── tests/
├── contracts/openapi.yaml
├── docs/
├── compose.yaml
└── package.json
```

Tidak membuat folder berdasarkan nama anggota. Folder mengikuti fungsi, sehingga
pemindahan penanggung jawab tidak memerlukan pemindahan source code.

Pola standar modul backend:

```text
backend/src/modules/posts/
├── post.routes.ts       menerima request dan mengirim response
├── post.schema.ts       memvalidasi input request
├── post.service.ts      menjalankan aturan/proses bisnis
└── post.repository.ts   membaca dan menulis database

backend/src/db/schema/posts.ts   mendefinisikan tabel artikel
```

`post.schema.ts` berbeda dengan `db/schema/posts.ts`: yang pertama memeriksa request,
yang kedua mendefinisikan tabel. Frontend mengakses backend lewat API, bukan dengan
mengimpor repository/database backend.

Frontend memakai `lib/api/<fitur>.ts` untuk fungsi request dan tipe respons yang
relevan. Jika tipe berkembang panjang, pisahkan di dekat modulnya. Tidak perlu
menambah package bersama atau library state baru hanya untuk membuat folder.

Migrasi mockup dilakukan per menu. Saat menu sudah memakai API, kegagalan API harus
ditampilkan sebagai error; jangan menggantinya diam-diam dengan data demo. Ubah
proses sinkron menjadi async, termasuk keadaan loading, kosong, gagal, dan submit.

<a id="anggota-1"></a>
## Anggota 1 — Beranda, Tentang, frontend Pengaturan

### File yang sudah ada

```text
frontend/app/page.tsx
frontend/app/tentang/page.tsx
frontend/app/components/HomeNews.tsx
frontend/app/components/SchoolSettingsProvider.tsx
frontend/app/components/admin/SettingsModule.tsx
frontend/app/components/SiteHeader.tsx
frontend/app/components/SiteFooter.tsx
frontend/app/styles/public/editorial.css
```

Header/footer adalah komponen bersama; perubahan link dan navigasinya direview
bersama anggota 10. CSS Tentang yang sekarang bercampur di stylesheet publik dapat
dipindahkan bertahap, tanpa menggandakan selector.

### File baru yang disarankan

```text
frontend/app/lib/content/home.ts
frontend/app/lib/content/about.ts
frontend/app/lib/api/settings.ts
frontend/app/styles/public/about.css
```

### Checklist pekerjaan

- [ ] Pisahkan konten panjang Beranda/Tentang dari komponen tampilannya.
- [ ] Sesuaikan visi, misi, foto, dan informasi contoh dengan konten yang disepakati.
- [ ] Hubungkan HomeNews ke fungsi API artikel anggota 4.
- [ ] Hubungkan SettingsModule dan SchoolSettingsProvider ke API anggota 9.
- [ ] Pastikan perubahan identitas sekolah konsisten pada header/footer dan halaman terkait.
- [ ] Ambil nama kepala sekolah dari direktori jika bagian itu dibuat dinamis.
- [ ] Periksa kedua halaman di mobile dan desktop.

Tidak perlu membuat backend home/about pada tahap ini. Narasi profil boleh statis;
Pengaturan saat ini tidak mencakup editor seluruh isi halaman.

**Tugas pertama:** rapikan konten Beranda/Tentang dan catat field yang harus mengikuti Pengaturan.

**Selesai jika:** informasi sekolah konsisten, berita mengikuti artikel terbit, dan
perubahan Pengaturan tetap tersedia setelah halaman dibuka ulang.

<a id="anggota-2"></a>
## Anggota 2 — Program dan Agenda

### File yang sudah ada

```text
frontend/app/program/page.tsx
frontend/app/data.ts
frontend/app/components/admin/AgendaModule.tsx
frontend/app/lib/cms/agenda.ts
frontend/app/styles/public/programs.css
```

### File baru yang disarankan

```text
frontend/app/lib/content/programs.ts
frontend/app/lib/api/agenda.ts
frontend/app/styles/admin/agenda.css
backend/src/modules/agenda/agenda.routes.ts
backend/src/modules/agenda/agenda.schema.ts
backend/src/modules/agenda/agenda.service.ts
backend/src/modules/agenda/agenda.repository.ts
backend/src/db/schema/agenda.ts
backend/tests/agenda.test.ts
```

### Checklist pekerjaan

- [ ] Pindahkan data program ke content/programs.ts, koordinasikan import Beranda dengan anggota 1.
- [ ] Buat tabel agenda dan API daftar, tambah, edit, hapus, serta perubahan status.
- [ ] Hubungkan AgendaModule ke API dan izin akses anggota 9.
- [ ] Tampilkan loading, data kosong, dan kegagalan penyimpanan.
- [ ] Tentukan data agenda mana yang publik; rapat/internal tidak otomatis dibuka ke pengunjung.

Program tetap konten statis dahulu. Editor Program tidak wajib dibuat pada tahap ini.

**Tugas pertama:** tampilkan daftar agenda dari database.

**Selesai jika:** agenda yang dikelola admin tersimpan dan dapat dibuka dari browser lain.

<a id="anggota-3"></a>
## Anggota 3 — Struktur dan Guru

### File yang sudah ada

```text
frontend/app/struktur/page.tsx
frontend/app/school-directory-data.ts
frontend/app/components/OrganizationDirectory.tsx
frontend/app/components/TeacherDirectory.tsx
frontend/app/components/SchoolDirectoryModule.tsx
frontend/app/components/school-directory/DirectoryEditor.tsx
frontend/app/components/school-directory/DirectoryStructureTab.tsx
frontend/app/components/school-directory/DirectoryTeachersTab.tsx
frontend/app/components/school-directory/shared.ts
frontend/app/styles/directory/organization.css
frontend/app/styles/directory/teachers.css
frontend/app/styles/directory/admin-directory.css
```

### File baru yang disarankan

```text
frontend/app/lib/api/directory.ts
backend/src/modules/directory/directory.routes.ts
backend/src/modules/directory/directory.schema.ts
backend/src/modules/directory/directory.service.ts
backend/src/modules/directory/directory.repository.ts
backend/src/db/schema/directory.ts
backend/tests/directory.test.ts
```

### Checklist pekerjaan

- [ ] Buat tabel profil guru dan pimpinan/jabatan, termasuk urutan serta tingkat struktur.
- [ ] Hubungkan editor admin dan halaman publik ke API direktori.
- [ ] Terapkan maksimal satu kepala sekolah, dengan keadaan kosong tetap diperbolehkan.
- [ ] Uji tambah/hapus profil, pemindahan tingkat, dan tingkat tanpa anggota.
- [ ] Sesuaikan kontrak contains/minContains agar nol kepala sekolah tidak ditolak.
- [ ] Atur penyimpanan konsisten; pertimbangkan versi data agar edit dua admin tidak saling menimpa.

Foto contoh tetap digunakan dahulu. Upload foto publik guru merupakan fitur berbeda
dari dokumen siswa yang privat. Data guru yang tidak perlu diketahui publik jangan
ikut dimasukkan ke respons direktori publik.

**Tugas pertama:** tampilkan satu guru dari database pada halaman Struktur.

**Selesai jika:** perubahan profil/jabatan dari admin muncul pada website, termasuk struktur kosong.

<a id="anggota-4"></a>
## Anggota 4 — Blog dan Artikel

### File yang sudah ada

```text
frontend/app/blog/page.tsx
frontend/app/blog/[slug]/page.tsx
frontend/app/components/PublicBlog.tsx
frontend/app/components/BlogDetailView.tsx
frontend/app/components/admin/PostsModule.tsx
frontend/app/lib/cms/posts.ts
frontend/app/styles/public/blog.css
frontend/app/styles/admin/articles.css
```

### File baru yang disarankan

```text
frontend/app/lib/api/posts.ts
backend/src/modules/posts/post.routes.ts
backend/src/modules/posts/post.schema.ts
backend/src/modules/posts/post.service.ts
backend/src/modules/posts/post.repository.ts
backend/src/db/schema/posts.ts
backend/tests/posts.test.ts
```

### Checklist pekerjaan

- [ ] Buat tabel dan API artikel, termasuk aturan slug unik.
- [ ] Bedakan daftar publik dan daftar admin yang boleh memuat draft.
- [ ] Hubungkan editor, daftar artikel, dan halaman detail ke API.
- [ ] Sediakan fungsi artikel terbaru untuk anggota 1.
- [ ] Ganti sumber metadata judul/deskripsi pada blog/[slug]/page.tsx yang masih memakai contoh.
- [ ] Pastikan artikel baru dapat dibuka langsung melalui URL tanpa bergantung pada daftar seed.
- [ ] Tambahkan kebutuhan daftar admin dan detail berdasarkan slug ke kontrak API.

Gambar memakai aset yang tersedia dahulu. Jangan membuka draft melalui API publik
hanya karena tombol di frontend disembunyikan.

**Tugas pertama:** tampilkan daftar artikel terbit dari database.

**Selesai jika:** artikel baru bisa diterbitkan, dibuka melalui URL, muncul di Beranda;
draft hanya bisa dibaca admin yang berhak.

<a id="anggota-5"></a>
## Anggota 5 — Pendaftaran online dan Pendaftar

### File yang sudah ada

```text
frontend/app/pendaftaran/page.tsx
frontend/app/components/RegistrationForm.tsx
frontend/app/components/admin/ApplicationsModule.tsx
frontend/app/styles/public/registration.css
backend/src/db/schema/admissions.ts
```

### File baru yang disarankan

```text
frontend/app/lib/api/applications/submission.ts
frontend/app/lib/api/applications/types.ts
frontend/app/styles/admin/applications.css
backend/src/modules/applications/submission.routes.ts
backend/src/modules/applications/submission.schema.ts
backend/src/modules/applications/submission.service.ts
backend/src/modules/applications/submission.repository.ts
backend/src/modules/applications/registration-number.ts
backend/src/modules/applications/application.mapper.ts
backend/src/modules/applications/application-status.service.ts
backend/src/db/schema/applications.ts
backend/tests/application-submission.test.ts
```

applications.ts pada schema berasal dari pemisahan admissions.ts; bukan tabel
pendaftar tambahan. Pemisahan dikoordinasikan dengan anggota 7 dan 10.

### Checklist pekerjaan

- [ ] Buat API pendaftaran publik dengan validasi server dan batas request.
- [ ] Buat nomor pendaftaran unik di server, bukan dari timestamp browser.
- [ ] Periksa PPDB dibuka/ditutup menggunakan pengaturan yang disepakati dengan anggota 9.
- [ ] Kembalikan bukti pendaftaran tanpa data pribadi yang tidak diperlukan.
- [ ] Hubungkan menu Pendaftar ke API daftar anggota 6.
- [ ] Buat aturan perubahan status yang digunakan endpoint edit anggota 6.
- [ ] Pastikan ekspor CSV jelas: halaman saat ini atau seluruh hasil filter; jangan terpotong diam-diam.
- [ ] Sepakati field/type respons dan pemetaan database bersama anggota 6–7.

Anggota 5 memiliki helper nomor pendaftaran dan pemetaan data aplikasi. Perubahan
helper yang dipakai bersama harus direview anggota 6. Hindari validasi duplikat yang
berbeda antara pendaftaran online dan offline.

**Tugas pertama:** simpan satu pendaftaran publik dan kembalikan nomor dari server.

**Selesai jika:** isian valid tersimpan, isian salah ditolak, pendaftar muncul di admin,
dan perubahan status tersimpan melalui aturan backend.

<a id="anggota-6"></a>
## Anggota 6 — Data siswa dan pendaftaran offline

### File yang sudah ada

```text
frontend/app/components/StudentRecordsModule.tsx
frontend/app/components/student-records/StudentProfileDrawer.tsx
frontend/app/components/student-records/OfflineStudentForm.tsx
frontend/app/components/student-records/shared.tsx
frontend/app/styles/directory/students.css
frontend/app/styles/directory/student-ledger.css
frontend/app/styles/directory/student-profile.css
frontend/app/styles/directory/student-entry.css
```

### File baru yang disarankan

```text
frontend/app/lib/api/applications/records.ts
frontend/app/components/student-records/StudentIdentityForm.tsx
frontend/app/components/student-records/StudentDocumentsPanel.tsx
backend/src/modules/applications/records.routes.ts
backend/src/modules/applications/records.schema.ts
backend/src/modules/applications/records.service.ts
backend/src/modules/applications/records.repository.ts
backend/tests/application-records.test.ts
```

### Checklist pekerjaan

- [ ] Buat API daftar/pencarian/filter/pagination untuk kedua menu admin pendaftar.
- [ ] Buat API detail, edit identitas, dan input offline dengan pemeriksaan izin.
- [ ] Gunakan helper nomor pendaftaran anggota 5.
- [ ] Pada endpoint edit, perubahan status menggunakan aturan anggota 5.
- [ ] Pisahkan UI dokumen ke StudentDocumentsPanel.tsx dan hubungkan API anggota 7.
- [ ] Uji kelengkapan dokumen berdasarkan jenis yang wajib, bukan sekadar jumlah file.
- [ ] Bedakan pencatatan berkas fisik offline dengan file digital yang benar-benar sudah diunggah.

### Batas dengan anggota 5

| Operasi | Pemilik |
| --- | --- |
| POST pendaftaran online | 5 |
| GET daftar dan GET detail | 6; digunakan juga menu anggota 5 |
| POST pendaftaran offline | 6 |
| PATCH data/status | Endpoint dimiliki 6; aturan status menggunakan service anggota 5 |
| Schema tabel dan mapper aplikasi | 5 sebagai pemilik, perubahan disepakati dengan 6 |

Jangan mendaftarkan dua handler untuk HTTP method dan path yang sama. Jangan membuat
tabel students untuk menduplikasi applications. Penghapusan pendaftar, jika dimasukkan
ke tahap implementasi, harus disepakati bersama terkait relasi dokumen dan retensi.

**Tugas pertama:** tampilkan daftar/detail pendaftar melalui API.

**Selesai jika:** data online/offline dapat dicari dan diperbarui, konsisten di kedua menu,
dan panel dokumen menggunakan API file yang sebenarnya.

<a id="anggota-7"></a>
## Anggota 7 — Backend dokumen

### Acuan yang sudah ada

```text
backend/src/db/schema/admissions.ts
frontend/app/lib/cms/student-documents.ts
frontend/app/components/student-records/StudentProfileDrawer.tsx
```

File frontend di atas dipelajari sebagai acuan. UI detail dikerjakan anggota 6.

### File baru yang disarankan

```text
frontend/app/lib/api/documents.ts
backend/src/modules/documents/document.routes.ts
backend/src/modules/documents/document.schema.ts
backend/src/modules/documents/document.service.ts
backend/src/modules/documents/document.repository.ts
backend/src/modules/documents/document.storage.ts
backend/src/modules/documents/document.mapper.ts
backend/src/db/schema/documents.ts
backend/tests/documents.test.ts
```

Folder runtime lokal: `backend/uploads/`. Folder ini tidak masuk Git dan tidak
diletakkan di frontend/public. Schema documents.ts berasal dari pemisahan admissions.ts.

### Checklist pekerjaan

- [ ] Simpan file dengan nama internal yang dibuat server, terhubung ke pendaftar yang benar.
- [ ] Validasi jenis dan ukuran file; jangan hanya mempercayai nama ekstensi.
- [ ] Buat download dengan pemeriksaan login dan izin pada setiap request.
- [ ] Buat perubahan status verifikasi beserta pemeriksa dan waktunya.
- [ ] Tangani kegagalan penyimpanan agar metadata tidak menunjuk file yang tidak ada.
- [ ] Tentukan perilaku mengganti file lama dan pembersihan file yang gagal disimpan.
- [ ] Sediakan fungsi client documents.ts untuk dipakai anggota 6.
- [ ] Lengkapi kontrak daftar dokumen, download, dan verifikasi.

Nomor pendaftaran bukan bukti izin mengunggah atau mengunduh. Tahap pertama memakai
upload oleh admin terautentikasi. Portal upload mandiri calon siswa perlu rancangan
akses tambahan sebelum diimplementasikan.

**Tugas pertama:** upload satu file fiktif melalui request admin dan simpan metadata.

**Selesai jika:** file dapat diunggah dan diunduh oleh admin yang berhak; akses tanpa izin
ditolak; validasi file dan kegagalan penyimpanan ditangani.

<a id="anggota-8"></a>
## Anggota 8 — Kontak, Pesan, pengujian

### File yang sudah ada

```text
frontend/app/kontak/page.tsx
frontend/app/components/ContactForm.tsx
frontend/app/components/NewsletterForm.tsx
frontend/app/components/admin/MessagesModule.tsx
frontend/app/styles/public/contact.css
```

### File baru untuk tahap utama

```text
frontend/app/lib/api/messages.ts
frontend/app/styles/admin/messages.css
backend/src/modules/messages/message.routes.ts
backend/src/modules/messages/message.schema.ts
backend/src/modules/messages/message.service.ts
backend/src/modules/messages/message.repository.ts
backend/src/db/schema/messages.ts
backend/tests/messages.test.ts
docs/testing/manual-checklist.md
```

### Checklist pekerjaan

- [ ] Simpan pesan publik dengan validasi dan pembatasan request.
- [ ] Tampilkan pesan hanya kepada admin yang berhak.
- [ ] Simpan status dibaca/selesai dan tampilkan kegagalan jika request gagal.
- [ ] Uji alur pendaftaran → admin → detail → dokumen menggunakan data fiktif.
- [ ] Catat langkah reproduksi, hasil yang diharapkan, hasil aktual, dan pemilik bug.

Pengujian oleh anggota 8 membantu tim; setiap pemilik fitur tetap bertanggung jawab
terhadap pengujian dan perbaikan fiturnya sendiri.

Tahap lanjutan newsletter menggunakan pola empat file yang sama di
`backend/src/modules/newsletter/`, schema `backend/src/db/schema/newsletter.ts`,
dan client `frontend/app/lib/api/newsletter.ts`. Tidak perlu membuat folder kosong
sebelum tahap tersebut dimulai.

**Tugas pertama:** simpan satu pesan Kontak dan tampilkan pada Pesan masuk.

**Selesai jika:** pesan tersimpan, status bisa dikelola, dan checklist pengujian lintas menu tersedia.

<a id="anggota-9"></a>
## Anggota 9 — Login, izin akses, backend Pengaturan

### File yang sudah ada

```text
frontend/app/components/admin/AdminLogin.tsx
backend/src/modules/auth/auth.routes.ts
backend/src/modules/auth/auth.service.ts
backend/src/modules/auth/auth.repository.ts
backend/src/db/schema/auth.ts
backend/src/scripts/create-admin.ts
```

### File baru yang disarankan

```text
frontend/app/lib/api/auth.ts
frontend/app/components/admin/AdminAuthProvider.tsx
backend/src/modules/auth/auth.guard.ts
backend/src/modules/settings/settings.routes.ts
backend/src/modules/settings/settings.schema.ts
backend/src/modules/settings/settings.service.ts
backend/src/modules/settings/settings.repository.ts
backend/src/db/schema/settings.ts
backend/tests/auth.test.ts
backend/tests/settings.test.ts
```

### Checklist pekerjaan

- [ ] Uji pembuatan admin, login, session valid/kedaluwarsa, dan logout dengan database.
- [ ] Sediakan guard untuk pemeriksaan login serta role di endpoint admin.
- [ ] Sepakati hak super_admin, admin_ppdb, dan editor per fitur.
- [ ] Sediakan identitas session melalui AdminAuthProvider untuk dashboard.
- [ ] Buat GET pengaturan publik dan PUT pengaturan terproteksi.
- [ ] Sepakati bentuk respons dengan anggota 1, termasuk status PPDB untuk anggota 5.
- [ ] Periksa perlindungan request pengubah data pada autentikasi berbasis cookie.
- [ ] Bersama anggota 10, periksa error 4xx agar tidak berubah menjadi 500 tanpa sengaja.

Anggota 1 memiliki SettingsModule, SchoolSettingsProvider, dan client settings.ts.
Anggota 9 menyediakan backend Pengaturan. Pemilik setiap API harus memasang guard;
menyembunyikan menu saja tidak melindungi data.

**Tugas pertama:** buktikan login → session valid → logout → session ditolak.

**Selesai jika:** identitas admin berasal dari session, akses endpoint dibatasi sesuai role,
dan pengaturan dapat disimpan serta dibaca ulang.

<a id="anggota-10"></a>
## Anggota 10 — Dashboard, setup, integrasi

### File yang sudah ada

```text
frontend/app/components/AdminDashboard.tsx
frontend/app/components/admin/DashboardModule.tsx
frontend/app/components/admin/types.ts
backend/src/app.ts
backend/src/db/client.ts
backend/src/db/schema/index.ts
compose.yaml
backend/Dockerfile
.github/workflows/quality.yml
package.json
package-lock.json
```

### File baru yang disarankan

```text
frontend/app/lib/api/dashboard.ts
backend/src/modules/dashboard/dashboard.routes.ts
backend/src/modules/dashboard/dashboard.schema.ts
backend/src/modules/dashboard/dashboard.service.ts
backend/src/modules/dashboard/dashboard.repository.ts
backend/tests/dashboard.test.ts
compose.dev.yaml
.dockerignore
docs/LOCAL_SETUP.md
```

Panduan pembagian dan workflow sudah berada di dokumen ini. Pisahkan menjadi dokumen
lain hanya bila diperlukan; hindari beberapa daftar tugas yang isinya tidak sinkron.

### Checklist pekerjaan

- [ ] Uji instalasi dari checkout bersih, termasuk perintah migration pada npm workspace.
- [ ] Perbaiki jalur koneksi database lokal dan dokumentasikan cara menjalankan yang teruji.
- [ ] Periksa Docker context, dependency, dan runtime; jangan menganggap image siap sebelum diuji.
- [ ] Kurangi state data lintas menu di AdminDashboard; koordinasikan perubahan props dengan pemilik fitur.
- [ ] Gunakan session anggota 9 untuk nama/role admin; tanggal memakai waktu sebenarnya.
- [ ] Buat ringkasan jumlah dari database tanpa mengambil seluruh data pribadi hanya untuk statistik.
- [ ] Ganti indikator contoh dengan hasil terverifikasi atau label yang tidak mengklaim status palsu.
- [ ] Daftarkan route dan ekspor schema dari pemilik fitur.
- [ ] Koordinasikan migration serta review integrasi dan quality check.

AdminDashboard mengatur navigasi/layout/session. Modul menu masing-masing mengurus
request data fiturnya. Anggota 10 mengubah sambungannya, sedangkan pemilik modul
mengerjakan pengambilan dan penyimpanan data.

Tidak membuat tabel duplikat dashboard; statistik berasal dari tabel domain yang
sudah ada. Jangan menghitung target, persentase, atau sisa kuota dari angka contoh
tanpa keputusan aturan yang jelas.

**Tugas pertama:** pastikan setup berhasil di komputer anggota lain dan koneksi database terverifikasi.

**Selesai jika:** setup dapat diulang, dashboard memakai data sebenarnya, dan modul terintegrasi.

## Kepemilikan file bersama

Pemilik adalah penanggung jawab review. Anggota lain tetap boleh berkontribusi melalui
perubahan kecil yang direview, bukan menyalin file secara manual.

| File/area | Pemilik utama | Aturan |
| --- | --- | --- |
| AdminDashboard.tsx | 10 | Pemilik menu menyampaikan perubahan props dan integrasi |
| frontend/app/lib/api-client.ts | 10, review 9 untuk autentikasi | Dipakai semua client; tidak dibuat ulang per anggota |
| SchoolSettingsProvider.tsx | 1 | Bentuk respons disepakati dengan 9 |
| StudentProfileDrawer.tsx | 6 | 7 menyediakan API; layout tetap oleh 6 |
| backend/src/app.ts | 10 | Modul mengekspor fungsi registrasi; wiring digabung terkontrol |
| backend/src/db/schema/index.ts | 10 | Pemilik fitur menyiapkan schema dan usulan ekspor |
| backend/drizzle/ | 10 sebagai koordinator | Generate migration berurutan setelah schema direview |
| contracts/openapi.yaml | Pemilik fitur, koordinasi 10 | Sepakati request/response sebelum integrasi |
| package.json dan lockfile | 10 | Perubahan dependency disepakati bersama |
| CSS global dan aggregator CSS | 10 | Style khusus menu milik masing-masing anggota |
| SiteHeader.tsx, SiteFooter.tsx | 1 | Navigasi bersama direview dengan 10 |

Schema baru `applications.ts` dan `documents.ts` merupakan pemisahan file
`admissions.ts`. Pertahankan identitas tabel/kolom/relasi dan perbarui import. Pemisahan
file semata tidak seharusnya menghasilkan operasi drop/recreate tabel. Review SQL
hasil generate sebelum menjalankannya.

Style agenda/pendaftar/pesan yang masih bercampur di stylesheet lama dipisahkan
bertahap. Jangan hanya menambahkan override baru sehingga aturan lama terus menumpuk.

## Kontrak API yang perlu disepakati

Sumber kontrak: [openapi.yaml](../contracts/openapi.yaml). Kontrak adalah kesepakatan
yang perlu dirapikan; daftar endpoint di dalamnya bukan bukti semua API sudah dibuat.

| Temuan | Keputusan/pengerjaan yang diperlukan | Pemilik |
| --- | --- | --- |
| registrationSource di frontend, source di API, nilai database berbeda kapitalisasi | Pemetaan eksplisit dan tipe respons yang konsisten | 5–6 |
| Frontend memakai NH-... sebagai ID; database memiliki UUID dan registrationNumber | Rekomendasi kompatibilitas: ID API tetap nomor pendaftaran, UUID internal; server melakukan lookup | 5–6–7 |
| key / kind / documentType berbeda antar-lapisan | Tetapkan bentuk API dan mapper dokumen | 6–7 |
| Kontrak 5 MB, konfigurasi backend default 8 MB | Pilih satu batas; samakan UI, server, kontrak | 7–9 |
| Pendaftaran offline belum punya endpoint khusus | Tambahkan endpoint admin dan schema request yang sesuai kebutuhan offline | 6 |
| Download/verifikasi dokumen belum lengkap | Tambahkan API, izin, dan bentuk respons | 7 |
| Daftar artikel admin dan detail slug belum lengkap | Tambahkan aturan daftar draft dan detail publik | 4 |
| Filter kelengkapan dokumen belum ada di API daftar | Filter server harus berlaku pada keseluruhan hasil, bukan satu halaman saja | 6–7 |
| Edit identitas lebih luas daripada field PATCH saat ini | Lengkapi allowlist field dan validasi; jangan menerima semua kolom database | 6 |
| Kepala sekolah kosong perlu diizinkan | Sesuaikan contains/minContains, tetap maksimum satu | 3 |
| Mode PPDB ditutup harus berlaku di server | Sepakati apakah input offline admin memiliki aturan berbeda | 5–6–9 |

Usulan endpoint tambahan berikut belum tersedia. Seluruhnya menggunakan prefix
`/api/v1` dan ditulis ke kontrak sebelum implementasi:

```text
POST  /applications/offline
GET   /applications/{applicationId}/documents
GET   /applications/{applicationId}/documents/{documentId}/download
PATCH /applications/{applicationId}/documents/{documentId}
GET   /dashboard/summary
```

PATCH data/status pendaftar tetap memiliki satu handler milik anggota 6. Handler
tersebut menggunakan aturan status anggota 5. Tidak perlu membuat handler duplikat
untuk menu Pendaftar dan Data siswa.

API daftar sebaiknya memiliki pagination dan respons yang disepakati. Bentuk
database boleh berbeda dengan UI; mapper menerjemahkan tanggal, ID, dan enum.
Gunakan tanggal lahir sebagai tanggal kalender, bukan waktu yang bergeser zona.

## Urutan pengerjaan dan belajar

### Tahap 1 — Setup dan pemahaman bersama

Semua anggota belajar menjalankan frontend, mencari komponen menunya, serta memakai
Git dasar. Anggota 10 menyiapkan database; anggota 9 memverifikasi login. Pemilik
fitur menyepakati kontrak dan membaca tipe data yang akan digunakan.

Untuk frontend dari root project:

```bash
npm install
npm run dev
```

Website: `http://localhost:3000`. Admin: `http://localhost:3000/admin`.

Langkah backend mengikuti panduan setup setelah koreksi koneksi lokal selesai dan
teruji. Jangan menganggap perintah migration berhasil hanya karena file SQL ada.
Jangan membagikan `.env` atau password lewat repository.

### Tahap 2 — Satu contoh lengkap bersama

Kerjakan contoh sederhana, misalnya satu guru: tabel → API → halaman Struktur.
Tujuannya agar anggota memahami request, respons, validasi, dan penyimpanan.
Anggota pemula kemudian mengerjakan fungsi kecil dengan pendampingan/review.

### Tahap 3 — Fungsi pertama per anggota

| Anggota | Hasil pertama |
| --- | --- |
| 1 | Konten profil rapi dan daftar informasi yang mengikuti Pengaturan |
| 2 | Daftar agenda dari database |
| 3 | Satu guru dari database tampil di website |
| 4 | Daftar artikel terbit dari database |
| 5 | Pendaftaran publik tersimpan dan mendapat nomor server |
| 6 | Daftar/detail pendaftar dari API |
| 7 | Satu dokumen fiktif tersimpan melalui request admin |
| 8 | Pesan Kontak masuk ke admin |
| 9 | Login/session/logout teruji dengan database |
| 10 | Setup berhasil di komputer lain |

### Tahap 4 — Lengkapi alur, integrasi, dan demonstrasi

Lanjutkan edit, filter, status, upload/download, serta penanganan error setelah fungsi
pertama berhasil. Lakukan demonstrasi singkat secara rutin. Newsletter dan upload
foto publik tidak mendahului alur utama pendaftaran/admin yang belum selesai.

Sebelum deploy ke VPS, lakukan tahap khusus pengujian container, HTTPS, session,
izin, backup/restore, dan data yang akan ditampilkan. Selesainya satu menu tidak
berarti seluruh aplikasi siap production.

## Alur Git dan kriteria selesai

### Alur kerja

1. Gunakan satu repository untuk frontend/backend/kontrak.
2. Buat satu tugas kecil, lalu branch per tugas; contoh `feature/blog-list-api`.
3. Implementasikan, uji, dan catat perubahan kontrak bila ada.
4. Ajukan pull request dengan tujuan, file penting, cara mencoba, dan batas validasi.
5. Reviewer memeriksa; koordinator membantu penggabungan file bersama.
6. Ambil perubahan terbaru sebelum memulai tugas berikutnya.

Perubahan migration digabung berurutan dari schema terbaru. Jangan membuat banyak
initial migration secara terpisah, menghapus riwayat migration yang telah dipakai,
atau menyelesaikan konflik lockfile dengan membuang perubahan anggota lain.

### Template tugas

```text
Judul: Menampilkan artikel terbit dari database
Pemilik: Anggota 4
Menu: Blog
File frontend: frontend/app/components/PublicBlog.tsx
File backend: backend/src/modules/posts/
Ketergantungan: koneksi database dan kontrak respons artikel
Hasil: halaman Blog membaca artikel terbit dari API
Pengujian: ada artikel, tidak ada artikel, API gagal, draft tidak terbuka
Status: Belum mulai / Dikerjakan / Direview / Selesai
```

### Kriteria selesai setiap fitur

- [ ] Data tersimpan di database dan tersedia setelah dibuka ulang dari browser lain.
- [ ] Pesan sukses muncul setelah server benar-benar berhasil.
- [ ] Loading, data kosong, input salah, dan request gagal ditangani.
- [ ] Hak akses diperiksa backend; data pribadi tidak terbuka melalui endpoint publik.
- [ ] UI diperiksa di mobile dan desktop, termasuk form/panel panjang.
- [ ] Pengujian relevan dilakukan; tidak mengklaim alur lengkap hanya dari health endpoint.
- [ ] Kontrak dan panduan penggunaan yang terpengaruh diperbarui.
- [ ] Tidak ada data pribadi nyata, password, atau file rahasia pada commit/artifact.
- [ ] Pemilik dapat mendemonstrasikan dan menjelaskan kode bagiannya.

Pemeriksaan workspace yang tersedia:

```bash
npm run check
npm run build --workspace=@nurul-huda/backend
```

Saat panduan dibuat, `npm run check` menjalankan lint/typecheck/test kedua workspace;
test frontend juga membangun frontend. Perintah build backend di atas memeriksa
hasil kompilasi backend secara terpisah. Test baru per fitur harus benar-benar
menguji perilaku penting, bukan hanya keberadaan file.

### Referensi project

- [README utama](../README.md)
- [Panduan instalasi](../PANDUAN-INSTALASI.md)
- [Struktur frontend saat ini](FRONTEND_STRUCTURE.md)
- [Panduan backend](../backend/README.md)
- [Kontrak integrasi](../contracts/README.md)
- [OpenAPI](../contracts/openapi.yaml)

Panduan struktur frontend lama masih berfokus pada mockup `lib/cms/`. Saat integrasi
diterapkan, perbarui panduan tersebut agar membedakan mockup dan pemanggilan API.
Status checklist dalam dokumen ini dimulai belum selesai; isi berdasarkan bukti
pekerjaan tim, bukan berdasarkan folder yang sudah dibuat saja.
