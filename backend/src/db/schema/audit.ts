import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { admins } from "./auth.js";
import { applicantAccounts } from "./applicant-auth.js";

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id").references(() => admins.id, {
      onDelete: "restrict",
    }),
    applicantAccountId: uuid("applicant_account_id").references(
      () => applicantAccounts.id,
      { onDelete: "restrict" },
    ),
    action: varchar("action", { length: 80 }).notNull(),
    resourceType: varchar("resource_type", { length: 80 }).notNull(),
    resourceId: varchar("resource_id", { length: 120 }),
    requestId: varchar("request_id", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "audit_events_actor_ck",
      sql`${table.adminId} IS NULL OR ${table.applicantAccountId} IS NULL`,
    ),
    check(
      "audit_events_action_ck",
      sql`length(btrim(${table.action})) > 0 AND length(btrim(${table.resourceType})) > 0`,
    ),
    index("audit_events_resource_idx").on(
      table.resourceType,
      table.resourceId,
      table.createdAt,
    ),
    index("audit_events_admin_idx").on(table.adminId, table.createdAt),
    index("audit_events_applicant_idx").on(
      table.applicantAccountId,
      table.createdAt,
    ),
  ],
);
