import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { PublicApplicationFile } from "./public-application.schema.js";

export type PublicDocumentStore = {
  write(file: PublicApplicationFile): Promise<string>;
  remove(storageKey: string): Promise<void>;
};

function extensionFor(file: PublicApplicationFile) {
  switch (file.mimeType) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
  }
}

export function createPublicDocumentStore(uploadDir: string): PublicDocumentStore {
  const root = resolve(uploadDir);
  const applicationDir = resolve(root, "applications");

  return {
    async write(file) {
      await mkdir(applicationDir, { recursive: true, mode: 0o700 });
      const storageKey = `applications/${randomUUID()}.${extensionFor(file)}`;
      const destination = resolve(root, storageKey);
      if (!destination.startsWith(applicationDir))
        throw new Error("Lokasi penyimpanan berkas tidak valid.");
      await writeFile(destination, file.content, { flag: "wx", mode: 0o600 });
      return storageKey;
    },
    async remove(storageKey) {
      const destination = resolve(root, storageKey);
      if (!destination.startsWith(applicationDir))
        throw new Error("Lokasi penghapusan berkas tidak valid.");
      try {
        await unlink(destination);
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return;
        }
        throw error;
      }
    },
  };
}

export function safeOriginalName(filename: string) {
  const leaf = filename.replace(/\\/g, "/").split("/").pop() ?? "";
  const safe = Array.from(leaf)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .trim();
  return safe.slice(0, 255);
}

export function sniffDocumentMimeType(
  content: Buffer,
): PublicApplicationFile["mimeType"] | null {
  if (
    content.length >= 5 &&
    content.subarray(0, 5).toString("ascii") === "%PDF-"
  ) {
    return "application/pdf";
  }
  if (
    content.length >= 3 &&
    content[0] === 0xff &&
    content[1] === 0xd8 &&
    content[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    content.length >= 8 &&
    content.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return "image/png";
  }
  return null;
}
