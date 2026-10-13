export type AdminView =
  | "dashboard"
  | "applications"
  | "students"
  | "directory"
  | "achievements"
  | "clubs"
  | "posts"
  | "agenda"
  | "messages"
  | "settings";

export type AdminToast = {
  message: string;
  tone?: "success" | "warning";
} | null;

export type AdminNotify = (
  message: string,
  tone?: "success" | "warning",
) => void;
