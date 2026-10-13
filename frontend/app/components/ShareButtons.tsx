"use client";

import { useState } from "react";

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share)
      await navigator.share({ title, url: window.location.href });
    else await copy();
  }
  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <aside className="share-buttons">
      <span>Bagikan cerita</span>
      <button onClick={share} aria-label="Bagikan artikel">
        ↗
      </button>
      <button onClick={copy} aria-label="Salin tautan artikel">
        {copied ? "✓" : "⧉"}
      </button>
    </aside>
  );
}
