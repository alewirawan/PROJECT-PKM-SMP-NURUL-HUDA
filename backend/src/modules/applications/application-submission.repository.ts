import { createHash } from "node:crypto";
import { and, eq, inArray, lte, sql } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import {
  applicationChoices,
  applicationStatusHistory,
  applications,
  submissionRequests,
} from "../../db/schema/applications.js";
import {
  applicationDocuments,
  applicationDocumentSlots,
} from "../../db/schema/documents.js";
import { clubs } from "../../db/schema/clubs.js";
import { schoolSettings } from "../../db/schema/settings.js";
import {
  AppError,
  ConflictError,
  ForbiddenError,
} from "../../shared/errors/app-error.js";
import type {
  ApplicationReceipt,
  PublicApplicationData,
  PublicApplicationDocumentKind,
  PublicApplicationFile,
} from "./public-application.schema.js";
import type { PublicDocumentStore } from "./public-document-store.js";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function payloadHash(
  data: PublicApplicationData,
  files: PublicApplicationFile[],
) {
  const hash = createHash("sha256").update(JSON.stringify(data));
  for (const file of [...files].sort((a, b) => a.kind.localeCompare(b.kind))) {
    hash
      .update(file.kind)
      .update(file.originalName)
      .update(file.mimeType)
      .update(file.content);
  }
  return hash.digest("hex");
}

function validateRequirements(
  requiredKinds: readonly PublicApplicationDocumentKind[],
  requireOneGraduationDocument: boolean,
  files: PublicApplicationFile[],
) {
  const provided = new Set(files.map((file) => file.kind));
  const missing: string[] = requiredKinds.filter(
    (kind) => !provided.has(kind),
  );
  if (
    requireOneGraduationDocument &&
    !provided.has("skl") &&
    !provided.has("ijazah")
  ) {
    missing.push("skl atau ijazah");
  }
  if (missing.length) {
    throw new AppError(
      "Berkas wajib belum lengkap.",
      422,
      "VALIDATION_ERROR",
      { documents: missing },
    );
  }
}

