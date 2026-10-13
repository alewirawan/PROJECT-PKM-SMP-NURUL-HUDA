export type SchoolLeader = {
  id: string;
  name: string;
  role: string;
  initials: string;
  focus: string;
  tone: string;
  level: "principal" | "leadership" | "support";
  portraitIndex: number;
};

export type Teacher = {
  id: string;
  name: string;
  initials: string;
  subject: string;
  cluster: "Sains" | "Bahasa" | "Sosial" | "Kreatif & Karakter";
  years: number;
  note: string;
  tone: string;
  portraitIndex: number;
};

export type SchoolDirectory = {
  leaders: SchoolLeader[];
  teachers: Teacher[];
};

export const organizationLevels: SchoolLeader["level"][] = [
  "principal",
  "leadership",
  "support",
];

export function groupSchoolLeaders(leaders: SchoolLeader[]) {
  return organizationLevels
    .map((level) => ({
      level,
      people: leaders.filter((person) => person.level === level),
    }))
    .filter((group) => group.people.length > 0);
}

export function chunkDirectoryRows<T>(items: T[], requestedSize = 4) {
  const size = Math.max(1, Math.floor(requestedSize));
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size)
    rows.push(items.slice(index, index + size));
  return rows;
}

export function hasOtherPrincipal(leaders: SchoolLeader[], leaderId?: string) {
  return leaders.some(
    (person) => person.level === "principal" && person.id !== leaderId,
  );
}

export const principal: SchoolLeader = {
  id: "leader-principal",
  name: "Dr. Ayu Larasati, M.Pd.",
  role: "Kepala Sekolah",
  initials: "AL",
  focus: "Arah sekolah & budaya belajar",
  tone: "sun",
  level: "principal",
  portraitIndex: 0,
};

export const leadershipTeam: SchoolLeader[] = [
  {
    id: "leader-academic",
    name: "Fajar Ramadhan, M.Pd.",
    role: "Wakil Kepala Akademik",
    initials: "FR",
    focus: "Kurikulum & mutu belajar",
    tone: "sage",
    level: "leadership",
    portraitIndex: 1,
  },
  {
    id: "leader-student",
    name: "Nadia Prameswari, S.Psi.",
    role: "Wakil Kepala Kesiswaan",
    initials: "NP",
    focus: "Pendampingan & karakter",
    tone: "clay",
    level: "leadership",
    portraitIndex: 2,
  },
  {
    id: "leader-facility",
    name: "Rizky Adinata, S.Kom.",
    role: "Wakil Kepala Sarana",
    initials: "RA",
    focus: "Ruang belajar & teknologi",
    tone: "sky",
    level: "leadership",
    portraitIndex: 3,
  },
];

export const supportTeam: SchoolLeader[] = [
  {
    id: "leader-admin",
    name: "Dewi Anggraini",
    role: "Koordinator Tata Usaha",
    initials: "DA",
    focus: "Administrasi sekolah",
    tone: "sand",
    level: "support",
    portraitIndex: 4,
  },
  {
    id: "leader-counseling",
    name: "Rendra Maulana",
    role: "Koordinator BK",
    initials: "RM",
    focus: "Konseling & kesejahteraan",
    tone: "moss",
    level: "support",
    portraitIndex: 5,
  },
  {
    id: "leader-library",
    name: "Siti Rahmawati",
    role: "Koordinator Perpustakaan",
    initials: "SR",
    focus: "Literasi & sumber belajar",
    tone: "rose",
    level: "support",
    portraitIndex: 6,
  },
  {
    id: "leader-lab",
    name: "Bagas Pratama",
    role: "Koordinator Laboratorium",
    initials: "BP",
    focus: "Eksperimen & keselamatan",
    tone: "ocean",
    level: "support",
    portraitIndex: 7,
  },
];

export const teachers: Teacher[] = [
  {
    id: "teacher-math",
    name: "Laras Widyaningrum, S.Pd.",
    initials: "LW",
    subject: "Matematika",
    cluster: "Sains",
    years: 9,
    note: "Membuat angka terasa dekat lewat masalah sehari-hari.",
    tone: "sun",
    portraitIndex: 0,
  },
  {
    id: "teacher-science",
    name: "Aditiya Naufal, S.Pd.",
    initials: "AN",
    subject: "IPA Terpadu",
    cluster: "Sains",
    years: 7,
    note: "Mengajak siswa menguji rasa ingin tahu di laboratorium.",
    tone: "ocean",
    portraitIndex: 1,
  },
  {
    id: "teacher-indonesian",
    name: "Ratna Kusumadewi, M.Hum.",
    initials: "RK",
    subject: "Bahasa Indonesia",
    cluster: "Bahasa",
    years: 12,
    note: "Mendampingi siswa menemukan suara melalui tulisan.",
    tone: "clay",
    portraitIndex: 2,
  },
  {
    id: "teacher-english",
    name: "Galang Wicaksana, S.Pd.",
    initials: "GW",
    subject: "Bahasa Inggris",
    cluster: "Bahasa",
    years: 6,
    note: "Membangun percaya diri lewat percakapan dan proyek.",
    tone: "sky",
    portraitIndex: 3,
  },
  {
    id: "teacher-social",
    name: "Mira Septiani, S.Pd.",
    initials: "MS",
    subject: "Ilmu Pengetahuan Sosial",
    cluster: "Sosial",
    years: 10,
    note: "Menghubungkan sejarah, kota, dan pilihan manusia.",
    tone: "moss",
    portraitIndex: 4,
  },
  {
    id: "teacher-religion",
    name: "Yusuf Hidayat, S.Ag.",
    initials: "YH",
    subject: "Pendidikan Agama",
    cluster: "Kreatif & Karakter",
    years: 11,
    note: "Menumbuhkan refleksi, empati, dan kebiasaan baik.",
    tone: "sand",
    portraitIndex: 5,
  },
  {
    id: "teacher-art",
    name: "Citra Maharani, S.Sn.",
    initials: "CM",
    subject: "Seni & Budaya",
    cluster: "Kreatif & Karakter",
    years: 5,
    note: "Membuka ruang aman untuk bereksperimen dan berkarya.",
    tone: "rose",
    portraitIndex: 6,
  },
  {
    id: "teacher-it",
    name: "Dimas Aryaputra, S.Kom.",
    initials: "DA",
    subject: "Informatika",
    cluster: "Sains",
    years: 4,
    note: "Mengajarkan teknologi sebagai alat untuk memecahkan masalah.",
    tone: "sage",
    portraitIndex: 7,
  },
];

export const seedSchoolDirectory: SchoolDirectory = {
  leaders: [principal, ...leadershipTeam, ...supportTeam],
  teachers,
};
