import type { Metadata } from "next";
import { BlogDetailView } from "../../components/BlogDetailView";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { posts } from "../../data";
import { seedCmsPosts } from "../../lib/local-cms";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);
  if (!post)
    return {
      title: "Artikel Nurul Huda",
      description: "Artikel terbaru dari komunitas SMP Nurul Huda.",
      openGraph: { images: [] },
      twitter: { images: [] },
    };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.image }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}

export default async function BlogDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <>
      <SiteHeader active="/blog" />
      <BlogDetailView
        slug={slug}
        initialPost={seedCmsPosts.find((post) => post.slug === slug)}
      />
      <SiteFooter />
    </>
  );
}
