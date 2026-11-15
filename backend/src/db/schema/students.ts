import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { applications } from "./applications.js";
import { admins } from "./auth.js";
import { timestamps } from "./common.js";

export const studentStatus = pgEnum("student_status", ["active", "inactive"]);
export const reEnrollmentStatus = pgEnum("re_enrollment_status", [
  "pending",
  "completed",
]);

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id").references(() => applications.id, {
      onDelete: "restrict",
    }),
    studentName: varchar("student_name", { length: 160 }).notNull(),
    nisn: varchar("nisn", { length: 10 }),
    birthPlace: varchar("birth_place", { length: 100 }),
    birthDate: date("birth_date", { mode: "date" }),
    gender: varchar("gender", { length: 20 }),
    address: text("address"),
    officiallyRegisteredAt: timestamp("officially_registered_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    status: studentStatus("status").notNull().default("active"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("students_application_id_uq").on(table.applicationId),
    uniqueIndex("students_nisn_uq")
      .on(table.nisn)
      .where(sql`${table.nisn} IS NOT NULL`),
    index("students_student_name_idx").on(table.studentName),
    check(
      "students_name_ck",
      sql`length(btrim(${table.studentName})) BETWEEN 2 AND 120`,
    ),
    check(
      "students_nisn_ck",
      sql`${table.nisn} IS NULL OR ${table.nisn} ~ '^[0-9]{10}$'`,
    ),
    check(
      "students_gender_ck",
      sql`${table.gender} IS NULL OR ${table.gender} IN ('Laki-laki', 'Perempuan')`,
    ),
  ],
);

export const applicationReEnrollments = pgTable(
  "application_re_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "restrict" }),
    status: reEnrollmentStatus("status").notNull().default("pending"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    confirmedBy: uuid("confirmed_by").references(() => admins.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("application_re_enrollments_application_id_uq").on(
      table.applicationId,
    ),
    index("application_re_enrollments_status_idx").on(table.status),
    check(
      "application_re_enrollments_confirmation_ck",
      sql`(${table.status} = 'completed' AND ${table.confirmedAt} IS NOT NULL) OR (${table.status} = 'pending' AND ${table.confirmedAt} IS NULL)`,
    ),
  ],
);

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type ApplicationReEnrollment =
  typeof applicationReEnrollments.$inferSelect;
