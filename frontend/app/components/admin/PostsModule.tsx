"use client";

import Image from "next/image";
import Link from "next/link";
import { FileQuestion, PenLine, Search } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import {
  articleContentToText,
  deleteBlogPost,
  estimateReadTime,
  formatIndonesianDate,
  parseArticleContent,
  slugify,
  upsertBlogPost,
  type CmsPost,
} from "../../lib/local-cms";
import { AdminEmptyState, AdminPageHeader } from "./AdminUi";

type PostForm = {
  title: string;
  slug: string;
  category: string;
  date: string;
  image: string;
  excerpt: string;
  content: string;
  author: string;
  status: CmsPost["status"];
};
const blankPost: PostForm = {
  title: "",
  slug: "",
  category: "Pengumuman",
  date: "2026-09-18",
  image: "/images/campus.jpg",
  excerpt: "",
  content: "",
  author: "Tim Komunikasi Nurul Huda",
  status: "Draft",
};

export function PostsModule({
  posts,
  setPosts,
  preset,
  clearPreset,
  notify,
}: {
  posts: CmsPost[];
  setPosts: (value: CmsPost[]) => void;
  preset: string | null;
  clearPreset: () => void;
  notify: (message: string, tone?: "success" | "warning") => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(Boolean(preset));
  const [form, setForm] = useState<PostForm>({
    ...blankPost,
    category: preset ?? blankPost.category,
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  useEffect(() => {
    if (!preset) return;
    const timer = window.setTimeout(() => {
      setForm({ ...blankPost, category: preset });
      setEditorOpen(true);
      clearPreset();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [preset, clearPreset]);
  const filtered = posts.filter(
    (post) =>
      (statusFilter === "Semua" || post.status === statusFilter) &&
      post.title.toLowerCase().includes(query.toLowerCase()),
  );
  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "title" && !editing ? { slug: slugify(String(value)) } : {}),
    }));
  }
  function reset() {
    setEditing(null);
    setForm({ ...blankPost });
    setEditorOpen(false);
  }
  function edit(post: CmsPost) {
    setEditing(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      category: post.category,
      date: post.updatedAt.slice(0, 10),
      image: post.image,
      excerpt: post.excerpt,
      content: articleContentToText(post.content),
      author: post.author,
      status: post.status,
    });
    setEditorOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = parseArticleContent(form.content);
    let slug = slugify(form.slug || form.title);
    const conflict = posts.find(
      (post) => post.slug === slug && post.id !== editing,
    );
    if (conflict) slug = `${slug}-${String(Date.now()).slice(-4)}`;
    const post: CmsPost = {
      id: editing ?? `post-${Date.now()}`,
      title: form.title.trim(),
      slug,
      category: form.category,
      date: formatIndonesianDate(form.date),
      readTime: estimateReadTime(content),
      image: form.image,
      excerpt: form.excerpt.trim(),
      content,
      author: form.author.trim(),
      status: form.status,
      updatedAt: `${form.date}T12:00:00.000Z`,
    };
    const next = upsertBlogPost(post);
    setPosts(next);
    notify(
      post.status === "Terbit"
        ? "Artikel diterbitkan dan langsung tampil di website."
        : "Draft artikel berhasil disimpan.",
    );
    reset();
  }
  function remove(post: CmsPost) {
    if (!window.confirm(`Hapus artikel “${post.title}”?`)) return;
    setPosts(deleteBlogPost(post.id));
    notify("Artikel berhasil dihapus.", "warning");
  }
  function toggle(post: CmsPost) {
    const updated = {
      ...post,
      status: (post.status === "Terbit"
        ? "Draft"
        : "Terbit") as CmsPost["status"],
      updatedAt: new Date().toISOString(),
    };
    const next = upsertBlogPost(updated);
    setPosts(next);
    notify(
      updated.status === "Terbit"
        ? "Artikel dipublikasikan."
        : "Artikel dipindahkan ke draft.",
    );
  }
  return (
    <div className="admin-view">
      <AdminPageHeader
        eyebrow="Pengelolaan konten"
        title="Artikel & berita"
        description="Tulis sekali, lalu artikel otomatis mengikuti layout blog publik."
        action={
          <button
            className="button button-dark"
            onClick={() => {
              reset();
              setEditorOpen(true);
            }}
          >
            + Tulis artikel
          </button>
        }
      />
      {editorOpen && (
        <section className="post-editor-shell">
          <form className="post-editor" onSubmit={save}>
            <div className="editor-heading">
              <div>
                <p>{editing ? "Edit artikel" : "Artikel baru"}</p>
                <h2>
                  {editing ? "Perbarui cerita" : "Tulis cerita Nurul Huda"}
                </h2>
              </div>
              <button type="button" onClick={reset}>
                ×
              </button>
            </div>
            <div className="editor-grid">
              <label className="span-2">
                Judul artikel
                <input
                  required
                  value={form.title}
                  onChange={(event) => update("title", event.target.value)}
                  placeholder="Judul yang ringkas dan menarik"
                />
              </label>
              <label>
                Slug URL
                <input
                  required
                  value={form.slug}
                  onChange={(event) =>
                    update("slug", slugify(event.target.value))
                  }
                />
                <small>/blog/{form.slug || "judul-artikel"}</small>
              </label>
              <label>
                Kategori
                <select
                  value={form.category}
                  onChange={(event) => update("category", event.target.value)}
                >
                  <option>Akademik</option>
                  <option>Kegiatan</option>
                  <option>Fasilitas</option>
                  <option>Pengumuman</option>
                  <option>Prestasi</option>
                </select>
              </label>
              <label>
                Tanggal publikasi
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(event) => update("date", event.target.value)}
                />
              </label>
              <label>
                Penulis
                <input
                  required
                  value={form.author}
                  onChange={(event) => update("author", event.target.value)}
                />
              </label>
              <label className="span-2">
                Gambar sampul
                <select
                  value={form.image}
                  onChange={(event) => update("image", event.target.value)}
                >
                  <option value="/images/campus.jpg">Kampus Nurul Huda</option>
                  <option value="/images/hero-classroom.jpg">
                    Kegiatan kelas
                  </option>
                  <option value="/images/science.jpg">
                    Sains & laboratorium
                  </option>
                  <option value="/images/library.jpg">Perpustakaan</option>
                  <option value="/images/students.jpg">Kolaborasi siswa</option>
                </select>
              </label>
              <label className="span-2">
                Ringkasan
                <textarea
                  required
                  rows={3}
                  maxLength={220}
                  value={form.excerpt}
                  onChange={(event) => update("excerpt", event.target.value)}
                  placeholder="Ringkasan yang tampil pada kartu artikel..."
                />
                <small>{form.excerpt.length}/220 karakter</small>
              </label>
              <label className="span-2">
                Isi artikel
                <textarea
                  required
                  rows={12}
                  value={form.content}
                  onChange={(event) => update("content", event.target.value)}
                  placeholder={
                    "Tulis paragraf pertama di sini.\n\nPisahkan setiap paragraf dengan satu baris kosong. Sistem akan memformatnya otomatis."
                  }
                />
                <small>
                  Pisahkan paragraf dengan baris kosong · estimasi{" "}
                  {estimateReadTime(parseArticleContent(form.content))} baca
                </small>
              </label>
              <label>
                Status publikasi
                <select
                  value={form.status}
                  onChange={(event) =>
                    update("status", event.target.value as "Draft" | "Terbit")
                  }
                >
                  <option>Draft</option>
                  <option>Terbit</option>
                </select>
              </label>
            </div>
            <div className="editor-actions">
              <button
                type="button"
                className="button admin-button-muted"
                onClick={reset}
              >
                Batal
              </button>
              <button className="button button-accent" type="submit">
                {form.status === "Terbit"
                  ? "Terbitkan artikel"
                  : "Simpan draft"}{" "}
                →
              </button>
            </div>
          </form>
          <aside className="post-live-preview">
            <p>Preview kartu publik</p>
            <article className="news-card">
              <Image
                src={form.image}
                alt="Preview sampul"
                width={640}
                height={400}
                sizes="(max-width: 1100px) 0px, 320px"
              />
              <div className="news-meta">
                <span>{form.category}</span>
                <time>{formatIndonesianDate(form.date)}</time>
              </div>
              <h3>{form.title || "Judul artikel akan tampil di sini"}</h3>
              <p>
                {form.excerpt || "Ringkasan artikel akan tampil di area ini."}
              </p>
              <span className="read-link">
                Baca cerita <b>→</b>
              </span>
            </article>
          </aside>
        </section>
      )}
      <section className="admin-toolbar">
        <label className="admin-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari artikel..."
          />
        </label>
        <div className="filter-row">
          {["Semua", "Terbit", "Draft"].map((item) => (
            <button
              className={statusFilter === item ? "active" : ""}
              onClick={() => setStatusFilter(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
      <section className="content-list">
        {filtered.map((post) => (
          <article className="content-row" key={post.id}>
            <Image
              src={post.image}
              alt=""
              width={230}
              height={152}
              sizes="115px"
            />
            <div className="content-row-copy">
              <div className="news-meta">
                <span>{post.category}</span>
                <time>{post.date}</time>
              </div>
              <h3>{post.title}</h3>
              <small>
                {post.author} · {post.readTime} baca
              </small>
            </div>
            <span
              className={`status ${post.status === "Terbit" ? "status-terverifikasi" : "status-verifikasi"}`}
            >
              {post.status}
            </span>
            <div className="row-actions">
              {post.status === "Terbit" && (
                <Link href={`/blog/${post.slug}`} target="_blank">
                  Lihat ↗
                </Link>
              )}
              <button onClick={() => edit(post)}>Edit</button>
              <button onClick={() => toggle(post)}>
                {post.status === "Terbit" ? "Jadikan draft" : "Terbitkan"}
              </button>
              <button className="danger" onClick={() => remove(post)}>
                Hapus
              </button>
            </div>
          </article>
        ))}
        {!filtered.length && (
          <AdminEmptyState
            icon={FileQuestion}
            title="Belum ada artikel yang cocok"
            description="Ubah filter pencarian atau mulai tulis cerita baru untuk website sekolah."
            action={
              <button
                className="button button-dark"
                onClick={() => {
                  reset();
                  setEditorOpen(true);
                }}
              >
                <PenLine size={15} /> Tulis artikel
              </button>
            }
          />
        )}
      </section>
    </div>
  );
}
