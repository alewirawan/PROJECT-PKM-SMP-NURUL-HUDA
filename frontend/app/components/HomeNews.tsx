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

export function HomeNews() {
  const [items, setItems] = useState<CmsPost[]>(
    seedCmsPosts.filter((post) => post.status === "Terbit").slice(0, 3),
  );
  useEffect(() => {
    const load = () => setItems(getBlogPosts(false).slice(0, 3));
    load();
    return listenCmsUpdates(load);
  }, []);

  return (
    <div className="news-grid">
      {items.map((post, index) => (
        <article
          className={`news-card ${index === 0 ? "featured" : ""}`}
          key={post.id}
        >
          <Link href={`/blog/${post.slug}`}>
            <Image
              src={post.image}
              alt={`Ilustrasi ${post.title}`}
              width={700}
              height={467}
              sizes="(max-width: 720px) 100vw, 33vw"
            />
          </Link>
          <div className="news-meta">
            <span>{post.category}</span>
            <time>{post.date}</time>
          </div>
          <h3>
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h3>
          <p>{post.excerpt}</p>
          <Link className="read-link" href={`/blog/${post.slug}`}>
            Baca cerita <span>→</span>
          </Link>
        </article>
      ))}
    </div>
  );
}
