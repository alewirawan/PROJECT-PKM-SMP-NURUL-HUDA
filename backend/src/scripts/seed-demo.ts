import { createDatabase } from "../db/client.js";
import { seedDemo } from "../db/seed-demo.js";

async function main() {
  if (
    process.env.NODE_ENV === "production" ||
    !process.argv.includes("--confirm-demo")
  ) {
    throw new Error(
      "Seed hanya untuk development. Gunakan --confirm-demo; tidak tersedia di production.",
    );
  }
  const url = process.env.DATABASE_URL;
  if (
    !url ||
    !["localhost", "127.0.0.1", "[::1]", "postgres"].includes(
      new URL(url).hostname,
    )
  ) {
    throw new Error("Gunakan DATABASE_URL PostgreSQL lokal untuk seed demo.");
  }
  const { db, client } = createDatabase(url);
  try {
    await seedDemo(db);
    console.log(
      "Data contoh ditambahkan tanpa menimpa data yang sudah ada. PPDB tidak dibuka otomatis.",
    );
  } finally {
    await client.end();
  }
}
main().catch(() => {
  console.error(
    "Seed gagal. Periksa konfigurasi lokal, flag --confirm-demo, dan jalankan migration terlebih dahulu. Tidak ada credential yang ditampilkan.",
  );
  process.exitCode = 1;
});
