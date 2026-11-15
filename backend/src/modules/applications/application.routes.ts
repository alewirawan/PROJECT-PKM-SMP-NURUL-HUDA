import type { FastifyInstance, onRequestHookHandler } from "fastify";
import type { ApplicationsRepository } from "./application.repository.js";
import { createApplicationsService } from "./application.service.js";

export async function registerApplicationsRoutes(
  app: FastifyInstance,
  repository: ApplicationsRepository,
  guard: onRequestHookHandler,
) {
  const service = createApplicationsService(repository);
  app.get(
    "/applications",
    { onRequest: guard },
    async (request, reply) => {
      reply.header("Cache-Control", "no-store");
      return service.list(request.query);
    },
  );
}
