import { hasBackendApi, requestApi } from "../api-client";
import { getClubs, saveClubs, type Club } from "../cms/catalog";

export type ClubInput = Omit<Club, "id">;
export async function listClubs(admin = false): Promise<Club[]> {
  if (hasBackendApi()) return requestApi(admin ? "/admin/clubs" : "/clubs");
  return getClubs().filter((club) => admin || club.active);
}
export async function saveClub(input: ClubInput, id?: string): Promise<Club> {
  if (hasBackendApi())
    return requestApi(id ? `/clubs/${encodeURIComponent(id)}` : "/clubs", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(input),
    });
  const items = getClubs();
  if (id && !items.some((club) => club.id === id))
    throw new Error("Kegiatan tidak ditemukan. Muat ulang daftar.");
  if (
    items.some(
      (club) =>
        club.id !== id &&
        club.name.trim().toLowerCase() === input.name.trim().toLowerCase(),
    )
  ) {
    throw new Error("Nama ekstrakurikuler sudah digunakan.");
  }
  const record = { ...input, id: id ?? crypto.randomUUID() };
  saveClubs(
    id
      ? items.map((club) => (club.id === id ? record : club))
      : [...items, record],
  );
  return record;
}
