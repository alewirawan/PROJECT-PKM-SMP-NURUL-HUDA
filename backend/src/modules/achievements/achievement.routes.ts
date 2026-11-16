import type { FastifyInstance, onRequestHookHandler } from "fastify";
import type { AchievementRepository } from "./achievement.repository.js";
import { createAchievementService } from "./achievement.service.js";

export async function registerAchievementRoutes(
  app: FastifyInstance,
  repository: AchievementRepository,
  guard: onRequestHookHandler,
) {
  const service = createAchievementService(repository);

  app.get("/achievements", () => service.listPublic());

  app.get("/admin/achievements", { onRequest: guard }, (_, reply) => {
    reply.header("Cache-Control", "no-store");
    return service.listAdmin();
  });

  app.post("/achievements", { onRequest: guard }, async (request, reply) =>
    reply.code(201).send(await service.create(request.body)),
  );

  app.patch<{ Params: { achievementId: string } }>(
    "/achievements/:achievementId",
    { onRequest: guard },
    async (request, reply) => {
      const record = await service.update(
        request.params.achievementId,
        request.body,
      );
      return (
        record ??
        reply.code(404).send({
          message: "Prestasi tidak ditemukan.",
          code: "NOT_FOUND",
          requestId: request.id,
        })
      );
    },
  );

  app.delete<{ Params: { achievementId: string } }>(
    "/achievements/:achievementId",
    { onRequest: guard },
    async (request, reply) => {
      const removed = await service.remove(request.params.achievementId);
      if (removed) return reply.code(204).send();
      return reply.code(404).send({
        message: "Prestasi tidak ditemukan.",
        code: "NOT_FOUND",
        requestId: request.id,
      });
    },
  );
}