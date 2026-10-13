import { emitKeypressEvents } from "node:readline";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { loadConfig } from "../config/env.js";
import { createDatabase } from "../db/client.js";
import { admins } from "../db/schema/index.js";

const inputSchema = z.object({
  email: z
    .string()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(2).max(120),
  role: z.enum(["super_admin", "admin_ppdb", "editor"]),
  password: z.string().min(12).max(128),
});

function askSecret(prompt: string): Promise<string> {
  if (!stdin.isTTY || !stdin.setRawMode) {
    throw new Error(
      "Pembuatan admin harus dijalankan dari terminal interaktif.",
    );
  }
  stdout.write(prompt);
  emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();

  return new Promise((resolve, reject) => {
    let value = "";
    const onKeypress = (
      character: string,
      key: { name?: string; ctrl?: boolean },
    ) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("Pembuatan admin dibatalkan."));
        return;
      }
      if (key.name === "return") {
        cleanup();
        stdout.write("\n");
        resolve(value);
        return;
      }
      if (key.name === "backspace") {
        value = value.slice(0, -1);
        return;
      }
      if (character && !key.ctrl) value += character;
    };
    const cleanup = () => {
      stdin.off("keypress", onKeypress);
      stdin.setRawMode(false);
      stdin.pause();
    };
    stdin.on("keypress", onKeypress);
  });
}

const config = loadConfig();
const prompt = createInterface({ input: stdin, output: stdout });

try {
  const email = await prompt.question("Email admin: ");
  const displayName = await prompt.question("Nama admin: ");
  const roleInput = await prompt.question(
    "Role [super_admin/admin_ppdb/editor] (super_admin): ",
  );
  prompt.close();
  const password = await askSecret("Password minimal 12 karakter: ");
  const confirmation = await askSecret("Ulangi password: ");
  if (password !== confirmation)
    throw new Error("Konfirmasi password tidak sama.");

  const input = inputSchema.parse({
    email,
    displayName,
    role: roleInput || "super_admin",
    password,
  });
  const { client, db } = createDatabase(config.DATABASE_URL);
  try {
    const existing = await db.query.admins.findFirst({
      where: eq(admins.email, input.email),
    });
    if (existing) throw new Error("Email admin sudah terdaftar.");
    await db.insert(admins).values({
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      passwordHash: await hash(input.password),
    });
    stdout.write(`Admin ${input.email} berhasil dibuat.\n`);
  } finally {
    await client.end();
  }
} catch (error) {
  prompt.close();
  const message =
    error instanceof Error ? error.message : "Pembuatan admin gagal.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
