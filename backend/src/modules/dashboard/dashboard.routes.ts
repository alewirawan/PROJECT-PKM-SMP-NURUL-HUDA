import type { FastifyInstance, onRequestHookHandler } from "fastify";
import type { DashboardRepository } from "./dashboard.repository.js";

export async function registerDashboardRoutes(
  app: FastifyInstance,
  repository: DashboardRepository,
  guard: onRequestHookHandler,
) {
  app.get(
    "/admin/dashboard/summary",
    { onRequest: guard },
    async (_, reply) => {
      reply.header("Cache-Control", "no-store");
      return repository.summary();
    },
  );
}
