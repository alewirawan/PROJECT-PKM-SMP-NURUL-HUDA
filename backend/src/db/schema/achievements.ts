import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./common.js";

export const achievementLevel = pgEnum("achievement_level", [
  "Sekolah",
  "Kecamatan",
  "Kabupaten",
  "Kota",
  "Provinsi",
  "Nasional",
]);
export const achievementCategory = pgEnum("achievement_category", [
  "Akademik",
  "Olahraga",
  "Seni",
  "Literasi",
  "Keagamaan",
]);
export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 120 }).notNull(),
    award: varchar("award", { length: 120 }).notNull(),
    level: achievementLevel("level").notNull(),
    year: varchar("year", { length: 4 }).notNull(),
    category: achievementCategory("category").notNull(),
    description: varchar("description", { length: 600 }).notNull(),
    image: varchar("image", { length: 500 }).notNull(),
    published: boolean("published").notNull().default(false),
    ...timestamps(),
  },
  (table) => [
    check("achievements_year_ck", sql`${table.year} ~ '^[0-9]{4}$'`),
    check(
      "achievements_text_ck",
      sql`length(btrim(${table.title})) > 0 AND length(btrim(${table.award})) > 0 AND length(btrim(${table.description})) > 0`,
    ),
    index("achievements_public_filter_idx").on(
      table.published,
      table.year,
      table.category,
    ),
  ],
);
