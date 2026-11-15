import { z } from "zod";

export const studentListQuery = z.strictObject({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),
  status: z.enum(["active", "inactive"]).default("active"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const studentIdParams = z.strictObject({
  studentId: z.string().uuid(),
});

export type StudentListQuery = z.infer<typeof studentListQuery>;
