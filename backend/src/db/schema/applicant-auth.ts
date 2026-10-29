import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { applications } from "./applications.js";
import { admins } from "./auth.js";
import { timestamps } from "./common.js";

export const applicantAccounts = pgTable(
  "applicant_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .unique()
      .references(() => applications.id, { onDelete: "restrict" }),
    passwordHash: varchar("password_hash", { length: 255 }),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    check(
      "applicant_accounts_activation_ck",
      sql`${table.activatedAt} IS NULL OR ${table.passwordHash} IS NOT NULL`,
    ),
  ],
);

export const applicantSessions = pgTable(
  "applicant_sessions",
  {
    tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => applicantAccounts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      "applicant_sessions_hash_ck",
      sql`${table.tokenHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "applicant_sessions_expiry_ck",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    index("applicant_sessions_account_idx").on(table.accountId),
    index("applicant_sessions_expiry_idx").on(table.expiresAt),
  ],
);

export const applicantTokenPurpose = pgEnum("applicant_token_purpose", [
  "activation",
  "recovery",
]);
export const applicantAccessTokens = pgTable(
  "applicant_access_tokens",
  {
    tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => applicantAccounts.id, { onDelete: "cascade" }),
    purpose: applicantTokenPurpose("purpose").notNull(),
    issuedBy: uuid("issued_by").references(() => admins.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "applicant_tokens_hash_ck",
      sql`${table.tokenHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "applicant_tokens_expiry_ck",
      sql`${table.expiresAt} > ${table.createdAt} AND (${table.consumedAt} IS NULL OR ${table.consumedAt} >= ${table.createdAt})`,
    ),
    index("applicant_tokens_account_idx").on(table.accountId, table.purpose),
    index("applicant_tokens_expiry_idx").on(table.expiresAt),
  ],
);
