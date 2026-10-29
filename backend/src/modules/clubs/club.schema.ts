import { z } from "zod";

const fields = {
  name: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .refine(
      (value) => value.toLowerCase() !== "belum menentukan",
      "Gunakan nama kegiatan, bukan pilihan kosong.",
    ),
  description: z.string().trim().min(1).max(300),
  active: z.boolean(),
};
export const clubInput = z.strictObject(fields);
export const clubUpdate = clubInput
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Isi minimal satu field.");
export type ClubInput = z.infer<typeof clubInput>;
export type ClubUpdate = z.infer<typeof clubUpdate>;
export type Club = ClubInput & { id: string };
