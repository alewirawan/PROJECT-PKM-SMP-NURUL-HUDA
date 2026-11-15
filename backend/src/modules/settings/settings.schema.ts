import { z } from "zod";

const documentRequirements = z.strictObject({
  requiredKinds: z
    .array(z.enum(["skl", "ijazah", "kk", "ktp", "akta"]))
    .refine((values) => new Set(values).size === values.length),
  requireOneGraduationDocument: z.boolean(),
});

export const schoolSettingsInput = z
  .strictObject({
    schoolName: z.string().trim().min(2).max(120),
    tagline: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(254),
    ppdbEmail: z.string().trim().email().max(254),
    phone: z.string().trim().min(8).max(30),
    whatsapp: z.string().trim().min(8).max(30),
    address: z.string().trim().min(10).max(500),
    academicYear: z
      .string()
      .regex(/^[0-9]{4}\/[0-9]{4}$/)
      .refine((value) => Number(value.slice(5)) === Number(value.slice(0, 4)) + 1),
    registrationOpen: z.boolean(),
    documentRequirements,
    registrationOpensAt: z.string().datetime({ offset: true }).nullable(),
    registrationClosesAt: z.string().datetime({ offset: true }).nullable(),
    dataRetention: z.literal("indefinite"),
  })
  .refine(
    ({ registrationOpensAt, registrationClosesAt }) =>
      !registrationOpensAt ||
      !registrationClosesAt ||
      Date.parse(registrationClosesAt) > Date.parse(registrationOpensAt),
    {
      message: "Tanggal tutup harus sesudah tanggal buka.",
      path: ["registrationClosesAt"],
    },
  );

export type SchoolSettingsInput = z.infer<typeof schoolSettingsInput>;