function normalizeSelections(values: string[]) {
  const names = values.map((value) => value.trim());
  const normalized = names.map((value) => value.toLocaleLowerCase("id-ID"));
  if (new Set(normalized).size !== normalized.length) {
    throw new AppError(
      "Pilihan ekstrakurikuler tidak boleh berulang.",
      422,
      "VALIDATION_ERROR",
      { extracurriculars: ["Pilihan duplikat."] },
    );
  }
  return names;
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export function createApplicationSubmissionRepository(
  db: Database,
  documentStore: PublicDocumentStore,
) {
  return {
    async submit(
      idempotencyKey: string,
      data: PublicApplicationData,
      files: PublicApplicationFile[],
    ): Promise<ApplicationReceipt> {
      const hash = payloadHash(data, files);
      const now = new Date();
      const storedKeys: string[] = [];

      try {
        return await db.transaction(async (tx) => {
          await tx
            .delete(submissionRequests)
            .where(
              and(
                eq(submissionRequests.key, idempotencyKey),
                lte(submissionRequests.expiresAt, now),
              ),
            );
          const [claim] = await tx
            .insert(submissionRequests)
            .values({
              key: idempotencyKey,
              payloadHash: hash,
              state: "processing",
              createdAt: now,
              expiresAt: new Date(now.getTime() + IDEMPOTENCY_TTL_MS),
            })
            .onConflictDoNothing()
            .returning({ key: submissionRequests.key });

          if (!claim) {
            const [existing] = await tx
              .select({
                payloadHash: submissionRequests.payloadHash,
                state: submissionRequests.state,
                receipt: submissionRequests.receipt,
                expiresAt: submissionRequests.expiresAt,
              })
              .from(submissionRequests)
              .where(eq(submissionRequests.key, idempotencyKey))
              .limit(1)
              .for("update");
            if (!existing || existing.expiresAt <= now)
              throw new ConflictError(
                "Permintaan pendaftaran sedang diproses. Coba kembali dengan kunci yang sama.",
              );
            if (existing.payloadHash !== hash)
              throw new ConflictError(
                "Kunci pengiriman yang sama tidak dapat digunakan untuk data berbeda.",
              );
            if (existing.state !== "completed" || !existing.receipt)
              throw new ConflictError(
                "Permintaan pendaftaran sedang diproses. Coba kembali dengan kunci yang sama.",
              );
            if (
              typeof existing.receipt.id !== "string" ||
              existing.receipt.status !== "Verifikasi" ||
              typeof existing.receipt.submittedAt !== "string"
            )
              throw new ConflictError(
                "Hasil pendaftaran sebelumnya tidak valid.",
              );
            return {
              id: existing.receipt.id,
              status: "Verifikasi",
              submittedAt: existing.receipt.submittedAt,
            };
          }

          const [settings] = await tx
            .select({
              academicYear: schoolSettings.academicYear,
              registrationOpen: schoolSettings.registrationOpen,
              documentRequirements: schoolSettings.documentRequirements,
            })
            .from(schoolSettings)
            .where(eq(schoolSettings.id, 1))
            .limit(1)
            .for("update");
          if (!settings)
            throw new AppError(
              "Pengaturan PPDB belum tersedia di server.",
              503,
              "SERVICE_UNAVAILABLE",
            );
          if (!settings.registrationOpen)
            throw new ForbiddenError("Pendaftaran PPDB sedang ditutup.");

          validateRequirements(
            settings.documentRequirements.requiredKinds,
            settings.documentRequirements.requireOneGraduationDocument,
            files,
          );

          const selections = normalizeSelections(
            data.extracurriculars ?? [],
          );
          const activeClubs = selections.length
            ? await tx
                .select({ id: clubs.id, name: clubs.name })
                .from(clubs)
                .where(
                  and(
                    eq(clubs.active, true),
                    inArray(
                      sql`lower(btrim(${clubs.name}))`,
                      selections.map((name) =>
                        name.toLocaleLowerCase("id-ID"),
                      ),
                    ),
                  ),
                )
            : [];
          const clubByName = new Map(
            activeClubs.map((club) => [
              club.name.trim().toLocaleLowerCase("id-ID"),
              club,
            ]),
          );
          const choices = selections.map((name) => {
            const club = clubByName.get(name.toLocaleLowerCase("id-ID"));
            if (!club)
              throw new AppError(
                "Pilihan ekstrakurikuler tidak tersedia.",
                422,
                "VALIDATION_ERROR",
                { extracurriculars: [name] },
              );
            return club;
          });

          const [application] = await tx
            .insert(applications)
            .values({
              schemaVersion: 2,
              studentName: data.studentName,
              nisn: data.nisn,
              originSchool: data.originSchool,
              birthPlace: data.birthPlace,
              birthDate: new Date(`${data.birthDate}T00:00:00.000Z`),
              gender: data.gender,
              address: data.address,
              parentName: data.parentName,
              parentOccupation: data.parentOccupation || null,
              phone: data.phone,
              email: data.email,
              academicYear: settings.academicYear,
              documentRequirements: settings.documentRequirements,
              status: "verification",
              source: "website",
            })
            .returning({
              id: applications.id,
              registrationNumber: applications.registrationNumber,
              submittedAt: applications.submittedAt,
            });
          if (!application)
            throw new AppError(
              "Pendaftaran belum dapat disimpan.",
              503,
              "SERVICE_UNAVAILABLE",
            );

          if (choices.length) {
            await tx.insert(applicationChoices).values(
              choices.map((club, sortOrder) => ({
                applicationId: application.id,
                clubId: club.id,
                nameSnapshot: club.name,
                sortOrder,
              })),
            );
          }

          for (const file of files) {
            const storageKey = await documentStore.write(file);
            storedKeys.push(storageKey);
            const [slot] = await tx
              .insert(applicationDocumentSlots)
              .values({
                applicationId: application.id,
                kind: file.kind,
              })
              .returning({ id: applicationDocumentSlots.id });
            if (!slot)
              throw new AppError(
                "Metadata berkas belum dapat disimpan.",
                503,
                "SERVICE_UNAVAILABLE",
              );
            const [document] = await tx
              .insert(applicationDocuments)
              .values({
                applicationId: application.id,
                slotId: slot.id,
                documentType: file.kind,
                originalName: file.originalName,
                storageKey,
                mimeType: file.mimeType,
                fileSize: file.content.byteLength,
                status: "uploaded",
              })
              .returning({ id: applicationDocuments.id });
            if (!document)
              throw new AppError(
                "Metadata berkas belum dapat disimpan.",
                503,
                "SERVICE_UNAVAILABLE",
              );
            await tx
              .update(applicationDocumentSlots)
              .set({
                currentVersionId: document.id,
                status: "pending",
              })
              .where(eq(applicationDocumentSlots.id, slot.id));
          }

          await tx.insert(applicationStatusHistory).values({
            applicationId: application.id,
            fromStatus: null,
            toStatus: "verification",
            reason: "Pendaftaran dikirim melalui website.",
          });

          const receipt: ApplicationReceipt = {
            id: application.registrationNumber,
            status: "Verifikasi",
            submittedAt: application.submittedAt.toISOString(),
          };
          await tx
            .update(submissionRequests)
            .set({
              applicationId: application.id,
              state: "completed",
              receipt,
            })
            .where(eq(submissionRequests.key, idempotencyKey));
          return receipt;
        });
      } catch (error) {
        await Promise.all(storedKeys.map((key) => documentStore.remove(key)));
        if (isUniqueViolation(error))
          throw new ConflictError(
            "Pendaftar atau berkas yang sama sudah tercatat.",
          );
        throw error;
      }
    },
  };
}

export type ApplicationSubmissionRepository = ReturnType<
  typeof createApplicationSubmissionRepository
>;
