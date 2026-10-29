"use client";
import { listClubs } from "./api/clubs";
import { useContentList } from "./use-content-list";

export function useClubs(admin = false) {
  const { items: clubs, ...state } = useContentList(listClubs, admin);
  return { clubs, ...state };
}
