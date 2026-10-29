import { z } from "zod";
import { AppError } from "../errors/app-error.js";

export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "request";
    (errors[key] ??= []).push(issue.message);
  }
  throw new AppError(
    "Data yang dikirim belum valid.",
    422,
    "VALIDATION_ERROR",
    errors,
  );
}
