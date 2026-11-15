import { ApiError, requestApi } from "../api-client";
import type {
  Application,
  ApplicationStatus,
  RegistrationSource,
  StudentDocument,
} from "../cms/types";
import type { RegistrationValues } from "../../components/registration/StudentFields";

type ApiApplicationDocument = {
  id: string;
  kind: StudentDocument["key"];
  label: string;
  status: Exclude<StudentDocument["status"], "Diunggah">;
  hasFile: boolean;
  receivedPhysically: boolean;
  fileName?: string;
  mimeType?: string;
  size?: number;
  reviewNote?: string;
};

type ApiApplication = {
  studentName: string;
  nisn: string;
  originSchool: string;
  birthPlace: string;
  birthDate: string;
  gender: "Laki-laki" | "Perempuan";
  address: string;
  parentName: string;
  parentOccupation?: string;
  phone: string;
  email: string;
  id: string;
  source: RegistrationSource;
  status: ApplicationStatus;
  reEnrollmentStatus: "pending" | "completed" | null;
  submittedAt: string;
  notes?: string;
  documents: ApiApplicationDocument[];
  extracurriculars: string[];
};

type ApiApplicationPage = {
  items: ApiApplication[];
  nextCursor: string | null;
};

function fromApi(application: ApiApplication): Application {
  return {
    id: application.id,
    studentName: application.studentName,
    nisn: application.nisn,
    originSchool: application.originSchool,
    birthPlace: application.birthPlace,
    birthDate: application.birthDate,
    gender: application.gender,
    address: application.address,
    parentName: application.parentName,
    parentOccupation: application.parentOccupation,
    phone: application.phone,
    email: application.email,
    program: "",
    extracurricular:
      application.extracurriculars.join(", ") || "Belum menentukan",
    status: application.status,
    reEnrollmentStatus: application.reEnrollmentStatus,
    submittedAt: application.submittedAt,
    registrationSource: application.source,
    notes: application.notes,
    documents: application.documents.map((document) => ({
      key: document.kind,
      label: document.label,
      status: document.status,
      receivedPhysically: document.receivedPhysically,
      ...(document.hasFile && document.fileName
        ? { fileName: document.fileName }
        : {}),
      ...(document.mimeType ? { mimeType: document.mimeType } : {}),
      ...(document.size !== undefined ? { size: document.size } : {}),
      ...(document.reviewNote ? { reviewNote: document.reviewNote } : {}),
    })),
  };
}

export async function listApplications(): Promise<Application[]> {
  const applications: Application[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  do {
    const query = new URLSearchParams({ limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const page = await requestApi<ApiApplicationPage>(
      `/applications?${query.toString()}`,
    );
    if (
      !page ||
      !Array.isArray(page.items) ||
      !(page.nextCursor === null || typeof page.nextCursor === "string")
    ) {
      throw new ApiError(502, "Backend mengembalikan daftar pendaftar yang tidak valid.");
    }

    applications.push(...page.items.map(fromApi));
    cursor = page.nextCursor;
    if (cursor && seenCursors.has(cursor)) {
      throw new ApiError(502, "Backend mengembalikan cursor pendaftar berulang.");
    }
    if (cursor) seenCursors.add(cursor);
  } while (cursor);

  return applications;
}

export async function acceptApplication(
  registrationNumber: string,
): Promise<void> {
  await requestApi(
    `/applications/${encodeURIComponent(registrationNumber)}/accept`,
    { method: "POST" },
  );
}

export type CompleteReEnrollmentResponse = {
  student: {
    id: string;
    studentName: string;
    status: "active";
    officiallyRegisteredAt: string;
  };
  reEnrollment: {
    status: "completed";
    confirmedAt: string;
  };
};

export type PublicApplicationReceipt = {
  id: string;
  status: "Verifikasi";
  submittedAt: string;
};

type PublicApplicationData = Omit<RegistrationValues, "extracurricular"> & {
  extracurriculars: string[];
};

type PublicApplicationFiles = Partial<
  Record<Exclude<StudentDocument["key"], "photo">, File>
>;

export async function submitPublicApplication(
  data: PublicApplicationData,
  files: PublicApplicationFiles,
  key: string,
): Promise<PublicApplicationReceipt> {
  const body = new FormData();
  body.append(
    "data",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
    "data.json",
  );
  for (const [kind, file] of Object.entries(files)) {
    if (file) body.append(kind, file, file.name);
  }
  const receipt = await requestApi<unknown>("/applications", {
    method: "POST",
    headers: { "Idempotency-Key": key },
    body,
  });
  if (
    !receipt ||
    typeof receipt !== "object" ||
    !("id" in receipt) ||
    typeof receipt.id !== "string" ||
    !/^NH-[A-Z0-9-]+$/.test(receipt.id) ||
    !("status" in receipt) ||
    receipt.status !== "Verifikasi" ||
    !("submittedAt" in receipt) ||
    typeof receipt.submittedAt !== "string" ||
    !Number.isFinite(Date.parse(receipt.submittedAt))
  ) {
    throw new ApiError(
      502,
      "Backend mengembalikan tanda terima pendaftaran yang tidak valid.",
    );
  }
  return {
    id: receipt.id,
    status: "Verifikasi",
    submittedAt: receipt.submittedAt,
  };
}

export async function completeReEnrollment(
  registrationNumber: string,
): Promise<CompleteReEnrollmentResponse> {
  return requestApi<CompleteReEnrollmentResponse>(
    `/applications/${encodeURIComponent(registrationNumber)}/complete-re-enrollment`,
    { method: "POST" },
  );
}
