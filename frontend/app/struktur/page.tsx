import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "../components/PageHero";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { DirectoryTabs } from "../components/DirectoryTabs";

export const metadata: Metadata = {
  title: "Struktur & Guru",
  description: "Struktur organisasi dan daftar tenaga pendidik SMP Nurul Huda.",
};

export default function StructurePage() {
  return (
    <>
      <SiteHeader active="/struktur" />
      <main>
        <PageHero
          eyebrow="Struktur & Guru"
          title="Satu sekolah, banyak peran yang saling menguatkan."
          description="Kenali susunan kepemimpinan dan para pendidik yang menjaga setiap keputusan tetap dekat dengan kebutuhan siswa."
        />
        <DirectoryTabs />
        <section className="cta-section">
          <p className="section-kicker">Bertemu langsung</p>
          <h2>
            Kenali suasana belajar
            <br />
            dan orang-orang di dalamnya.
          </h2>
          <p>
            Jadwalkan kunjungan untuk berbincang dengan tim sekolah dan melihat
            kegiatan belajar dari dekat.
          </p>
          <div>
            <Link className="button button-accent" href="/kontak">
              Jadwalkan kunjungan
            </Link>
            <Link className="button button-outline-light" href="/pendaftaran">
              Lihat PPDB
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
