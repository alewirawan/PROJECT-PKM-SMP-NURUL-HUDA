import { AppError } from "../../shared/errors/app-error.js";
import { parseInput } from "../../shared/http/parse-input.js";
import { clubInput, clubUpdate } from "./club.schema.js";
import type { ClubRepository } from "./club.repository.js";

function rethrowConflict(error: unknown): never {
  const dbError = error as { code?: string; cause?: { code?: string } };
  if (dbError?.code === "23505" || dbError?.cause?.code === "23505") {
    throw new AppError(
      "Nama ekstrakurikuler sudah digunakan.",
      409,
      "CONFLICT",
    );
  }
  throw error;
}

export function createClubService(repository: ClubRepository) {
  return {
    list: (publicOnly: boolean) => repository.list(publicOnly),
    async create(input: unknown) {
      const value = parseInput(clubInput, input);
      try {
        return await repository.create(value);
      } catch (error) {
        rethrowConflict(error);
      }
    },
    async update(id: string, input: unknown) {
      const value = parseInput(clubUpdate, input);
      try {
        const record = await repository.update(id, value);
        if (!record)
          throw new AppError(
            "Ekstrakurikuler tidak ditemukan.",
            404,
            "NOT_FOUND",
          );
        return record;
      } catch (error) {
        rethrowConflict(error);
      }
    },
  };
}
