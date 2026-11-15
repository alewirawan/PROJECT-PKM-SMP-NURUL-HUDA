import { ConflictError } from "../../shared/errors/app-error.js";
import { parseInput } from "../../shared/http/parse-input.js";
import type { DocumentRequirements } from "../../db/schema/common.js";
import type {
  ApplicationApiDocument,
  ApplicationApiPage,
  ApplicationApiRecord,
  ApplicationApiSource,
  ApplicationApiStatus,
} from "./application.schema.js";
import { applicationListQuery } from "./application.schema.js";
import type {
  ApplicationListRecord,
  ApplicationsRepository,
} from "./application.repository.js";

type ApplicationRow = ApplicationListRecord;

type CurrentApplicationRow = ApplicationRow & {
  nisn: string;
  birthPlace: string;
  birthDate: Date;
  gender: "Laki-laki" | "Perempuan";
  address: string;
  parentName: string;
  phone: string;
  email: string;
  documentRequirements: DocumentRequirements;
};

const statusToApi: Record<
  ApplicationRow["status"],
  ApplicationApiStatus
> = {
  verification: "Verifikasi",
  verified: "Terverifikasi",
  interview: "Wawancara",
  accepted: "Diterima",
  rejected: "Ditolak",
};

const sourceToApi: Record<ApplicationRow["source"], ApplicationApiSource> = {
  website: "Website",
  offline: "Offline",
};

const documentStatusToApi: Record<
  ApplicationRow["documents"][number]["status"],
  ApplicationApiDocument["status"]
> = {
  missing: "Belum ada",
  pending: "Menunggu pemeriksaan",
  verified: "Terverifikasi",
  needs_correction: "Perlu perbaikan",
};

const documentLabels = {
  skl: "SKL",
  ijazah: "Ijazah",
  kk: "Kartu Keluarga",
  ktp: "KTP orang tua/wali",
  kip: "PIP / KIP",
  akta: "Akta Kelahiran",
  photo: "Foto",
} satisfies Record<ApplicationApiDocument["kind"], string>;

function assertCurrentApplication(
  row: ApplicationRow,
): asserts row is CurrentApplicationRow {
  if (
    row.schemaVersion !== 2 ||
    row.nisn === null ||
    row.birthPlace === null ||
    row.birthDate === null ||
    (row.gender !== "Laki-laki" && row.gender !== "Perempuan") ||
    row.address === null ||
    row.parentName === null ||
    row.phone === null ||
    row.email === null ||
    row.documentRequirements === null
  ) {
    throw new ConflictError(
      "Data pendaftar versi lama perlu diverifikasi sebelum dapat ditampilkan melalui API.",
    );
  }
}

function isSupportedMimeType(
  value: string,
): value is NonNullable<ApplicationApiDocument["mimeType"]> {
  return (
    value === "application/pdf" ||
    value === "image/jpeg" ||
    value === "image/png"
  );
}

type ApplicationDocumentFile = NonNullable<
  ApplicationRow["documents"][number]["currentVersion"]
>;

function mapFile(file: ApplicationDocumentFile) {
  if (
    !isSupportedMimeType(file.mimeType) ||
    file.fileSize < 1 ||
    file.fileSize > 5_242_880 ||
    !file.originalName.trim()
  ) {
    throw new ConflictError(
      "Metadata berkas pendaftar lama perlu diverifikasi sebelum dapat ditampilkan melalui API.",
    );
  }
  return {
    fileName: file.originalName,
    mimeType: file.mimeType,
    size: file.fileSize,
    uploadedAt: file.uploadedAt.toISOString(),
  };
}

function mapDocument(
  slot: ApplicationRow["documents"][number],
): ApplicationApiDocument {
  const file = slot.currentVersion;
  return {
    id: slot.id,
    kind: slot.kind,
    label: documentLabels[slot.kind],
    status: documentStatusToApi[slot.status],
    hasFile: Boolean(file),
    receivedPhysically: slot.receivedPhysically,
    ...(file ? mapFile(file) : {}),
    ...(slot.reviewNote ? { reviewNote: slot.reviewNote } : {}),
    reviewedAt: slot.reviewedAt?.toISOString() ?? null,
  };
}

function mapApplication(row: ApplicationRow): ApplicationApiRecord {
  assertCurrentApplication(row);
  return {
    studentName: row.studentName,
    nisn: row.nisn,
    originSchool: row.originSchool,
    birthPlace: row.birthPlace,
    birthDate: row.birthDate.toISOString().slice(0, 10),
    gender: row.gender,
    address: row.address,
    parentName: row.parentName,
    ...(row.parentOccupation
      ? { parentOccupation: row.parentOccupation }
      : {}),
    phone: row.phone,
    email: row.email,
    id: row.registrationNumber,
    source: sourceToApi[row.source],
    status: statusToApi[row.status],
    reEnrollmentStatus: row.reEnrollmentStatus,
    submittedAt: row.submittedAt.toISOString(),
    ...(row.notes === null ? {} : { notes: row.notes }),
    documents: row.documents.map(mapDocument),
    extracurriculars: row.extracurriculars,
    documentRequirements: row.documentRequirements,
  };
}

export function createApplicationsService(repository: ApplicationsRepository) {
  return {
    async list(input: unknown): Promise<ApplicationApiPage> {
      const query = parseInput(applicationListQuery, input);
      const page = await repository.list(query);
      return {
        items: page.items.map(mapApplication),
        nextCursor: page.nextCursor,
      };
    },
  };
}
