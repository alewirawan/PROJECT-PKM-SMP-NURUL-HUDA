import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { admissionPeriods } from "./settings.js";
import { admins } from "./auth.js";
import { clubs } from "./clubs.js";
import type { DocumentRequirements } from "./common.js";

export const applicationStatus = pgEnum("application_status", [
  "verification",
  "verified",
  "interview",
  "accepted",
  "rejected",
]);
export const registrationSource = pgEnum("registration_source", [
  "website",
  "offline",
]);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registrationNumber: varchar("registration_number", { length: 64 })
      .notNull()
      .default(sql`'NH-' || upper(replace(gen_random_uuid()::text, '-', ''))`),
    studentName: varchar("student_name", { length: 160 }).notNull(),
    nisn: varchar("nisn", { length: 10 }),
    originSchool: varchar("origin_school", { length: 180 }).notNull(),
    birthPlace: varchar("birth_place", { length: 100 }),
    birthDate: date("birth_date", { mode: "date" }),
    gender: varchar("gender", { length: 20 }),
    address: text("address"),
    parentName: varchar("parent_name", { length: 160 }),
    parentOccupation: varchar("parent_occupation", { length: 120 }),
    phone: varchar("phone", { length: 30 }),
    email: varchar("email", { length: 254 }),
    program: varchar("program", { length: 120 }),
    academicYear: varchar("academic_year", { length: 9 }).references(
      () => admissionPeriods.academicYear,
      { onDelete: "restrict" },
    ),
    documentRequirements: jsonb(
      "document_requirements",
    ).$type<DocumentRequirements>(),
    schemaVersion: integer("schema_version").notNull().default(2),
    status: applicationStatus("status").notNull().default("verification"),
    source: registrationSource("source").notNull().default("website"),
    notes: text("notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("applications_registration_number_uq").on(
      table.registrationNumber,
    ),
    index("applications_student_name_idx").on(table.studentName),
    index("applications_nisn_idx").on(table.nisn),
    index("applications_status_idx").on(table.status),
    index("applications_submitted_idx").on(table.submittedAt),
    index("applications_period_status_cursor_idx").on(
      table.academicYear,
      table.status,
      table.submittedAt,
      table.id,
    ),
    index("applications_source_cursor_idx").on(
      table.source,
      table.submittedAt,
      table.id,
    ),
    check(
      "applications_schema_version_ck",
      sql`${table.schemaVersion} IN (1, 2)`,
    ),
    check(
      "applications_v2_required_ck",
      sql`${table.schemaVersion} = 1 OR (
    ${table.nisn} IS NOT NULL AND ${table.birthPlace} IS NOT NULL AND ${table.birthDate} IS NOT NULL
    AND ${table.gender} IS NOT NULL AND ${table.address} IS NOT NULL AND ${table.parentName} IS NOT NULL
    AND ${table.phone} IS NOT NULL AND ${table.email} IS NOT NULL AND ${table.academicYear} IS NOT NULL
    AND ${table.documentRequirements} IS NOT NULL)`,
    ),
    check(
      "applications_v2_values_ck",
      sql`${table.schemaVersion} = 1 OR (
    ${table.registrationNumber} ~ '^NH-[A-Z0-9-]+$' AND ${table.nisn} ~ '^[0-9]{10}$'
    AND length(btrim(${table.studentName})) BETWEEN 2 AND 120 AND length(btrim(${table.originSchool})) BETWEEN 2 AND 160
    AND length(btrim(${table.birthPlace})) BETWEEN 2 AND 100 AND ${table.gender} IN ('Laki-laki', 'Perempuan')
    AND length(btrim(${table.address})) BETWEEN 1 AND 600 AND length(btrim(${table.parentName})) BETWEEN 2 AND 120
    AND ${table.phone} ~ '^[+]?[0-9 ]{8,20}$' AND position('@' in ${table.email}) > 1
    AND (${table.notes} IS NULL OR length(${table.notes}) <= 1000)
    AND nh_valid_document_requirements(${table.documentRequirements}))`,
    ),
  ],
);

export const applicationChoices = pgTable(
  "application_choices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "restrict" }),
    clubId: varchar("club_id", { length: 120 }).references(() => clubs.id, {
      onDelete: "set null",
    }),
    nameSnapshot: varchar("name_snapshot", { length: 80 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    selectedAt: timestamp("selected_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("application_choices_name_uq").on(
      table.applicationId,
      sql`lower(btrim(${table.nameSnapshot}))`,
    ),
    check(
      "application_choices_name_ck",
      sql`length(btrim(${table.nameSnapshot})) > 0 AND lower(btrim(${table.nameSnapshot})) <> 'belum menentukan' AND ${table.sortOrder} >= 0`,
    ),
    index("application_choices_club_idx").on(table.clubId),
  ],
);

export const applicationStatusHistory = pgTable(
  "application_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "restrict" }),
    fromStatus: applicationStatus("from_status"),
    toStatus: applicationStatus("to_status").notNull(),
    changedBy: uuid("changed_by").references(() => admins.id, {
      onDelete: "set null",
    }),
    reason: varchar("reason", { length: 1000 }),
    changedAt: timestamp("changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("application_status_history_app_idx").on(
      table.applicationId,
      table.changedAt,
    ),
  ],
);

export const submissionRequests = pgTable(
  "submission_requests",
  {
    key: uuid("key").primaryKey(),
    payloadHash: varchar("payload_hash", { length: 64 }).notNull(),
    applicationId: uuid("application_id").references(() => applications.id, {
      onDelete: "restrict",
    }),
    state: varchar("state", { length: 16 }).notNull().default("processing"),
    receipt: jsonb("receipt").$type<{
      id: string;
      status: string;
      submittedAt: string;
    }>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      "submission_requests_hash_ck",
      sql`${table.payloadHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "submission_requests_state_ck",
      sql`(${table.state} = 'processing' AND ${table.applicationId} IS NULL AND ${table.receipt} IS NULL) OR (${table.state} = 'completed' AND ${table.applicationId} IS NOT NULL AND ${table.receipt} IS NOT NULL AND jsonb_typeof(${table.receipt}) = 'object')`,
    ),
    check(
      "submission_requests_expiry_ck",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    index("submission_requests_expiry_idx").on(table.expiresAt),
  ],
);

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
