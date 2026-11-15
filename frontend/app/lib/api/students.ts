import { ApiError, requestApi } from "../api-client";

export type StudentStatus = "active" | "inactive";

export type StudentListItem = {
  id: string;
  studentName: string;
  status: StudentStatus;
  officiallyRegisteredAt: string;
};

export type StudentRecord = StudentListItem & {
  nisn: string | null;
  birthPlace: string | null;
  birthDate: string | null;
  gender: "Laki-laki" | "Perempuan" | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentPage = {
  items: StudentListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type StudentListQuery = {
  q?: string;
  status?: StudentStatus;
  page?: number;
  limit?: number;
};

function isStudentListItem(value: unknown): value is StudentListItem {
  if (!value || typeof value !== "object") return false;
  const student = value as Record<string, unknown>;
  return (
    typeof student.id === "string" &&
    typeof student.studentName === "string" &&
    (student.status === "active" || student.status === "inactive") &&
    typeof student.officiallyRegisteredAt === "string"
  );
}

function isStudentRecord(value: unknown): value is StudentRecord {
  if (!isStudentListItem(value)) return false;
  const student = value as Record<string, unknown>;
  return (
    [student.nisn, student.birthPlace, student.birthDate, student.address].every(
      (field) => field === null || typeof field === "string",
    ) &&
    (student.gender === null ||
      student.gender === "Laki-laki" ||
      student.gender === "Perempuan") &&
    typeof student.createdAt === "string" &&
    typeof student.updatedAt === "string"
  );
}

export async function listStudents(
  query: StudentListQuery = {},
): Promise<StudentPage> {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.status) params.set("status", query.status);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  const search = params.toString();
  const suffix = search ? `?${search}` : "";
  const page = await requestApi<StudentPage>(`/students/${suffix}`);

  const pagination = page?.pagination;
  if (
    !page ||
    !Array.isArray(page.items) ||
    !page.items.every(isStudentListItem) ||
    !pagination ||
    !Number.isInteger(pagination.page) ||
    pagination.page < 1 ||
    !Number.isInteger(pagination.limit) ||
    pagination.limit < 1 ||
    !Number.isInteger(pagination.total) ||
    pagination.total < 0 ||
    !Number.isInteger(pagination.totalPages) ||
    pagination.totalPages < 0
  ) {
    throw new ApiError(502, "Backend mengembalikan daftar siswa yang tidak valid.");
  }
  return page;
}

export async function getStudent(studentId: string): Promise<StudentRecord> {
  const student = await requestApi<unknown>(
    `/students/${encodeURIComponent(studentId)}`,
  );
  if (!isStudentRecord(student)) {
    throw new ApiError(502, "Backend mengembalikan detail siswa yang tidak valid.");
  }
  return student;
}
