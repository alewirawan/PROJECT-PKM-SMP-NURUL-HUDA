import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHero } from "../components/PageHero";
import { SiteFooter } from "../components/SiteFooter";
import { SchoolText } from "../components/SchoolText";
import { SiteHeader } from "../components/SiteHeader";
import { aboutContent } from "../lib/content/about";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "Cerita, visi, nilai, dan perjalanan SMP Nurul Huda.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader active="/tentang" />
      <main>
        <PageHero
          eyebrow={aboutContent.hero.eyebrow}
          title={aboutContent.hero.title}
          description={aboutContent.hero.description}
        />
        <section className="about-story">
          <div className="about-image">
            <Image
              src="/images/kampus-1.jpg"
              alt="Gedung dan halaman SMP Nurul Huda"
              width={1600}
              height={1200}
              sizes="(max-width: 820px) 100vw, 50vw"
            />
            <span>{aboutContent.story.badge}</span>
          </div>
          <div className="about-copy">
            <p className="section-kicker">{aboutContent.story.kicker}</p>
            <h2>{aboutContent.story.heading}</h2>
            <p>
              <SchoolText field="schoolName" /> {aboutContent.story.paragraphs[0]}
            </p>
            <p>{aboutContent.story.paragraphs[1]}</p>
            <Link className="text-link" href="/pendaftaran">
              Bergabung dengan Nurul Huda →
            </Link>
          </div>
        </section>
        <section className="vision-grid">
          <article>
            <span>01</span>
            <p className="section-kicker">Visi kami</p>
            <h2 className="vision-text">{aboutContent.vision}</h2>
          </article>
          <article>
            <span>02</span>
            <p className="section-kicker">Misi kami</p>
            <h2 className="vision-text">
              {aboutContent.mission.map((item, index) => (
                <span key={item}>
                  {index + 1}. {item}
                </span>
              ))}
            </h2>
          </article>
        </section>
        <section className="values-section">
          <div className="section-heading">
            <p className="section-kicker">Nilai yang kami hidupi</p>
            <h2>Kompas dalam setiap langkah.</h2>
          </div>
          <div className="value-grid">
            {aboutContent.values.map((value) => (
              <article key={value.number}>
                <b>{value.number}</b>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="principal-section">
          <div>
            <Image
              src="/images/kampus-2.jpg"
              alt="Halaman dan gedung kelas SMP Nurul Huda"
              width={1600}
              height={1200}
              sizes="(max-width: 820px) 100vw, 50vw"
            />
          </div>
          <blockquote>
            <span>“</span>
            <p>{aboutContent.principal.quote}</p>
            <footer>
              <b>{aboutContent.principal.name}</b>
              <small>
                Kepala <SchoolText field="schoolName" />
              </small>
            </footer>
          </blockquote>
        </section>
        <section className="cta-section light">
          <p className="section-kicker">Kenali lebih dekat</p>
          <h2>
            Datang, berbincang,
            <br />
            dan rasakan suasananya.
          </h2>
          <p>{aboutContent.cta}</p>
          <div>
            <Link className="button button-accent" href="/kontak">
              Jadwalkan kunjungan
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
