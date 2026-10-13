import { KEYS, readJson, writeJson } from "./storage";
import {
  createStudentDocuments,
  normalizeDocuments,
} from "./student-documents";
import type { Application } from "./types";

export const seedApplications: Application[] = [
  {
    id: "NH-2026-10421",
    studentName: "Nayara Putri",
    nisn: "0098765432",
    originSchool: "SD Harapan 2",
    birthPlace: "Bandung",
    birthDate: "2013-04-17",
    gender: "Perempuan",
    address: "Kec. Cibiru, Kota Bandung",
    parentName: "Budi Pratama",
    parentOccupation: "Wiraswasta",
    phone: "0812 0000 1042",
    email: "wali.nayara@example.test",
    program: "",
    extracurricular: "Pramuka",
    status: "Terverifikasi",
    registrationSource: "Website",
    submittedAt: "2026-09-18T07:42:00.000Z",
    notes: "Berkas utama sudah diperiksa oleh panitia.",
    documents: createStudentDocuments(
      "Website",
      ["kk", "akta", "ijazah", "ktp"],
      ["kip"],
    ),
  },
  {
    id: "NH-2026-10420",
    studentName: "Raka Bimantara",
    nisn: "0087654321",
    originSchool: "SD Tunas Bangsa",
    birthPlace: "Sumedang",
    birthDate: "2013-08-02",
    gender: "Laki-laki",
    address: "Kec. Arcamanik, Kota Bandung",
    parentName: "Maya Kartika",
    parentOccupation: "Guru",
    phone: "0812 0000 1041",
    email: "wali.raka@example.test",
    program: "",
    extracurricular: "PMR",
    status: "Verifikasi",
    registrationSource: "Website",
    submittedAt: "2026-09-18T06:16:00.000Z",
    notes: "Menunggu verifikasi ijazah / SKL.",
    documents: createStudentDocuments("Website", ["kk", "akta"], ["ktp"]),
  },
  {
    id: "NH-2026-10419",
    studentName: "Keisha Amalia",
    nisn: "0076543210",
    originSchool: "MI Cahaya Ilmu",
    birthPlace: "Bandung",
    birthDate: "2013-01-29",
    gender: "Perempuan",
    address: "Kec. Ujungberung, Kota Bandung",
    parentName: "Ridwan Hakim",
    parentOccupation: "Karyawan swasta",
    phone: "0812 0000 1040",
    email: "wali.keisha@example.test",
    program: "",
    extracurricular: "Seni Tari",
    status: "Wawancara",
    registrationSource: "Offline",
    submittedAt: "2026-09-17T12:30:00.000Z",
    notes:
      "Form diterima melalui meja PPDB; jadwal wawancara sudah dikonfirmasi.",
    documents: createStudentDocuments(
      "Offline",
      ["kk", "akta", "ktp"],
      ["ijazah"],
    ),
  },
  {
    id: "NH-2026-10418",
    studentName: "Damar Aksara",
    nisn: "0065432109",
    originSchool: "SD Negeri 18",
    birthPlace: "Garut",
    birthDate: "2012-12-11",
    gender: "Laki-laki",
    address: "Kec. Antapani, Kota Bandung",
    parentName: "Sinta Maharani",
    parentOccupation: "Tenaga kesehatan",
    phone: "0812 0000 1039",
    email: "wali.damar@example.test",
    program: "",
    extracurricular: "Pramuka",
    status: "Diterima",
    registrationSource: "Offline",
    submittedAt: "2026-09-17T09:05:00.000Z",
    notes: "Daftar ulang menunggu jadwal resmi sekolah.",
    documents: createStudentDocuments("Offline", [
      "kk",
      "akta",
      "ijazah",
      "ktp",
    ]),
  },
];

function migrateApplicationBrand(item: Application): Application {
  const legacySchools: Record<string, string> = {
    "SMP Harapan 2": "SD Harapan 2",
    "SMP Tunas Bangsa": "SD Tunas Bangsa",
    "MTs Cahaya Ilmu": "MI Cahaya Ilmu",
    "SMP Negeri 18": "SD Negeri 18",
  };
  const id = item.id.replace(/^ARU-/, "NH-");
  const seed = seedApplications.find((candidate) => candidate.id === id);
  const source =
    item.registrationSource ?? seed?.registrationSource ?? "Website";
  return {
    ...seed,
    ...item,
    id,
    originSchool: legacySchools[item.originSchool] ?? item.originSchool,
    registrationSource: source,
    extracurricular: item.extracurricular ?? "Belum menentukan",
    documents: normalizeDocuments(
      item.documents ?? seed?.documents ?? createStudentDocuments(source),
    ),
  };
}

export function getApplications() {
  const stored = readJson<Application[] | null>(KEYS.applications, null);
  if (stored === null) return seedApplications;
  const migrated = stored.map(migrateApplicationBrand);
  return migrated.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function saveApplications(value: Application[]) {
  writeJson(KEYS.applications, value);
}
export function addApplication(value: Application) {
  saveApplications([value, ...getApplications()]);
}
