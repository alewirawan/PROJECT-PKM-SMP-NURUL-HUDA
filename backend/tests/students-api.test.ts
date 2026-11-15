import { randomInt, randomUUID } from "node:crypto";
import cookie from "@fastify/cookie";
import Fastify from "fastify";
import { afterEach, afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../src/db/client.js";
import {
  applicationStatusHistory,
  applications,
} from "../src/db/schema/applications.js";
import { admins } from "../src/db/schema/auth.js";
import {
  applicationReEnrollments,
  students,
} from "../src/db/schema/students.js";
import {
  createApplicationsWriteGuard,
  createStudentsReadGuard,
} from "../src/modules/auth/auth.guard.js";
import type { AuthRepository } from "../src/modules/auth/auth.repository.js";
import { createApplicationWorkflowRepository } from "../src/modules/applications/application-workflow.repository.js";
import { registerApplicationWorkflowRoutes } from "../src/modules/applications/application-workflow.routes.js";
import { createStudentsRepository } from "../src/modules/students/student.repository.js";
import { registerStudentsRoutes } from "../src/modules/students/student.routes.js";
import { registerErrorHandlers } from "../src/shared/http/error-handler.js";
import { eq } from "drizzle-orm";
import { testConfig } from "./content-fixture.js";

const databaseUrl = process.env.SCHEMA_TEST_DATABASE_URL;
const sessionToken = "students-api-test-session";
const routeApps: ReturnType<typeof Fastify>[] = [];

type AdminRole = "super_admin" | "admin_ppdb" | "editor" | null;
type ApplicationStatus =
  | "verification"
  | "verified"
  | "interview"
  | "accepted"
  | "rejected";

describe.skipIf(!databaseUrl)("student and admission API", () => {
  let database: ReturnType<typeof createDatabase>;
  let adminId: string;

  beforeAll(async () => {
    const target = new URL(databaseUrl!);
    if (
      target.hostname !== "127.0.0.1" ||
      target.port !== "5433" ||
      target.pathname !== "/nh_schema_test"
    ) {
      throw new Error(
        "Tes API hanya boleh memakai nh_schema_test pada port lokal 5433.",
      );
    }

    database = createDatabase(databaseUrl!);
    await database.db.select({ id: students.id }).from(students).limit(1);
    const [admin] = await database.db
      .insert(admins)
      .values({
        email: `students-api-${randomUUID()}@example.test`,
        passwordHash: "test-only-not-a-real-password-hash",
        displayName: "Admin Pengujian API",
        role: "admin_ppdb",
      })
      .returning({ id: admins.id });
    adminId = admin!.id;
  });

  afterEach(async () => {
    await Promise.all(routeApps.splice(0).map((app) => app.close()));
  });

  afterAll(async () => {
    await database?.client.end();
  });

  async function createRouteApp(role: AdminRole = "admin_ppdb") {
    const app = Fastify();
    routeApps.push(app);
    app.decorateRequest("adminId", null);
    await app.register(cookie);
    registerErrorHandlers(app);

    const authRepository: AuthRepository = {
      findAdminByEmail: async () => undefined,
      createSession: async () => {},
      deleteSession: async () => {},
      findValidSession: async () =>
        role
          ? {
              tokenHash: "test-session-hash",
              adminId,
              displayName: "Admin Pengujian API",
              role,
              expiresAt: new Date(Date.now() + 60_000),
            }
          : undefined,
    };

    await app.register(
      async (api) => {
        await registerApplicationWorkflowRoutes(
          api,
          createApplicationWorkflowRepository(database.db),
          createApplicationsWriteGuard(authRepository, testConfig),
        );
        await registerStudentsRoutes(
          api,
          createStudentsRepository(database.db),
          createStudentsReadGuard(authRepository, testConfig),
        );
      },
      { prefix: "/api/v1" },
    );
    return app;
  }

  async function createApplication(
    status: ApplicationStatus,
    nisn = String(randomInt(1_000_000_000, 9_999_999_999)),
  ) {
    const suffix = randomUUID().replaceAll("-", "").toUpperCase();
    const [application] = await database.db
      .insert(applications)
      .values({
        registrationNumber: `NH-API-${suffix}`,
        studentName: `API Siswa ${suffix.slice(0, 8)}`,
        nisn,
        originSchool: "SD Pengujian",
        birthPlace: "Bandung",
        birthDate: new Date("2013-01-02"),
        gender: "Perempuan",
        address: "Alamat pengujian siswa",
        parentName: "Wali Pengujian",
        phone: "08123456789",
        email: `wali-${suffix.toLowerCase()}@example.test`,
        academicYear: "2026/2027",
        documentRequirements: {
          requiredKinds: ["kk"],
          requireOneGraduationDocument: false,
        },
        schemaVersion: 2,
        status,
      })
      .returning();
    return application!;
  }

  function adminHeaders() {
    return {
      cookie: `${testConfig.SESSION_COOKIE_NAME}=${sessionToken}`,
      origin: "http://localhost:3000",
    };
  }

  it("requires an authenticated admin for student endpoints", async () => {
    const app = await createRouteApp(null);
    const response = await app.inject("/api/v1/students");

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects roles without PPDB access", async () => {
    const app = await createRouteApp("editor");
    const response = await app.inject({
      url: "/api/v1/students",
      headers: { cookie: `${testConfig.SESSION_COOKIE_NAME}=${sessionToken}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: "FORBIDDEN" });
  });

  it("records acceptance and appends the admin to status history", async () => {
    const application = await createApplication("verified");
    const app = await createRouteApp();
    const response = await app.inject({
      method: "POST",
      url: `/api/v1/applications/${application.registrationNumber}/accept`,
      headers: adminHeaders(),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      applicationId: application.registrationNumber,
      status: "accepted",
      changed: true,
    });

    const [updated] = await database.db
      .select({ status: applications.status })
      .from(applications)
      .where(eq(applications.id, application.id));
    const [history] = await database.db
      .select({
        fromStatus: applicationStatusHistory.fromStatus,
        toStatus: applicationStatusHistory.toStatus,
        changedBy: applicationStatusHistory.changedBy,
      })
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, application.id));

    expect(updated?.status).toBe("accepted");
    expect(history).toMatchObject({
      fromStatus: "verified",
      toStatus: "accepted",
      changedBy: adminId,
    });
  });

  it("confirms re-enrollment once, creates one active student, and preserves it on retry", async () => {
    const nisn = String(randomInt(1_000_000_000, 9_999_999_999));
    const application = await createApplication("accepted", nisn);
    const app = await createRouteApp();
    const url = `/api/v1/applications/${application.registrationNumber}/complete-re-enrollment`;

    const first = await app.inject({
      method: "POST",
      url,
      headers: adminHeaders(),
    });
    const firstBody = first.json();
    expect(first.statusCode).toBe(201);
    expect(firstBody.student.status).toBe("active");
    expect(firstBody.reEnrollment.status).toBe("completed");
    expect(firstBody.reEnrollment.confirmedAt).toBeTruthy();

    const [confirmation] = await database.db
      .select({
        status: applicationReEnrollments.status,
        confirmedBy: applicationReEnrollments.confirmedBy,
      })
      .from(applicationReEnrollments)
      .where(eq(applicationReEnrollments.applicationId, application.id));
    expect(confirmation).toMatchObject({
      status: "completed",
      confirmedBy: adminId,
    });

    const retry = await app.inject({
      method: "POST",
      url,
      headers: adminHeaders(),
    });
    expect(retry.statusCode).toBe(200);
    expect(retry.json().student.id).toBe(firstBody.student.id);

    const studentRows = await database.db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.applicationId, application.id));
    expect(studentRows).toHaveLength(1);

    const list = await app.inject({
      url: `/api/v1/students/?q=${encodeURIComponent(application.studentName)}&page=1&limit=1`,
      headers: adminHeaders(),
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().items).toEqual([
      {
        id: firstBody.student.id,
        studentName: application.studentName,
        status: "active",
        officiallyRegisteredAt: firstBody.student.officiallyRegisteredAt,
      },
    ]);
    expect(list.json().pagination).toMatchObject({
      page: 1,
      limit: 1,
      total: 1,
      totalPages: 1,
    });
    expect(list.json().items[0]).not.toHaveProperty("nisn");

    const detail = await app.inject({
      url: `/api/v1/students/${firstBody.student.id}`,
      headers: adminHeaders(),
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json()).toMatchObject({
      id: firstBody.student.id,
      nisn,
      status: "active",
    });

    const historyBeforeRetry = await database.db
      .select({ id: applicationStatusHistory.id })
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, application.id));
    const acceptRetry = await app.inject({
      method: "POST",
      url: `/api/v1/applications/${application.registrationNumber}/accept`,
      headers: adminHeaders(),
    });
    expect(acceptRetry.statusCode).toBe(200);
    expect(acceptRetry.json().changed).toBe(false);
    const historyAfterRetry = await database.db
      .select({ id: applicationStatusHistory.id })
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, application.id));
    expect(historyAfterRetry).toHaveLength(historyBeforeRetry.length);
  });

  it("rejects re-enrollment before acceptance and disallows accepting rejected applicants", async () => {
    const notAccepted = await createApplication("verified");
    const rejected = await createApplication("rejected");
    const app = await createRouteApp();

    const reEnrollment = await app.inject({
      method: "POST",
      url: `/api/v1/applications/${notAccepted.registrationNumber}/complete-re-enrollment`,
      headers: adminHeaders(),
    });
    expect(reEnrollment.statusCode).toBe(409);

    const accept = await app.inject({
      method: "POST",
      url: `/api/v1/applications/${rejected.registrationNumber}/accept`,
      headers: adminHeaders(),
    });
    expect(accept.statusCode).toBe(409);

    const confirmations = await database.db
      .select({ id: applicationReEnrollments.id })
      .from(applicationReEnrollments)
      .where(eq(applicationReEnrollments.applicationId, notAccepted.id));
    expect(confirmations).toHaveLength(0);
  });

  it("rejects duplicate NISN without leaving a partial re-enrollment", async () => {
    const nisn = String(randomInt(1_000_000_000, 9_999_999_999));
    const existing = await createApplication("accepted", nisn);
    const duplicate = await createApplication("accepted", nisn);
    const app = await createRouteApp();

    const first = await app.inject({
      method: "POST",
      url: `/api/v1/applications/${existing.registrationNumber}/complete-re-enrollment`,
      headers: adminHeaders(),
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: "POST",
      url: `/api/v1/applications/${duplicate.registrationNumber}/complete-re-enrollment`,
      headers: adminHeaders(),
    });
    expect(second.statusCode).toBe(409);
    expect(second.json()).toMatchObject({ code: "CONFLICT" });

    const duplicateConfirmation = await database.db
      .select({ id: applicationReEnrollments.id })
      .from(applicationReEnrollments)
      .where(eq(applicationReEnrollments.applicationId, duplicate.id));
    const duplicateStudents = await database.db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.applicationId, duplicate.id));
    expect(duplicateConfirmation).toHaveLength(0);
    expect(duplicateStudents).toHaveLength(0);
  });
});
