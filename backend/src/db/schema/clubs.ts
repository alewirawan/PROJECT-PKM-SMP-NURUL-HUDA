import { sql } from "drizzle-orm";
import { boolean, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const clubs = pgTable(
  "clubs",
  {
    id: varchar("id", { length: 120 }).primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    description: varchar("description", { length: 300 }).notNull(),
    active: boolean("active").notNull(),
  },
  (table) => [
    uniqueIndex("clubs_name_unique").on(sql`lower(btrim(${table.name}))`),
  ],
);
