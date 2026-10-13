import { posts } from "../../data";
import { KEYS, readJson, writeJson } from "./storage";
import type { CmsPost } from "./types";

const seedDates = [
  "2026-09-12T08:00:00.000Z",
  "2026-09-05T08:00:00.000Z",
  "2026-08-28T08:00:00.000Z",
  "2026-08-20T08:00:00.000Z",
];

export const seedCmsPosts: CmsPost[] = posts.map((post, index) => ({
  ...post,
  id: `post-${post.slug}`,
  status: "Terbit",
  author: index === 0 ? "Nadia Prameswari" : "Tim Komunikasi Nurul Huda",
  updatedAt: seedDates[index] ?? seedDates[0],
}));

export function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "artikel-baru"
  );
}

export function parseArticleContent(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function articleContentToText(content: string[]) {
  return content.join("\n\n");
}

export function estimateReadTime(content: string[]) {
  const words = content.join(" ").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 180))} menit`;
}

export function formatIndonesianDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function migratePostBrand(post: CmsPost): CmsPost {
  const rename = (value: string) =>
    value
      .replaceAll("SMA Arunika Nusantara", "SMP Nurul Huda")
      .replaceAll("Arunika", "Nurul Huda")
      .replaceAll("beasiswa-arunika", "beasiswa-nurul-huda");
  return {
    ...post,
    slug: rename(post.slug),
    title: rename(post.title),
    excerpt: rename(post.excerpt),
    content: post.content.map(rename),
    author: rename(post.author),
  };
}

export function getBlogPosts(includeDrafts = false) {
  const stored = readJson<CmsPost[] | null>(KEYS.posts, null);
  const source = stored !== null ? stored.map(migratePostBrand) : seedCmsPosts;
  return source
    .filter((post) => includeDrafts || post.status === "Terbit")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveBlogPosts(value: CmsPost[]) {
  writeJson(KEYS.posts, value);
}

export function upsertBlogPost(post: CmsPost) {
  const current = getBlogPosts(true);
  const existingIndex = current.findIndex((item) => item.id === post.id);
  const next =
    existingIndex >= 0
      ? current.map((item) => (item.id === post.id ? post : item))
      : [post, ...current];
  saveBlogPosts(next);
  return next;
}

export function deleteBlogPost(id: string) {
  const next = getBlogPosts(true).filter((post) => post.id !== id);
  saveBlogPosts(next);
  return next;
}
