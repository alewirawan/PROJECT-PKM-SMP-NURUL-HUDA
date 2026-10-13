import { Building2, FileCheck2, FileClock, FileX2, Globe2 } from "lucide-react";
import type {
  ApplicationStatus,
  RegistrationSource,
  StudentDocument,
} from "../../lib/local-cms";

export const statusOptions: ApplicationStatus[] = [
  "Verifikasi",
  "Terverifikasi",
  "Wawancara",
  "Diterima",
  "Ditolak",
];

export const emptyOfflineForm = {
  studentName: "",
  nisn: "",
  originSchool: "",
  birthPlace: "",
  birthDate: "",
  gender: "Laki-laki" as "Laki-laki" | "Perempuan",
  address: "",
  parentName: "",
  parentOccupation: "",
  phone: "",
  email: "",
  program: "",
  extracurricular: "Belum menentukan",
  notes: "",
  status: "Verifikasi" as ApplicationStatus,
};

export function studentInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function completedDocuments(documents: StudentDocument[] = []) {
  return documents.filter((document) => document.status !== "Belum ada").length;
}

export function formatDate(value?: string) {
  if (!value) return "Belum dicatat";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function SourceBadge({ source }: { source?: RegistrationSource }) {
  const normalized = source ?? "Website";
  return (
    <span className={`student-source source-${normalized.toLowerCase()}`}>
      {normalized === "Website" ? (
        <Globe2 size={13} />
      ) : (
        <Building2 size={13} />
      )}
      {normalized}
    </span>
  );
}

export function DocumentIcon({
  status,
}: {
  status: StudentDocument["status"];
}) {
  if (status === "Terverifikasi") return <FileCheck2 size={18} />;
  if (status === "Diunggah" || status === "Menunggu pemeriksaan")
    return <FileClock size={18} />;
  return <FileX2 size={18} />;
}

export type OfflineStudentFormValue = typeof emptyOfflineForm;
