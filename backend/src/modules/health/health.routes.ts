import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    status: "ok",
    service: "nurul-huda-backend",
    timestamp: new Date().toISOString(),
  }));

  app.get("/ready", async (_request, reply) => {
    try {
      await app.db.execute(sql`select 1`);
      return { status: "ready", database: "connected" };
    } catch {
      return reply.code(503).send({
        status: "unavailable",
        database: "disconnected",
      });
    }
  });
}
