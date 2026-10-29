import {
  boolean,
  date,
  index,
  pgEnum,
  pgTable,
  varchar,
} from "drizzle-orm/pg-core";

export const agendaType = pgEnum("agenda_type", [
  "Akademik",
  "PPDB",
  "Kegiatan",
  "Rapat",
]);
export const agendaVisibility = pgEnum("agenda_visibility", [
  "Publik",
  "Internal",
]);
export const agenda = pgTable(
  "agenda",
  {
    id: varchar("id", { length: 120 }).primaryKey(),
    title: varchar("title", { length: 160 }).notNull(),
    date: date("date", { mode: "string" }).notNull(),
    time: varchar("time", { length: 5 }).notNull(),
    location: varchar("location", { length: 160 }).notNull(),
    type: agendaType("type").notNull(),
    completed: boolean("completed").notNull(),
    visibility: agendaVisibility("visibility").notNull().default("Internal"),
  },
  (table) => [
    index("agenda_visibility_date_idx").on(table.visibility, table.date),
  ],
);
