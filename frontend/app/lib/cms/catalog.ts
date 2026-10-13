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
    id: "science-demo",
    title: "Ide kecil, perubahan besar",
    award: "Juara 1 Inovasi Sains",
    level: "Kota",
    year: "2026",
    category: "Akademik",
    description:
      "Contoh karya tim siswa: penyaring air sederhana dari bahan yang mudah ditemukan. Sebuah cerita tentang rasa ingin tahu dan kerja bersama.",
    image: "/images/science.jpg",
    published: true,
  },
  {
    id: "arts-demo",
    title: "Berani tampil, merawat tradisi",
    award: "Juara 2 Festival Seni Pelajar",
    level: "Kabupaten",
    year: "2026",
    category: "Seni",
    description:
      "Contoh pencapaian kelompok seni sekolah melalui latihan, kekompakan, dan kecintaan terhadap budaya.",
    image: "/images/students.jpg",
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
