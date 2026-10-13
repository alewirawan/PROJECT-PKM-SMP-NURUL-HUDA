export type Post = {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  excerpt: string;
  content: string[];
};

export const posts: Post[] = [
  {
    slug: "festival-inovasi-sains-2026",
    title: "Festival Inovasi Sains 2026: Ide Kecil, Dampak Besar",
    category: "Akademik",
    date: "12 September 2026",
    readTime: "4 menit",
    image: "/images/science.jpg",
    excerpt:
      "Lebih dari 40 proyek siswa dipamerkan, mulai dari penyaring air sederhana hingga sistem kebun pintar berbasis sensor.",
    content: [
      "Aula SMP Nurul Huda berubah menjadi ruang eksplorasi pada Festival Inovasi Sains 2026. Siswa kelas VII hingga IX mempresentasikan gagasan yang lahir dari masalah sederhana di sekitar mereka.",
      "Setiap tim mendapat pendampingan guru dan mentor alumni selama enam minggu. Mereka belajar menyusun hipotesis, menguji prototipe, mencatat kegagalan, lalu memperbaiki solusi berdasarkan data.",
      "Proyek kebun pintar karya tim kelas VIII terpilih sebagai karya favorit pengunjung. Sistem tersebut mengatur penyiraman berdasarkan kelembapan tanah dan berhasil mengurangi pemakaian air dalam simulasi sekolah.",
      "Bagi Nurul Huda, festival ini bukan sekadar kompetisi. Ini adalah ruang aman bagi siswa untuk bertanya, mencoba, gagal, dan kembali dengan rasa ingin tahu yang lebih besar.",
    ],
  },
  {
    slug: "kolaborasi-pelajar-asia",
    title: "Belajar Tanpa Batas melalui Kolaborasi Pelajar Asia",
    category: "Kegiatan",
    date: "5 September 2026",
    readTime: "3 menit",
    image: "/images/students.jpg",
    excerpt:
      "Program pertukaran virtual mempertemukan siswa Nurul Huda dengan pelajar dari tiga negara untuk membahas kota berkelanjutan.",
    content: [
      "Selama empat pekan, siswa Nurul Huda bekerja dalam kelompok lintas negara untuk merancang konsep kota yang lebih ramah manusia dan lingkungan.",
      "Diskusi berlangsung dalam bahasa Inggris, tetapi tujuan utamanya lebih luas: mendengar sudut pandang yang berbeda, membangun empati, dan belajar menyampaikan gagasan dengan jernih.",
      "Program ditutup dengan presentasi virtual yang dihadiri guru dan orang tua. Beberapa gagasan terbaik akan dikembangkan kembali dalam klub riset semester depan.",
    ],
  },
  {
    slug: "ruang-baca-baru",
    title: "Ruang Baca Baru, Ruang Tumbuh untuk Semua",
    category: "Fasilitas",
    date: "28 Agustus 2026",
    readTime: "3 menit",
    image: "/images/library.jpg",
    excerpt:
      "Perpustakaan Nurul Huda hadir dengan koleksi baru, area diskusi, dan sudut tenang yang dirancang bersama para siswa.",
    content: [
      "Perpustakaan bukan lagi sekadar tempat meminjam buku. Di ruang baru Nurul Huda, siswa dapat membaca dengan tenang, berdiskusi dalam kelompok kecil, atau mengembangkan proyek kreatif.",
      "Tim OSIS ikut terlibat sejak tahap perencanaan. Masukan mereka melahirkan sudut rekomendasi siswa, papan pertukaran buku, dan jadwal diskusi mingguan bersama guru.",
      "Koleksi digital juga dapat diakses dari rumah sehingga kebiasaan membaca tidak berhenti setelah bel pulang berbunyi.",
    ],
  },
  {
    slug: "beasiswa-nurul-huda-2027",
    title: "Program Beasiswa Nurul Huda 2027 Resmi Dibuka",
    category: "Pengumuman",
    date: "20 Agustus 2026",
    readTime: "2 menit",
    image: "/images/campus.jpg",
    excerpt:
      "Kesempatan bagi calon siswa berprestasi untuk bertumbuh bersama Nurul Huda melalui dukungan pendidikan hingga 100 persen.",
    content: [
      "SMP Nurul Huda membuka Program Beasiswa Nurul Huda 2027 untuk calon siswa dengan prestasi akademik maupun nonakademik yang kuat.",
      "Seleksi dilakukan melalui verifikasi dokumen, tes potensi akademik, serta wawancara calon siswa dan orang tua. Sekolah menilai bukan hanya hasil, tetapi juga semangat belajar dan kontribusi sosial.",
      "Pendaftaran beasiswa dilakukan bersamaan dengan PPDB reguler. Informasi persyaratan lengkap tersedia pada halaman pendaftaran.",
    ],
  },
];

export const programs = [
  {
    number: "01",
    title: "Sains & Teknologi",
    description:
      "Eksplorasi berbasis proyek melalui laboratorium, coding, robotika, dan riset terapan.",
    subjects: ["Riset ilmiah", "Coding", "Robotika"],
  },
  {
    number: "02",
    title: "Sosial & Humaniora",
    description:
      "Memahami manusia dan masyarakat melalui diskusi, observasi lapangan, serta karya berdampak.",
    subjects: ["Riset sosial", "Debat", "Kewirausahaan"],
  },
  {
    number: "03",
    title: "Seni & Kreativitas",
    description:
      "Ruang untuk menemukan suara personal lewat seni visual, musik, teater, dan media digital.",
    subjects: ["Desain", "Musik", "Media kreatif"],
  },
];
