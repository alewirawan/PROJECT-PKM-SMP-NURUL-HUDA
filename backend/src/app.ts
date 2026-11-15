import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import type { AppConfig } from "./config/env.js";
import { createDatabase } from "./db/client.js";
import { registerAuthRoutes } from "./modules/auth/auth.routes.js";
import { registerHealthRoutes } from "./modules/health/health.routes.js";
import { registerPostRoutes } from "./modules/posts/post.routes.js";
import { createAuthRepository } from "./modules/auth/auth.repository.js";
import {
  createApplicationsReadGuard,
  createApplicationsWriteGuard,
  createContentGuard,
  createDashboardReadGuard,
  createSettingsWriteGuard,
  createStudentsReadGuard,
} from "./modules/auth/auth.guard.js";
import { createClubRepository } from "./modules/clubs/club.repository.js";
import { registerClubRoutes } from "./modules/clubs/club.routes.js";
import { createAgendaRepository } from "./modules/agenda/agenda.repository.js";
import { registerAgendaRoutes } from "./modules/agenda/agenda.routes.js";
import { registerErrorHandlers } from "./shared/http/error-handler.js";
import { createApplicationsRepository } from "./modules/applications/application.repository.js";
import { registerApplicationsRoutes } from "./modules/applications/application.routes.js";
import { createApplicationWorkflowRepository } from "./modules/applications/application-workflow.repository.js";
import { registerApplicationWorkflowRoutes } from "./modules/applications/application-workflow.routes.js";
import { createStudentsRepository } from "./modules/students/student.repository.js";
import { registerStudentsRoutes } from "./modules/students/student.routes.js";
import { createDashboardRepository } from "./modules/dashboard/dashboard.repository.js";
import { registerDashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { createApplicationSubmissionRepository } from "./modules/applications/application-submission.repository.js";
import { createApplicationSubmissionService } from "./modules/applications/application-submission.service.js";
import { registerApplicationSubmissionRoutes } from "./modules/applications/application-submission.routes.js";
import { createPublicDocumentStore } from "./modules/applications/public-document-store.js";
import { createSettingsRepository } from "./modules/settings/settings.repository.js";
import { registerSettingsRoutes } from "./modules/settings/settings.routes.js";

export async function buildApp(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.NODE_ENV === "test" ? false : { level: "info" },
    trustProxy: config.TRUST_PROXY,
    bodyLimit: config.MAX_UPLOAD_MB * 1024 * 1024,
  });
  app.decorateRequest("adminId", null);
  const { client, db } = createDatabase(config.DATABASE_URL);
  app.decorate("db", db);
  app.addHook("onClose", async () => client.end());

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cookie);
  await app.register(cors, {
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    origin(origin, callback) {
      if (!origin || config.FRONTEND_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin tidak diizinkan."), false);
    },
  });
  await app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: "1 minute",
  });
  await app.register(multipart, {
    limits: { files: 1, fileSize: config.MAX_UPLOAD_MB * 1024 * 1024 },
  });

  registerErrorHandlers(app);
  await app.register(
    async (api) => {
      await registerHealthRoutes(api);
      await registerAuthRoutes(api, config);
      const authRepository = createAuthRepository(db);
      const contentGuard = createContentGuard(authRepository, config);
      await registerSettingsRoutes(
        api,
        createSettingsRepository(db),
        createSettingsWriteGuard(authRepository, config),
      );
      await registerClubRoutes(api, createClubRepository(db), contentGuard);
      await registerAgendaRoutes(api, createAgendaRepository(db), contentGuard);
      await registerApplicationsRoutes(
        api,
        createApplicationsRepository(db),
        createApplicationsReadGuard(authRepository, config),
      );
      await registerApplicationSubmissionRoutes(
        api,
        createApplicationSubmissionService(
          createApplicationSubmissionRepository(
            db,
            createPublicDocumentStore(config.UPLOAD_DIR),
          ),
        ),
      );
      await registerApplicationWorkflowRoutes(
        api,
        createApplicationWorkflowRepository(db),
        createApplicationsWriteGuard(authRepository, config),
      );
      await registerStudentsRoutes(
        api,
        createStudentsRepository(db),
        createStudentsReadGuard(authRepository, config),
      );
      await registerDashboardRoutes(
        api,
        createDashboardRepository(db),
        createDashboardReadGuard(authRepository, config),
      );
      await registerPostRoutes(api, config);
    },
    { prefix: "/api/v1" },
  );

  return app;
}
