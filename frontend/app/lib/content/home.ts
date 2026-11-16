import { title } from "process";

/**
 * Teks statis beranda (anggota 1). Jangan simpan berita, prestasi, atau
 * konfigurasi rahasia di sini: berita dari anggota 4, prestasi dari anggota 8,
 * identitas dari Pengaturan.
 *
 * Sumber: profil sekolah yang diberikan pihak sekolah. Bagian "programs" dan
 * "programSection" masih LOREM IPSUM (menunggu data program resmi).
 * Pernyataan peringkat ("ke-3") perlu diperiksa ulang oleh sekolah sebelum rilis.
 */
type HomeQuote = { text: string; author: string; role: string };

export const homeContent = {
  heroLead:
    "Sekolah swasta di Cisoka yang berdiri sejak 2008, bebas SPP bulanan, dan mengutamakan kedisiplinan serta akhlak siswa.",
  trust: { score: "Rp0", caption: "SPP bulanan sejak 2008" },
  badge: { value: "18", lines: ["Tahun melayani", "pendidikan sejak 2008"] },
  accreditation: { label: "Akreditasi Sekolah", value: "B" },
  stats: [
    { value: "18", lines: ["Tahun beroperasi", "(2008–2026)"] },
    { value: "Ke-3", lines: ["Sekolah swasta terbesar", "di Gugus 5"] },
    { value: "4.000 m²", lines: ["Lahan sekolah", "hasil wakaf pendiri"] },
    { value: "Rp0", lines: ["SPP bulanan", "sejak awal berdiri"] },
  ],
  intro:
    "Sekolah ini lahir dari wakaf dan kepedulian sosial, agar anak-anak di sekitar tetap dapat melanjutkan sekolah setelah SD.",
  experience:
    "Kedisiplinan, terutama kehadiran siswa, menjadi dasar agar materi pelajaran dapat dipahami dengan maksimal, didukung lahan dan gedung yang memadai.",
  features: [
    {
      number: "01",
      title: "Bebas SPP sejak awal",
      text: "Tidak ada uang gedung maupun SPP bulanan sejak 2008.",
    },
    {
      number: "02",
      title: "Fasilitas luas dan nyaman",
      text: "Lahan dan gedung memadai untuk kegiatan belajar mengajar.",
    },
    {
      number: "03",
      title: "Mengutamakan kedisiplinan",
      text: "Kehadiran siswa dijaga agar pelajaran dipahami maksimal.",
    },
  ],
  programSection: {
    kicker: "Program unggulan",
    headingLines: ["SMP Nurul Huda,", " berkomitmen untuk mencetak lulusan yang :"],
  },
  programs: [
    {
      number: "01",
      title: "Akademik dan Nonakademik",
      description:
        "Mengembangkan potensi peserta didik agar berprestasi dalam bidang akademik maupun nonakademik.",
      subjects: ["Akademik", "Olahraga", "Seni"],
    },
    {
      number: "02",
      title: "Daya Saing",
      description:
       "Mempersiapkan peserta didik agar memiliki kemampuan dan kesiapan untuk melanjutkan pendidikan ke jenjang berikutnya.",
      subjects: ["Kompetensi", "Kreativitas", "Prestasi"],
    },
    {
      number: "03",
      title: "IPTEK dan IMTAK",
      description:
        "Meningkatkan penguasaan ilmu pengetahuan dan teknologi yang diimbangi dengan keimanan dan ketakwaan.",
      subjects: ["Teknologi", "Pengetahuan", "Keagamaan"],
    },
    {
      number: "04",
      title: "Akhlak Mulia",
      description:
      "Membentuk peserta didik yang memiliki budi pekerti luhur dan menerapkan perilaku baik dalam kehidupan sehari-hari.",
      subjects: ["Sopan Santun", "Kedisiplinan", "Karakter"],
},
  ],
  quote: null as HomeQuote | null,
  cta: "Pendaftaran dibuka sepanjang tahun ajaran dan bebas SPP bulanan sejak sekolah berdiri.",
} as const;
