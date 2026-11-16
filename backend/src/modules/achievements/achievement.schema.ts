import { z } from "zod";
import {
  achievementCategory,
  achievementLevel,
} from "../../db/schema/achievements.js";

export const achievementImages = [
  "/images/science.jpg",
  "/images/students.jpg",
  "/images/library.jpg",
  "/images/campus.jpg",
  "/images/paskibra1.jpg",
  "/images/paskibra2.jpg",
] as const;

const fields = {
  title: z.string().trim().min(1).max(120),
  award: z.string().trim().min(1).max(120),
  level: z.enum(achievementLevel.enumValues),
  year: z.string().regex(/^[0-9]{4}$/, "Tahun harus 4 digit."),
  category: z.enum(achievementCategory.enumValues),
  description: z.string().trim().min(1).max(600),
  image: z.enum(achievementImages),
  published: z.boolean(),
};
export const achievementInput = z.strictObject(fields);
export const achievementUpdate = achievementInput
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Isi minimal satu field.");
export type AchievementInput = z.infer<typeof achievementInput>;
export type AchievementUpdate = z.infer<typeof achievementUpdate>;
export type Achievement = AchievementInput & { id: string };