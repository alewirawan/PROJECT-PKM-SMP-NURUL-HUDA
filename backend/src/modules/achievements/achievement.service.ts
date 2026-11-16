import type { AchievementRepository } from "./achievement.repository.js";
import type { AchievementInput, AchievementUpdate } from "./achievement.schema.js";

export function createAchievementService(repo: AchievementRepository) {
  return {
    listPublic: () => repo.list(true),
    listAdmin: () => repo.list(false),
    create: (input: AchievementInput) => repo.create(input),
    // undefined bila id tidak ditemukan, routes yang mengubahnya jadi 404
    update: (id: string, input: AchievementUpdate) => repo.update(id, input),
    // false bila id tidak ditemukan
    remove: (id: string) => repo.remove(id),
  };
}
export type AchievementService = ReturnType<typeof createAchievementService>;