import { KEYS, readJson, writeJson } from "./storage";

export type Achievement = {
  id: string;
  title: string;
  award: string;
  level: string;
  year: string;
  category: string;
  description: string;
  image: string;
  published: boolean;
};
export type Club = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};
export const seedAchievements: Achievement[] = [
  {
    id: "paskibra-1",
    title: "LKBB JAWARA",
    award: "Juara  Paskibra",
    level: "Antar Sekiolah",
    year: "2026",
    category: "Olahraga",
    description:
      "Tim Paskibra SMP Nurul Huda tampil percaya diri dalamlomba kreasi baris-berbaaris, Lewat latihan rutin,kekompakan dan kedisiplin,para siswa membawa pulang hasil terbaik untuk sekolah",
    image: "/images/paskibra1.jpg",
    published: true,
  },
  {
    id: "paskibra-2",
    title: "Kebanggan dari Barisan",
    award: "Juara  Paskibra",
    level: "Kecamatan",
    year: "2024",
    category: "Olahraga",
    description:
      "Piala-piala ini hasil kerja keras tim Paskibra,mulai dari latihan panjang sampai tampil di depan juri,semangat pantang menyerah dan kebersamaan menjadi kunci keberhasilan mereka",
    image: "/images/paskibra2.jpg",
    published: true,
  },
  {
    id: "literacy-demo",
    title: "Dari ruang baca ke panggung cerita",
    award: "Finalis Lomba Literasi",
    level: "Provinsi",
    year: "2025",
    category: "Literasi",
    description:
      "Contoh perjalanan siswa mengembangkan tulisan dan berbagi gagasan melalui kegiatan literasi.",
    image: "/images/library.jpg",
    published: true,
  },
];
export const seedClubs: Club[] = [
  ["pramuka", "Pramuka", "Kemandirian, kepemimpinan, dan kepedulian."],
  ["futsal", "Futsal", "Sportivitas dan kerja sama di lapangan."],
  ["pmr", "PMR", "Belajar peduli dan keterampilan pertolongan pertama."],
  ["seni", "Seni Tari", "Ekspresi dan apresiasi budaya."],
  ["hadrah", "Hadrah", "Kekompakan melalui seni musik Islami."],
].map(([id, name, description]) => ({ id, name, description, active: true }));
export const getAchievements = () =>
  readJson<Achievement[]>(KEYS.achievements, seedAchievements);
export const saveAchievements = (items: Achievement[]) =>
  writeJson(KEYS.achievements, items);
export const getClubs = () => readJson<Club[]>(KEYS.clubs, seedClubs);
export const saveClubs = (items: Club[]) => writeJson(KEYS.clubs, items);
