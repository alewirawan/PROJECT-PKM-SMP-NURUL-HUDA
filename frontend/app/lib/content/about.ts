/**
 * Narasi profil sekolah untuk /tentang (anggota 1). Tidak memerlukan backend.
 * Sumber: profil, sejarah, dan brosur yang diberikan pihak sekolah. Sambutan
 * kepala sekolah belum diberikan, jadi masih LOREM IPSUM. Nama sekolah dinamis
 * diambil dari Pengaturan, bukan dari sini. Mohon disetujui sekolah sebelum rilis.
 */
export const aboutContent = {
  hero: {
    eyebrow: "Tentang Nurul Huda",
    title: "Sekolah yang percaya pada potensi setiap anak.",
    description:
      "Sekolah swasta di Cisoka yang berdiri dari wakaf dan kepedulian sosial, bebas SPP bulanan sejak 2008.",
  },
  story: {
    badge: "Sejak 2008",
    kicker: "Cerita kami",
    heading: "Berawal dari niat tulus untuk beramal.",
    paragraphs: [
      "digagas pada tahun 2006, dibangun pada 2006–2007, dan resmi menerima siswa pada 2008. Sekolah ini didirikan almarhum ketua yayasan pertama, seorang pedagang yang peduli pada anak-anak di sekitarnya yang putus sekolah setelah lulus SD karena biaya pendidikan yang masih mahal.",
      "Pendiri mewakafkan kebun pribadinya seluas 4.000 m² dan membangun gedung dengan dana pribadi, dibantu pemerintah berupa 3 ruang kelas tambahan. Sejak 2008 hingga kini, sekolah tidak pernah memungut SPP bulanan.",
    ],
  },
  vision:
    "Menghasilkan lulusan yang unggul dalam prestasi, cerdas dan berpikir, terampil dalam teknologi informasi, berakhlak mulia dan bertaqwa kepada Allah SWT.",
  mission: [
    "Mencerdaskan peserta didik yang beriman dan bertaqwa, cerdas dan berilmu pengetahuan yang luas serta berwawasan kebangsaan nasional.",
    "Mengembangkan jiwa kemandirian, menguasai ilmu pengetahuan dan teknologi, seni dan olahraga.",
  ],
  values: [
    {
      number: "01",
      title: "Berprestasi",
      text: "Unggul di bidang akademik maupun nonakademik.",
    },
    {
      number: "02",
      title: "Berdaya saing",
      text: "Siap melanjutkan ke jenjang pendidikan berikutnya.",
    },
    {
      number: "03",
      title: "IPTEK dan IMTAK",
      text: "Menguasai ilmu pengetahuan dan teknologi serta iman dan takwa.",
    },
    {
      number: "04",
      title: "Berakhlak baik",
      text: "Berbudi pekerti luhur dalam keseharian.",
    },
  ],
  principal: {
    quote:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
    name: "Fajar Anwar, S.S.",
  },
  cta: "Datang dan kenali sekolah kami. Pendaftaran dibuka sepanjang tahun ajaran.",
} as const;
