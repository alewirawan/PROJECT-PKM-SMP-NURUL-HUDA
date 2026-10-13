"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function MotionEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const selector = [
      ".hero-copy > *",
      ".hero-visual",
      ".page-hero > *",
      ".news-card",
      ".program-card",
      ".value-grid article",
      ".step-grid article",
      ".club-grid span",
    ].join(",");
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(selector),
    );
    targets.forEach((element, index) => {
      element.classList.add("reveal-ready");
      element.style.setProperty(
        "--reveal-delay",
        `${Math.min(index % 5, 4) * 70}ms`,
      );
    });
    if (!("IntersectionObserver" in window)) {
      targets.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -7% 0px" },
    );
    targets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
