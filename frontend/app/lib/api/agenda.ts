import { hasBackendApi, requestApi } from "../api-client";
import { getAgenda, saveAgenda } from "../cms/agenda";
import type { Agenda } from "../cms/types";

export type AgendaInput = Omit<Agenda, "id">;
export async function listAgenda(admin = false): Promise<Agenda[]> {
  if (hasBackendApi()) return requestApi(admin ? "/admin/agenda" : "/agenda");
  return getAgenda().filter((item) => admin || item.visibility === "Publik");
}
export async function saveAgendaItem(
  input: AgendaInput,
  id?: string,
): Promise<Agenda> {
  if (hasBackendApi())
    return requestApi(id ? `/agenda/${encodeURIComponent(id)}` : "/agenda", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(input),
    });
  const items = getAgenda();
  if (id && !items.some((item) => item.id === id))
    throw new Error("Agenda tidak ditemukan. Muat ulang daftar.");
  const record = { ...input, id: id ?? crypto.randomUUID() };
  saveAgenda(
    id
      ? items.map((item) => (item.id === id ? record : item))
      : [...items, record],
  );
  return record;
}
export async function deleteAgendaItem(id: string): Promise<void> {
  if (hasBackendApi())
    return requestApi(`/agenda/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  saveAgenda(getAgenda().filter((item) => item.id !== id));
}
