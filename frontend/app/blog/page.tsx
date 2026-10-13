import type { Metadata } from "next";
import { PageHero } from "../components/PageHero";
import { PublicBlog } from "../components/PublicBlog";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Blog & Berita",
  description:
    "Cerita, kabar, dan gagasan terbaru dari komunitas SMP Nurul Huda.",
};

export default function BlogPage() {
  return (
    <>
      <SiteHeader active="/blog" />
      <main>
        <PageHero
          eyebrow="Cerita Nurul Huda"
          title="Kabar, gagasan, dan cerita dari sekolah."
          description="Mengikuti perjalanan siswa, guru, dan komunitas Nurul Huda dalam belajar, berkarya, dan memberi dampak."
        />
        <PublicBlog />
      </main>
      <SiteFooter />
    </>
  );
}
