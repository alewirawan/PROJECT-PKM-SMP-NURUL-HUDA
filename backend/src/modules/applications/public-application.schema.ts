import { z } from "zod";

const isCalendarDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month! - 1 &&
    date.getUTCDate() === day!
  );
};

export const publicApplicationData = z.strictObject({
  studentName: z.string().trim().min(2).max(120),
  nisn: z.string().regex(/^[0-9]{10}$/),
  originSchool: z.string().trim().min(2).max(160),
  birthPlace: z.string().trim().min(2).max(100),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isCalendarDate, "Tanggal lahir tidak valid.")
    .refine((value) => value <= new Date().toISOString().slice(0, 10), {
      message: "Tanggal lahir tidak boleh di masa depan.",
    }),
  gender: z.enum(["Laki-laki", "Perempuan"]),
  address: z.string().trim().min(1).max(600),
  parentName: z.string().trim().min(2).max(120),
  parentOccupation: z.string().trim().max(120).optional(),
  phone: z.string().regex(/^[+]?[0-9 ]{8,20}$/),
  email: z.string().trim().email().max(254),
  extracurriculars: z
    .array(z.string().trim().min(1).max(80))
    .optional()
    .default([]),
});

export const idempotencyKey = z.string().uuid();

export type PublicApplicationData = z.infer<typeof publicApplicationData>;
export type PublicApplicationDocumentKind =
  | "skl"
  | "ijazah"
  | "kk"
  | "ktp"
  | "kip"
  | "akta";

export type PublicApplicationFile = {
  kind: PublicApplicationDocumentKind;
  originalName: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  content: Buffer;
};

export type ApplicationReceipt = {
  id: string;
  status: "Verifikasi";
  submittedAt: string;
};

export const applicationDocumentKinds: readonly PublicApplicationDocumentKind[] =
  ["skl", "ijazah", "kk", "ktp", "kip", "akta"];
