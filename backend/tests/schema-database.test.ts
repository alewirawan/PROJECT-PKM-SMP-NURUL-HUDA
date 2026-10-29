import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../src/db/client.js";
import { seedDemo } from "../src/db/seed-demo.js";
import * as s from "../src/db/schema/index.js";

const url = process.env.SCHEMA_TEST_DATABASE_URL;
describe.skipIf(!url)("full school database", () => {
  let database: ReturnType<typeof createDatabase>;
  beforeAll(async () => {
    const target = new URL(url!);
    if (
      target.hostname !== "127.0.0.1" ||
      !/^\/nh_schema_test(?:_[a-z0-9]+)?$/.test(target.pathname)
    )
      throw new Error(
        "Gunakan database nh_schema_test lokal khusus pengujian.",
      );
    database = createDatabase(url!);
    await migrate(database.db, {
      migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
    });
    await seedDemo(database.db);
  });
  afterAll(async () => {
    await database?.client.end();
  });

  async function application(overrides = {}) {
    const [row] = await database.db
      .insert(s.applications)
      .values({
        studentName: "Siswa Pengujian",
        nisn: "0012345678",
        originSchool: "SD Contoh",
        birthPlace: "Kota Contoh",
        birthDate: new Date("2013-01-01"),
        gender: "Perempuan",
        address: "Alamat contoh untuk pengujian",
        parentName: "Wali Contoh",
        phone: "0800000000",
        email: "wali@example.test",
        academicYear: "2026/2027",
        documentRequirements: {
          requiredKinds: ["kk"],
          requireOneGraduationDocument: true,
        },
        ...overrides,
      })
      .returning();
    return row!;
  }

  it("creates all 23 tables and migrations can be rerun", async () => {
    const rows =
      await database.client`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
    expect(rows).toHaveLength(23);
    await migrate(database.db, {
      migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
    });
  });

  it("seeds repeatably without overwriting existing settings", async () => {
    await database.db
      .update(s.schoolSettings)
      .set({ tagline: "Tagline yang sudah diedit" })
      .where(eq(s.schoolSettings.id, 1));
    await seedDemo(database.db);
    await seedDemo(database.db);
    const [settings] = await database.db.select().from(s.schoolSettings);
    expect(settings?.tagline).toBe("Tagline yang sudah diedit");
    expect(settings?.registrationOpen).toBe(false);
    const examples = await database.db
      .select()
      .from(s.clubs)
      .where(eq(s.clubs.id, "demo-pramuka"));
    expect(examples).toHaveLength(1);
  });

  it.each([
    { requiredKinds: ["kip"], requireOneGraduationDocument: false },
    { requiredKinds: ["kk", "kk"], requireOneGraduationDocument: false },
    { requiredKinds: "kk", requireOneGraduationDocument: false },
    { requiredKinds: [], requireOneGraduationDocument: "true" },
    { requiredKinds: [], requireOneGraduationDocument: false, extra: true },
    null,
  ])("rejects invalid requirements %j", async (value) => {
    await expect(
      database.client`UPDATE school_settings SET document_requirements=${database.client.json(value)} WHERE id=1`,
    ).rejects.toThrow();
  });

  it("validates one settings record and manual dates without opening PPDB", async () => {
    await expect(
      database.client`UPDATE school_settings SET id=2 WHERE id=1`,
    ).rejects.toThrow();
    await expect(
      database.db
        .update(s.schoolSettings)
        .set({
          registrationOpensAt: new Date("2026-11-02"),
          registrationClosesAt: new Date("2026-11-01"),
        })
        .where(eq(s.schoolSettings.id, 1)),
    ).rejects.toThrow();
    await database.db
      .update(s.schoolSettings)
      .set({
        registrationOpensAt: new Date("2026-01-01"),
        registrationClosesAt: new Date("2026-02-01"),
      })
      .where(eq(s.schoolSettings.id, 1));
    expect(
      (await database.db.select().from(s.schoolSettings))[0]?.registrationOpen,
    ).toBe(false);
  });

  it.each([
    { nisn: "123" },
    { gender: null },
    { academicYear: null },
    { documentRequirements: null },
    { phone: "123" },
    { schemaVersion: 1 },
  ])("rejects incomplete new applications %j", async (input) => {
    await expect(application(input)).rejects.toThrow();
  });

  it("generates registration IDs, preserves choices and protects the policy snapshot", async () => {
    const row = await application();
    expect(row.registrationNumber).toMatch(/^NH-[A-Z0-9-]+$/);
    const clubId = randomUUID();
    await database.db
      .insert(s.clubs)
      .values({
        id: clubId,
        name: clubId,
        description: "Kegiatan uji",
        active: true,
      });
    await database.db
      .insert(s.applicationChoices)
      .values({ applicationId: row.id, clubId, nameSnapshot: "Pramuka Lama" });
    await database.db
      .update(s.clubs)
      .set({ name: "Baru " + clubId, active: false })
      .where(eq(s.clubs.id, clubId));
    const record = await database.db.query.applications.findFirst({
      where: eq(s.applications.id, row.id),
      with: { choices: true, period: true },
    });
    expect(record?.choices[0]?.nameSnapshot).toBe("Pramuka Lama");
    expect(record?.period?.academicYear).toBe("2026/2027");
    await expect(
      database.db
        .insert(s.applicationChoices)
        .values({ applicationId: row.id, nameSnapshot: " pramuka lama " }),
    ).rejects.toThrow();
    await expect(
      database.db
        .update(s.applications)
        .set({
          documentRequirements: {
            requiredKinds: [],
            requireOneGraduationDocument: false,
          },
        })
        .where(eq(s.applications.id, row.id)),
    ).rejects.toThrow();
    await expect(
      database.db
        .update(s.applications)
        .set({ source: "offline" })
        .where(eq(s.applications.id, row.id)),
    ).rejects.toThrow();
  });

  it("supports empty/physical slots, file versions and private ownership without overwriting archives", async () => {
    const owner = await application();
    const other = await application();
    const [slot] = await database.db
      .insert(s.applicationDocumentSlots)
      .values({ applicationId: owner.id, kind: "kk" })
      .returning();
    const [otherSlot] = await database.db
      .insert(s.applicationDocumentSlots)
      .values({ applicationId: other.id, kind: "kk" })
      .returning();
    await expect(
      database.db
        .update(s.applicationDocumentSlots)
        .set({ status: "verified" })
        .where(eq(s.applicationDocumentSlots.id, slot!.id)),
    ).rejects.toThrow();
    await database.db
      .update(s.applicationDocumentSlots)
      .set({ status: "pending", receivedPhysically: true })
      .where(eq(s.applicationDocumentSlots.id, slot!.id));
    const file = {
      applicationId: owner.id,
      slotId: slot!.id,
      documentType: "kk",
      originalName: "kk.pdf",
      storageKey: randomUUID(),
      mimeType: "application/pdf",
      fileSize: 100,
    };
    await expect(
      database.db
        .insert(s.applicationDocuments)
        .values({ ...file, slotId: otherSlot!.id }),
    ).rejects.toThrow();
    await expect(
      database.db
        .insert(s.applicationDocuments)
        .values({ ...file, fileSize: 5242881 }),
    ).rejects.toThrow();
    await expect(
      database.db
        .insert(s.applicationDocuments)
        .values({ ...file, mimeType: "text/html" }),
    ).rejects.toThrow();
    const [version1] = await database.db
      .insert(s.applicationDocuments)
      .values(file)
      .returning();
    await database.db
      .update(s.applicationDocumentSlots)
      .set({ currentVersionId: version1!.id, status: "pending" })
      .where(eq(s.applicationDocumentSlots.id, slot!.id));
    await expect(
      database.db
        .update(s.applicationDocumentSlots)
        .set({ currentVersionId: version1!.id, status: "pending" })
        .where(eq(s.applicationDocumentSlots.id, otherSlot!.id)),
    ).rejects.toThrow();
    await expect(
      database.db
        .update(s.applicationDocumentSlots)
        .set({ status: "needs_correction", reviewNote: " " })
        .where(eq(s.applicationDocumentSlots.id, slot!.id)),
    ).rejects.toThrow();
    await database.db
      .update(s.applicationDocumentSlots)
      .set({ status: "needs_correction", reviewNote: "Teks kurang terbaca" })
      .where(eq(s.applicationDocumentSlots.id, slot!.id));
    await database.db
      .insert(s.documentReviews)
      .values({
        slotId: slot!.id,
        versionId: version1!.id,
        status: "needs_correction",
        receivedPhysically: true,
        note: "Teks kurang terbaca",
      });
    const [version2] = await database.db
      .insert(s.applicationDocuments)
      .values({ ...file, storageKey: randomUUID() })
      .returning();
    await expect(
      database.db
        .update(s.applicationDocumentSlots)
        .set({ currentVersionId: version2!.id })
        .where(eq(s.applicationDocumentSlots.id, slot!.id)),
    ).rejects.toThrow();
    await database.db
      .update(s.applicationDocumentSlots)
      .set({
        currentVersionId: version2!.id,
        status: "pending",
        reviewNote: null,
        reviewedAt: null,
        reviewedBy: null,
      })
      .where(eq(s.applicationDocumentSlots.id, slot!.id));
    const complete = await database.db.query.applicationDocumentSlots.findFirst(
      {
        where: eq(s.applicationDocumentSlots.id, slot!.id),
        with: { versions: true, reviews: true, currentVersion: true },
      },
    );
    expect(complete?.versions).toHaveLength(2);
    expect(complete?.reviews).toHaveLength(1);
    expect(complete?.currentVersion?.id).toBe(version2!.id);
    await expect(
      database.db
        .update(s.applicationDocuments)
        .set({ storageKey: randomUUID() })
        .where(eq(s.applicationDocuments.id, version1!.id)),
    ).rejects.toThrow();
    await expect(
      database.db
        .update(s.documentReviews)
        .set({ note: "Timpa" })
        .where(eq(s.documentReviews.slotId, slot!.id)),
    ).rejects.toThrow();
    expect(
      (
        await database.db.query.applications.findFirst({
          where: eq(s.applications.id, owner.id),
        })
      )?.status,
    ).toBe("verification");
  });

  it("allows zero/one principal and rejects duplicate principals or invalid portrait indexes", async () => {
    const leader = {
      id: randomUUID(),
      name: "Pimpinan Contoh",
      role: "Kepala Sekolah",
      initials: "PC",
      focus: "Fokus pendidikan",
      tone: "sage",
      level: "principal" as const,
      portraitIndex: 1,
    };
    await database.db.insert(s.schoolLeaders).values(leader);
    await expect(
      database.db
        .insert(s.schoolLeaders)
        .values({ ...leader, id: randomUUID() }),
    ).rejects.toThrow();
    await expect(
      database.db
        .insert(s.schoolLeaders)
        .values({
          ...leader,
          id: randomUUID(),
          level: "support",
          portraitIndex: 8,
        }),
    ).rejects.toThrow();
    await database.db
      .update(s.schoolLeaders)
      .set({ level: "support" })
      .where(eq(s.schoolLeaders.id, leader.id));
  });

  it("protects post slugs, paragraph arrays, achievement years and message statuses", async () => {
    const post = {
      title: "Artikel contoh",
      slug: "uji-" + randomUUID(),
      category: "Berita",
      image: "/images/campus.jpg",
      excerpt: "Keterangan artikel untuk pengujian",
      content: ["Paragraf pertama"],
      author: "Admin Uji",
      status: "Draft" as const,
    };
    await database.db.insert(s.posts).values(post);
    await expect(database.db.insert(s.posts).values(post)).rejects.toThrow();
    await expect(
      database.db
        .insert(s.posts)
        .values({ ...post, slug: randomUUID(), content: [] }),
    ).rejects.toThrow();
    await expect(
      database.client`UPDATE posts SET content='[1]'::jsonb WHERE slug=${post.slug}`,
    ).rejects.toThrow();
    await expect(
      database.client`UPDATE achievements SET year='abcd'`,
    ).rejects.toThrow();
    const [message] = await database.db
      .insert(s.contactMessages)
      .values({
        name: "Pengirim Uji",
        email: "uji@example.test",
        topic: "Informasi",
        message: "Pesan contoh pengujian",
      })
      .returning();
    expect(message?.status).toBe("Baru");
  });

  it("enforces one account per application, hashed sessions and expiration", async () => {
    const app = await application();
    const [account] = await database.db
      .insert(s.applicantAccounts)
      .values({ applicationId: app.id })
      .returning();
    await expect(
      database.db.insert(s.applicantAccounts).values({ applicationId: app.id }),
    ).rejects.toThrow();
    await expect(
      database.db
        .update(s.applicantAccounts)
        .set({ activatedAt: new Date() })
        .where(eq(s.applicantAccounts.id, account!.id)),
    ).rejects.toThrow();
    await expect(
      database.db
        .insert(s.applicantSessions)
        .values({
          accountId: account!.id,
          tokenHash: "raw-token",
          expiresAt: new Date(Date.now() + 60000),
        }),
    ).rejects.toThrow();
    await expect(
      database.db
        .insert(s.applicantSessions)
        .values({
          accountId: account!.id,
          tokenHash: "a".repeat(64),
          expiresAt: new Date("2000-01-01"),
        }),
    ).rejects.toThrow();
  });

  it("provides atomic idempotency keys and append-only audit/status history", async () => {
    const app = await application();
    const key = randomUUID();
    const request = {
      key,
      payloadHash: "b".repeat(64),
      expiresAt: new Date(Date.now() + 86400000),
    };
    await database.db.insert(s.submissionRequests).values(request);
    await expect(
      database.db.insert(s.submissionRequests).values(request),
    ).rejects.toThrow();
    await expect(
      database.db
        .update(s.submissionRequests)
        .set({ state: "completed" })
        .where(eq(s.submissionRequests.key, key)),
    ).rejects.toThrow();
    await database.db
      .update(s.submissionRequests)
      .set({
        state: "completed",
        applicationId: app.id,
        receipt: {
          id: app.registrationNumber,
          status: "Verifikasi",
          submittedAt: app.submittedAt.toISOString(),
        },
      })
      .where(eq(s.submissionRequests.key, key));
    const [audit] = await database.db
      .insert(s.auditEvents)
      .values({
        action: "application.created",
        resourceType: "application",
        resourceId: app.id,
      })
      .returning();
    await expect(
      database.db
        .update(s.auditEvents)
        .set({ action: "changed" })
        .where(eq(s.auditEvents.id, audit!.id)),
    ).rejects.toThrow();
    const [history] = await database.db
      .insert(s.applicationStatusHistory)
      .values({ applicationId: app.id, toStatus: "verification" })
      .returning();
    await expect(
      database.db
        .update(s.applicationStatusHistory)
        .set({ toStatus: "accepted" })
        .where(eq(s.applicationStatusHistory.id, history!.id)),
    ).rejects.toThrow();
  });
});
