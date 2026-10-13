import { KEYS, readJson, writeJson } from "./storage";
import type { ContactMessage, NewsletterSubscription } from "./types";

export function getMessages() {
  return readJson<ContactMessage[]>(KEYS.messages, []).sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt),
  );
}
export function saveMessages(value: ContactMessage[]) {
  writeJson(KEYS.messages, value);
}
export function addMessage(value: ContactMessage) {
  saveMessages([value, ...getMessages()]);
}

export function getNewsletterSubscriptions() {
  return readJson<NewsletterSubscription[]>(KEYS.newsletter, []);
}
export function addNewsletterSubscription(value: NewsletterSubscription) {
  const current = getNewsletterSubscriptions();
  if (
    !current.some(
      (item) => item.email.toLowerCase() === value.email.toLowerCase(),
    )
  )
    writeJson(KEYS.newsletter, [value, ...current]);
}
