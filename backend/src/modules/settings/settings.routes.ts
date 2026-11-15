import type { FastifyInstance, onRequestHookHandler } from "fastify";
import type { SettingsRepository } from "./settings.repository.js";
import { createSettingsService } from "./settings.service.js";

export async function registerSettingsRoutes(
  app: FastifyInstance,
  repository: SettingsRepository,
  writeGuard: onRequestHookHandler,
) {
  const service = createSettingsService(repository);
  app.get("/settings", async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    return service.get();
  });
  app.put(
    "/settings",
    { onRequest: writeGuard },
    async (request, reply) => {
      reply.header("Cache-Control", "no-store");
      return service.save(request.body);
    },
  );
}
