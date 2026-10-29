import { is } from "drizzle-orm";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";
import { createDatabase } from "../db/client.js";
import * as schema from "../db/schema/index.js";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL wajib diisi.");
  const { client } = createDatabase(process.env.DATABASE_URL);
  try {
    const existing = await client<
      { table_name: string; column_name: string }[]
    >`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`;
    const missing: string[] = [];
    const tables = Object.values(schema)
      .filter((value) => is(value, PgTable))
      .map((value) => getTableConfig(value));
    for (const table of tables) {
      for (const column of table.columns) {
        if (
          !existing.some(
            (row) =>
              row.table_name === table.name && row.column_name === column.name,
          )
        )
          missing.push(`${table.name}.${column.name}`);
      }
    }
    if (missing.length) {
      console.error("Tabel/kolom belum tersedia:", missing.join(", "));
      process.exitCode = 1;
      return;
    }
    const [helpers] = await client<
      { count: number }[]
    >`SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname IN ('nh_valid_document_requirements', 'nh_valid_paragraphs', 'nh_guard_application', 'nh_guard_document_version', 'nh_guard_document_slot', 'nh_append_only')`;
    if (helpers?.count !== 6)
      throw new Error("Helper migration belum lengkap.");
    console.log(
      `${tables.length} tabel dan seluruh kolom schema tersedia. Helper migration tersedia; pemeriksaan ini tidak menggantikan tes constraint dan workflow.`,
    );
  } finally {
    await client.end();
  }
}
main().catch(() => {
  console.error(
    "Verifikasi gagal. Periksa koneksi dan jalankan db:migrate; credential tidak ditampilkan.",
  );
  process.exitCode = 1;
});
