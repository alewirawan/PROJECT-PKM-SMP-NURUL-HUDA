import type { Database } from "../db/client.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}
