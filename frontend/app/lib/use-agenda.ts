"use client";
import { listAgenda } from "./api/agenda";
import { useContentList } from "./use-content-list";

export function useAgenda(admin = false, enabled = true) {
  const { items: agenda, ...state } = useContentList(
    listAgenda,
    admin,
    enabled,
  );
  return { agenda, ...state };
}
