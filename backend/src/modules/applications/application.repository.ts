import {
  and,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  isNotNull,
  lt,
  not,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { Database } from "../../db/client.js";
import {
  applicationChoices,
  applications,
} from "../../db/schema/applications.js";
import { applicationDocumentSlots } from "../../db/schema/documents.js";
import { applicationReEnrollments } from "../../db/schema/students.js";
import type { ApplicationListQuery } from "./application.schema.js";
import { encodeApplicationCursor } from "./application.schema.js";

const statusToDatabase = {
  Verifikasi: "verification",
  Terverifikasi: "verified",
  Wawancara: "interview",
  Diterima: "accepted",
  Ditolak: "rejected",
} as const;

const sourceToDatabase = {
  Website: "website",
  Offline: "offline",
} as const;

const requiredDocumentKinds = ["skl", "ijazah", "kk", "ktp", "akta"] as const;

function hasQualifyingDocument(
  db: Database,
  kind: (typeof requiredDocumentKinds)[number],
) {
  return exists(
    db
      .select({ id: applicationDocumentSlots.id })
      .from(applicationDocumentSlots)
      .where(
        and(
          eq(applicationDocumentSlots.applicationId, applications.id),
          eq(applicationDocumentSlots.kind, kind),
          inArray(applicationDocumentSlots.status, ["pending", "verified"]),
          or(
            isNotNull(applicationDocumentSlots.currentVersionId),
            eq(applicationDocumentSlots.receivedPhysically, true),
          ),
        ),
      ),
  );
}

function missingRequiredDocuments(db: Database): SQL {
  const requirements = sql`coalesce(
    ${applications.documentRequirements},
    '{"requiredKinds":[],"requireOneGraduationDocument":false}'::jsonb
  )`;
  const missingKinds = requiredDocumentKinds.map((kind) =>
    and(
      sql`${requirements}->'requiredKinds' @> ${JSON.stringify([kind])}::jsonb`,
      not(hasQualifyingDocument(db, kind)),
    ),
  );
  const graduationMissing = and(
    sql`${requirements}->>'requireOneGraduationDocument' = 'true'`,
    not(
      or(
        hasQualifyingDocument(db, "skl"),
        hasQualifyingDocument(db, "ijazah"),
      )!,
    ),
  );
  return or(...missingKinds, graduationMissing)!;
}

export function createApplicationsRepository(db: Database) {
  return {
    async list(query: ApplicationListQuery) {
      const conditions: SQL[] = [];
      if (query.q) {
        const pattern = `%${query.q}%`;
        conditions.push(
          or(
            ilike(applications.studentName, pattern),
            ilike(applications.registrationNumber, pattern),
            ilike(applications.nisn, pattern),
            ilike(applications.originSchool, pattern),
            ilike(applications.parentName, pattern),
          )!,
        );
      }
      if (query.source)
        conditions.push(
          eq(applications.source, sourceToDatabase[query.source]),
        );
      if (query.status)
        conditions.push(
          eq(applications.status, statusToDatabase[query.status]),
        );
      if (query.cursor) {
        conditions.push(
          or(
            sql`${applications.submittedAt} < ${query.cursor.submittedAt}::timestamptz`,
            and(
              sql`${applications.submittedAt} = ${query.cursor.submittedAt}::timestamptz`,
              lt(
                applications.registrationNumber,
                query.cursor.registrationNumber,
              ),
            ),
          )!,
        );
      }
      if (query.documents) {
        const missing = missingRequiredDocuments(db);
        conditions.push(query.documents === "Lengkap" ? not(missing) : missing);
      }

      const rows = await db
        .select({
          id: applications.id,
          registrationNumber: applications.registrationNumber,
          schemaVersion: applications.schemaVersion,
          studentName: applications.studentName,
          nisn: applications.nisn,
          originSchool: applications.originSchool,
          birthPlace: applications.birthPlace,
          birthDate: applications.birthDate,
          gender: applications.gender,
          address: applications.address,
          parentName: applications.parentName,
          parentOccupation: applications.parentOccupation,
          phone: applications.phone,
          email: applications.email,
          documentRequirements: applications.documentRequirements,
          status: applications.status,
          source: applications.source,
          notes: applications.notes,
          submittedAt: applications.submittedAt,
          cursorSubmittedAt: sql<string>`to_char(
            ${applications.submittedAt} AT TIME ZONE 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          )`.as("cursor_submitted_at"),
        })
        .from(applications)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(
          desc(applications.submittedAt),
          desc(applications.registrationNumber),
        )
        .limit(query.limit + 1);

      const hasMore = rows.length > query.limit;
      const pageRows = rows.slice(0, query.limit);
      if (!pageRows.length) return { items: [], nextCursor: null };

      const applicationIds = pageRows.map((row) => row.id);
      const [choices, documentSlots, reEnrollments] = await Promise.all([
        db
          .select({
            applicationId: applicationChoices.applicationId,
            nameSnapshot: applicationChoices.nameSnapshot,
            sortOrder: applicationChoices.sortOrder,
            id: applicationChoices.id,
          })
          .from(applicationChoices)
          .where(inArray(applicationChoices.applicationId, applicationIds))
          .orderBy(
            applicationChoices.sortOrder,
            applicationChoices.selectedAt,
            applicationChoices.id,
          ),
        db.query.applicationDocumentSlots.findMany({
          where: inArray(
            applicationDocumentSlots.applicationId,
            applicationIds,
          ),
          columns: {
            id: true,
            applicationId: true,
            kind: true,
            status: true,
            receivedPhysically: true,
            reviewNote: true,
            reviewedAt: true,
          },
          with: {
            currentVersion: {
              columns: {
                originalName: true,
                mimeType: true,
                fileSize: true,
                uploadedAt: true,
              },
            },
          },
        }),
        db
          .select({
            applicationId: applicationReEnrollments.applicationId,
            status: applicationReEnrollments.status,
          })
          .from(applicationReEnrollments)
          .where(
            inArray(applicationReEnrollments.applicationId, applicationIds),
          ),
      ]);

      const choicesByApplication = new Map<string, typeof choices>();
      for (const choice of choices) {
        const group = choicesByApplication.get(choice.applicationId) ?? [];
        group.push(choice);
        choicesByApplication.set(choice.applicationId, group);
      }
      const slotsByApplication = new Map<string, typeof documentSlots>();
      for (const slot of documentSlots) {
        const group = slotsByApplication.get(slot.applicationId) ?? [];
        group.push(slot);
        slotsByApplication.set(slot.applicationId, group);
      }
      const reEnrollmentStatusByApplication = new Map(
        reEnrollments.map((row) => [row.applicationId, row.status]),
      );

      const items = pageRows.map((row) => ({
        ...row,
        reEnrollmentStatus:
          reEnrollmentStatusByApplication.get(row.id) ?? null,
        extracurriculars: (choicesByApplication.get(row.id) ?? []).map(
          (choice) => choice.nameSnapshot,
        ),
        documents: slotsByApplication.get(row.id) ?? [],
      }));
      const last = pageRows[pageRows.length - 1]!;
      return {
        items,
        nextCursor: hasMore
          ? encodeApplicationCursor({
              submittedAt: last.cursorSubmittedAt,
              registrationNumber: last.registrationNumber,
            })
          : null,
      };
    },
  };
}

export type ApplicationsRepository = ReturnType<
  typeof createApplicationsRepository
>;
export type ApplicationListRecord = Awaited<
  ReturnType<ApplicationsRepository["list"]>
>["items"][number];
