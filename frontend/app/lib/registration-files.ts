import type { StudentDocument } from "./cms/types";

// Files stay in memory only. No upload request, base64 storage, or persistent URL.
const files = new Map<string, File>();
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export function validateDemoFile(file: Pick<File, "name" | "size" | "type">) {
  if (!file.size) return "File kosong. Pilih berkas lain.";
  if (file.size > MAX_DOCUMENT_BYTES) return "Ukuran maksimal 5 MB per berkas.";
  const extensions: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
  };
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!extensions[ext] || (file.type && file.type !== extensions[ext]))
    return "Gunakan PDF, JPG, atau PNG yang sesuai.";
  return "";
}
export function retainDemoFiles(
  id: string,
  selected: Partial<Record<StudentDocument["key"], File>>,
) {
  Object.entries(selected).forEach(([key, file]) => {
    if (file) files.set(id + ":" + key, file);
  });
}
export const getDemoFile = (id: string, key: StudentDocument["key"]) =>
  files.get(id + ":" + key);
export const clearDemoFiles = () => files.clear();
