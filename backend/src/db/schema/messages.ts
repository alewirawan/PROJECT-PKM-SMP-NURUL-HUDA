import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./common.js";

export const messageStatus = pgEnum("message_status", [
  "Baru",
  "Dibaca",
  "Selesai",
]);
export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    topic: varchar("topic", { length: 120 }).notNull(),
    message: varchar("message", { length: 3000 }).notNull(),
    status: messageStatus("status").notNull().default("Baru"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      "contact_messages_text_ck",
      sql`length(btrim(${table.name})) >= 2 AND length(btrim(${table.topic})) >= 2 AND length(btrim(${table.message})) >= 10`,
    ),
    index("contact_messages_status_date_idx").on(
      table.status,
      table.submittedAt,
    ),
  ],
);

export const newsletterSubscriptions = pgTable(
  "newsletter_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 254 }).notNull(),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("newsletter_email_uq").on(sql`lower(btrim(${table.email}))`),
  ],
);
