import type { Database } from "./client.js";
import {
  admissionPeriods,
  schoolSettings,
  clubs,
  agenda,
  teachers,
  schoolLeaders,
  posts,
  achievements,
} from "./schema/index.js";

export async function seedDemo(db: Database) {
  await db.transaction(async (tx) => {
    await tx
      .insert(admissionPeriods)
      .values({ academicYear: "2026/2027" })
      .onConflictDoNothing();
    await tx
      .insert(schoolSettings)
      .values({
        schoolName: "SMP Nurul Huda",
        tagline: "Belajar, tumbuh, dan berkarya.",
        email: "sekolah@example.test",
        ppdbEmail: "ppdb@example.test",
        phone: "0800000000",
        whatsapp: "0800000000",
        address: "Alamat contoh sekolah untuk pengujian lokal.",
        academicYear: "2026/2027",
        registrationOpen: false,
        documentRequirements: {
          requiredKinds: [],
          requireOneGraduationDocument: false,
        },
      })
      .onConflictDoNothing();
    await tx
      .insert(clubs)
      .values([
        {
          id: "demo-pramuka",
          name: "Pramuka",
          description: "Contoh kegiatan kepemimpinan dan kemandirian.",
          active: true,
        },
        {
          id: "demo-futsal",
          name: "Futsal",
          description: "Contoh kegiatan olahraga dan kerja sama.",
          active: true,
        },
      ])
      .onConflictDoNothing();
    await tx
      .insert(agenda)
      .values([
        {
          id: "demo-open-house",
          title: "Contoh open house sekolah",
          date: "2026-11-15",
          time: "08:00",
          location: "Aula contoh",
          type: "Kegiatan",
          completed: false,
          visibility: "Publik",
        },
        {
          id: "demo-rapat",
          title: "Contoh rapat internal",
          date: "2026-11-14",
          time: "09:00",
          location: "Ruang rapat contoh",
          type: "Rapat",
          completed: false,
          visibility: "Internal",
        },
      ])
      .onConflictDoNothing();
    await tx
      .insert(teachers)
      .values({
        id: "demo-guru",
        name: "Guru Contoh",
        initials: "GC",
        subject: "Matematika",
        cluster: "Sains",
        years: 5,
        note: "Profil contoh untuk pengujian tampilan.",
        tone: "sage",
        portraitIndex: 0,
      })
      .onConflictDoNothing();
    await tx
      .insert(schoolLeaders)
      .values({
        id: "demo-koordinator",
        name: "Koordinator Contoh",
        role: "Koordinator akademik",
        initials: "KC",
        focus: "Contoh pengelolaan kegiatan belajar.",
        tone: "sage",
        level: "support",
        portraitIndex: 1,
      })
      .onConflictDoNothing();
    await tx
      .insert(posts)
      .values({
        id: "11111111-1111-4111-8111-111111111111",
        title: "Contoh kegiatan sekolah",
        slug: "contoh-kegiatan-sekolah",
        category: "Kegiatan",
        image: "/images/students.jpg",
        excerpt:
          "Artikel contoh untuk memeriksa tampilan blog dan alur publikasi.",
        content: [
          "Konten ini merupakan contoh untuk pengujian lokal, bukan berita kegiatan sekolah yang sebenarnya.",
        ],
        author: "Admin Contoh",
        status: "Draft",
      })
      .onConflictDoNothing();
    await tx
      .insert(achievements)
      .values({
        id: "22222222-2222-4222-8222-222222222222",
        title: "Contoh prestasi siswa",
        award: "Penghargaan contoh",
        level: "Sekolah",
        year: "2026",
        category: "Akademik",
        description: "Data contoh untuk menguji pengelolaan prestasi.",
        image: "/images/science.jpg",
        published: false,
      })
      .onConflictDoNothing();
  });
}
