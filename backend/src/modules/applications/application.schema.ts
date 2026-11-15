import { z } from "zod";

const cursorPosition = z.strictObject({
  submittedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/)
    .refine((value) => Number.isFinite(Date.parse(value))),
  registrationNumber: z.string().regex(/^NH-[A-Z0-9-]+$/),
});

const cursorInput = z
  .string()
  .min(1)
  .max(512)
  .transform((value, context) => {
    let decoded: unknown;
    try {
      decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    } catch {
      context.addIssue({ code: "custom", message: "Cursor tidak valid." });
      return z.NEVER;
    }

    const result = cursorPosition.safeParse(decoded);
    if (!result.success) {
      context.addIssue({ code: "custom", message: "Cursor tidak valid." });
      return z.NEVER;
    }
    return result.data;
  })
  .optional();

export const applicationListQuery = z.strictObject({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),
  source: z.enum(["Website", "Offline"]).optional(),
  status: z
    .enum(["Verifikasi", "Terverifikasi", "Wawancara", "Diterima", "Ditolak"])
    .optional(),
  cursor: cursorInput,
  limit: z.coerce.number().int().min(1).max(100).default(25),
  documents: z.enum(["Lengkap", "Belum lengkap"]).optional(),
});

export type ApplicationListQuery = z.infer<typeof applicationListQuery>;
export type ApplicationCursorPosition = z.infer<typeof cursorPosition>;

export function encodeApplicationCursor(position: ApplicationCursorPosition) {
  return Buffer.from(JSON.stringify(position)).toString("base64url");
}

export type ApplicationApiStatus =
  | "Verifikasi"
  | "Terverifikasi"
  | "Wawancara"
  | "Diterima"
  | "Ditolak";

export type ApplicationApiSource = "Website" | "Offline";

export type ApplicationApiDocument = {
  id: string;
  kind: "skl" | "ijazah" | "kk" | "ktp" | "kip" | "akta" | "photo";
  label: string;
  status:
    | "Belum ada"
    | "Menunggu pemeriksaan"
    | "Terverifikasi"
    | "Perlu perbaikan";
  hasFile: boolean;
  receivedPhysically: boolean;
  fileName?: string;
  mimeType?: "application/pdf" | "image/jpeg" | "image/png";
  size?: number;
  uploadedAt?: string;
  reviewNote?: string;
  reviewedAt: string | null;
};

export type ApplicationApiRecord = {
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
  source: ApplicationApiSource;
  status: ApplicationApiStatus;
  reEnrollmentStatus: "pending" | "completed" | null;
  submittedAt: string;
  notes?: string;
  documents: ApplicationApiDocument[];
  extracurriculars: string[];
  documentRequirements: {
    requiredKinds: ("skl" | "ijazah" | "kk" | "ktp" | "akta")[];
    requireOneGraduationDocument: boolean;
  };
};

export type ApplicationApiPage = {
  items: ApplicationApiRecord[];
  nextCursor: string | null;
};
