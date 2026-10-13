"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  getBlogPosts,
  listenCmsUpdates,
  seedCmsPosts,
  type CmsPost,
} from "../lib/local-cms";
import { ShareButtons } from "./ShareButtons";

export function BlogDetailView({
  slug,
  initialPost,
}: {
  slug: string;
  initialPost?: CmsPost;
}) {
  const [post, setPost] = useState<CmsPost | undefined>(
    initialPost ?? seedCmsPosts.find((item) => item.slug === slug),
  );
  const [related, setRelated] = useState<CmsPost[]>(
    seedCmsPosts.filter((item) => item.slug !== slug).slice(0, 2),
  );
  useEffect(() => {
    const load = () => {
      const all = getBlogPosts(false);
      setPost(all.find((item) => item.slug === slug));
      setRelated(all.filter((item) => item.slug !== slug).slice(0, 2));
    };
    load();
    return listenCmsUpdates(load);
  }, [slug]);

  if (!post)
    return (
      <main className="article-missing">
        <p className="section-kicker">Artikel tidak ditemukan</p>
        <h1>Cerita ini belum tersedia.</h1>
        <p>
          Artikel mungkin masih berupa draft atau sudah dihapus dari dashboard.
        </p>
        <Link className="button button-dark" href="/blog">
          Kembali ke blog
        </Link>
      </main>
    );

  return (
    <main>
      <article className="article-page">
        <header>
          <Link href="/blog">← Kembali ke semua cerita</Link>
          <div className="news-meta">
            <span>{post.category}</span>
            <time>
              {post.date} · {post.readTime} baca
            </time>
          </div>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          <small className="article-author">Ditulis oleh {post.author}</small>
        </header>
        <Image
          className="article-cover"
          src={post.image}
          alt={`Ilustrasi ${post.title}`}
          width={1400}
          height={933}
          sizes="100vw"
          priority
        />
        <div className="article-layout">
          <ShareButtons title={post.title} />
          <div className="article-body" id="article">
            {post.content.map((paragraph, index) => (
              <p
                className={index === 0 ? "lead" : ""}
                key={`${post.id}-${index}`}
              >
                {paragraph}
              </p>
            ))}
            <blockquote>
              “Pendidikan menjadi bermakna ketika pengetahuan berubah menjadi
              keberanian untuk bertindak.”
            </blockquote>
          </div>
        </div>
      </article>
      <section className="related-posts">
        <div className="section-heading horizontal">
          <div>
            <p className="section-kicker">Lanjut membaca</p>
            <h2>Cerita lainnya</h2>
          </div>
          <Link className="text-link" href="/blog">
            Semua artikel →
          </Link>
        </div>
        <div className="blog-grid">
          {related.map((item) => (
            <article className="news-card" key={item.id}>
              <Link href={`/blog/${item.slug}`}>
                <Image
                  src={item.image}
                  alt={`Ilustrasi ${item.title}`}
                  width={700}
                  height={467}
                  sizes="(max-width: 720px) 100vw, 50vw"
                />
              </Link>
              <div className="news-meta">
                <span>{item.category}</span>
                <time>{item.date}</time>
              </div>
              <h3>
                <Link href={`/blog/${item.slug}`}>{item.title}</Link>
              </h3>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
