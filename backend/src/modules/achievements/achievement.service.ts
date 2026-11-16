import type { AchievementRepository } from "./achievement.repository.js";
import { achievementInput, achievementUpdate } from "./achievement.schema.js";

export function createAchievementService(repo: AchievementRepository) {
  return {
    listPublic: () => repo.list(true),
    listAdmin: () => repo.list(false),
    create: (body: unknown) => repo.create(achievementInput.parse(body)),
    update: (id: string, body: unknown) =>
      repo.update(id, achievementUpdate.parse(body)),
    remove: (id: string) => repo.remove(id),
  };
}
export type AchievementService = ReturnType<typeof createAchievementService>;