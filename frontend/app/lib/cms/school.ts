import {
  seedSchoolDirectory,
  type SchoolDirectory,
} from "../../school-directory-data";
import { KEYS, readJson, writeJson } from "./storage";
import type { SchoolSettings } from "./types";

export const defaultSettings: SchoolSettings = {
  schoolName: "SMP Nurul Huda",
  tagline: "Berani Belajar. Siap Berkarya.",
  email: "halo@nurulhuda.sch.id",
  ppdbEmail: "ppdb@nurulhuda.sch.id",
  phone: "(022) 1234 5678",
  whatsapp: "0812 3456 7890",
  address: "Jl. Cakrawala Pendidikan No. 17, Bandung, Jawa Barat 40123",
  academicYear: "2026/2027",
  registrationOpen: true,
};

export function getSchoolSettings() {
  const stored = readJson<SchoolSettings>(KEYS.settings, defaultSettings);
  return {
    ...stored,
    schoolName:
      stored.schoolName === "SMA Arunika Nusantara"
        ? defaultSettings.schoolName
        : stored.schoolName,
    email:
      stored.email === "hallo@arunika.sch.id"
        ? defaultSettings.email
        : stored.email,
    ppdbEmail:
      stored.ppdbEmail === "ppdb@arunika.sch.id"
        ? defaultSettings.ppdbEmail
        : stored.ppdbEmail,
  };
}
export function saveSchoolSettings(value: SchoolSettings) {
  writeJson(KEYS.settings, value);
}

export function getSchoolDirectory(): SchoolDirectory {
  const stored = readJson<SchoolDirectory | null>(KEYS.directory, null);
  if (stored === null) return seedSchoolDirectory;
  return {
    leaders: (stored.leaders ?? []).map((leader, index) => ({
      ...leader,
      portraitIndex: leader.portraitIndex ?? index % 8,
    })),
    teachers: (stored.teachers ?? []).map((teacher, index) => ({
      ...teacher,
      portraitIndex: teacher.portraitIndex ?? index % 8,
    })),
  };
}

export function saveSchoolDirectory(value: SchoolDirectory) {
  writeJson(KEYS.directory, value);
}
