import { clearDemoFiles } from "../registration-files";
export const KEYS = {
  posts: "arunika_cms_posts",
  applications: "arunika_applications",
  agenda: "arunika_agenda",
  messages: "arunika_messages",
  newsletter: "arunika_newsletter",
  settings: "arunika_settings",
  directory: "nurul_huda_school_directory",
  achievements: "nurul_huda_achievements",
  clubs: "nurul_huda_clubs",
} as const;

export const CMS_EVENT = "arunika:cms-update";

export function canUseStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined" &&
    typeof window.sessionStorage !== "undefined"
  );
}

function storageFor(key: string) {
  // Data pribadi pada mockup hanya bertahan selama tab browser dibuka.
  // Backend produksi wajib menyimpan data ini di database terenkripsi dengan kontrol akses.
  const sensitiveKeys: string[] = [
    KEYS.applications,
    KEYS.messages,
    KEYS.newsletter,
  ];
  return sensitiveKeys.includes(key)
    ? window.sessionStorage
    : window.localStorage;
}

export function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const value = storageFor(key).getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  storageFor(key).setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(CMS_EVENT, { detail: { key } }));
}

export function listenCmsUpdates(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const listener = () => callback();
  window.addEventListener(CMS_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CMS_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function resetLocalDemoData() {
  clearDemoFiles();
  if (!canUseStorage()) return;
  Object.values(KEYS).forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
  window.dispatchEvent(new CustomEvent(CMS_EVENT, { detail: { key: "all" } }));
}
