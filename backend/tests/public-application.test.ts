import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerApplicationSubmissionRoutes } from "../src/modules/applications/application-submission.routes.js";
import type { ApplicationReceipt } from "../src/modules/applications/public-application.schema.js";
import { registerErrorHandlers } from "../src/shared/http/error-handler.js";

const apps: ReturnType<typeof Fastify>[] = [];
const boundary = "ppdb-test-boundary";
const data = {
  studentName: "Siswa Uji",
  nisn: "0000000000",
  originSchool: "SD Contoh",
  birthPlace: "Kota Contoh",
  birthDate: "2013-01-02",
  gender: "Perempuan",
  address: "Alamat contoh",
  parentName: "Wali Uji",
  phone: "0800000000",
  email: "wali@example.test",
  extracurriculars: ["Pramuka"],
};

function multipartBody(file = Buffer.from("%PDF-1.7\n")) {
  return Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="data"; filename="data.json"\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(data)}\r\n`,
    ),
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="kk"; filename="Kartu.pdf"\r\nContent-Type: application/pdf\r\n\r\n`,
    ),
    file,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
}

async function setup() {
  const app = Fastify();
  apps.push(app);
  await app.register(cookie);
  await app.register(multipart);
  await app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: "1 minute",
  });
  registerErrorHandlers(app);
  const receipt: ApplicationReceipt = {
    id: "NH-2026-AB12",
    status: "Verifikasi",
    submittedAt: "2026-11-15T12:00:00.000Z",
  };
  const submit = vi.fn(async () => receipt);
  await app.register(
    async (api) => {
      await registerApplicationSubmissionRoutes(api, { submit });
    },
    { prefix: "/api/v1" },
  );
  return { app, submit, receipt };
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("POST /api/v1/applications", () => {
  it("accepts a public multipart submission and returns only its receipt", async () => {
    const { app, submit, receipt } = await setup();
    const key = "e708a75a-8b2c-4c7f-99dc-7da19fe8464d";
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/applications",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "idempotency-key": key,
      },
      payload: multipartBody(),
    });

    expect(response.statusCode).toBe(201);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.json()).toEqual(receipt);
    expect(submit).toHaveBeenCalledWith(
      key,
      { ...data, extracurriculars: ["Pramuka"] },
      [
        expect.objectContaining({
          kind: "kk",
          originalName: "Kartu.pdf",
          mimeType: "application/pdf",
        }),
      ],
    );
    expect(JSON.stringify(response.json())).not.toContain("storageKey");
  });

  it("rejects malformed or missing idempotency keys before handling data", async () => {
    const { app, submit } = await setup();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/applications",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "idempotency-key": "invalid",
      },
      payload: multipartBody(),
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(submit).not.toHaveBeenCalled();
  });

  it("rejects a file whose content signature does not match an allowed type", async () => {
    const { app, submit } = await setup();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/applications",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "idempotency-key": "e708a75a-8b2c-4c7f-99dc-7da19fe8464d",
      },
      payload: multipartBody(Buffer.from("<html>not a PDF</html>")),
    });

    expect(response.statusCode).toBe(415);
    expect(response.json()).toMatchObject({
      code: "UNSUPPORTED_MEDIA_TYPE",
    });
    expect(submit).not.toHaveBeenCalled();
  });
});
