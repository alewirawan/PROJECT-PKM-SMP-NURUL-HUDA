import { NotFoundError } from "../../shared/errors/app-error.js";
import { parseInput } from "../../shared/http/parse-input.js";
import type { AchievementRepository } from "./achievement.repository.js";
import { achievementInput, achievementUpdate } from "./achievement.schema.js";

export function createAchievementService(repository: AchievementRepository) {
  return {
    listPublic: () => repository.list(true),
    listAdmin: () => repository.list(false),
    create: (input: unknown) =>
      repository.create(parseInput(achievementInput, input)),
    async update(id: string, input: unknown) {
      const value = parseInput(achievementUpdate, input);
      const record = await repository.update(id, value);
      if (!record) throw new NotFoundError("Prestasi tidak ditemukan.");
      return record;
    },
    async remove(id: string) {
      const removed = await repository.remove(id);
      if (!removed) throw new NotFoundError("Prestasi tidak ditemukan.");
    },
  };
}
export type AchievementService = ReturnType<typeof createAchievementService>;