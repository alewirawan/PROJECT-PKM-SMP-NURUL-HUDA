import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHero } from "../components/PageHero";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

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
          eyebrow="Tentang Nurul Huda"
          title="Sekolah yang percaya pada potensi setiap anak."
          description="Kami membangun pengalaman belajar yang menantang pikiran, menguatkan karakter, dan menjaga rasa ingin tahu tetap hidup."
        />
        <section className="about-story">
          <div className="about-image">
            <Image
              src="/images/campus.jpg"
              alt="Kampus SMP Nurul Huda"
              width={1600}
              height={1048}
              sizes="(max-width: 820px) 100vw, 50vw"
            />
            <span>Sejak 2009</span>
          </div>
          <div className="about-copy">
            <p className="section-kicker">Cerita kami</p>
            <h2>Berawal dari keyakinan sederhana.</h2>
            <p>
              SMP Nurul Huda lahir dari gagasan bahwa pendidikan terbaik tidak
              menyeragamkan anak, melainkan membantu mereka mengenali kekuatan
              dan arah hidupnya.
            </p>
            <p>
              Sejak 2009, kami terus bertumbuh menjadi komunitas belajar yang
              terbuka, hangat, dan relevan dengan dunia yang terus berubah. Guru
              hadir sebagai pendamping, siswa menjadi pemilik proses belajarnya,
              dan orang tua berjalan sebagai mitra.
            </p>
            <Link className="text-link" href="/pendaftaran">
              Bergabung dengan Nurul Huda →
            </Link>
          </div>
        </section>
        <section className="vision-grid">
          <article>
            <span>01</span>
            <p className="section-kicker">Visi kami</p>
            <h2>Generasi berkarakter yang berani mencipta masa depan.</h2>
          </article>
          <article>
            <span>02</span>
            <p className="section-kicker">Misi kami</p>
            <h2>
              Menumbuhkan daya pikir, empati, dan keberanian melalui pengalaman
              belajar yang bermakna.
            </h2>
          </article>
        </section>
        <section className="values-section">
          <div className="section-heading">
            <p className="section-kicker">Nilai yang kami hidupi</p>
            <h2>Kompas dalam setiap langkah.</h2>
          </div>
          <div className="value-grid">
            <article>
              <b>01</b>
              <h3>Rasa ingin tahu</h3>
              <p>
                Kami bertanya, mencoba, dan terus belajar dari setiap
                pengalaman.
              </p>
            </article>
            <article>
              <b>02</b>
              <h3>Integritas</h3>
              <p>
                Kami berani melakukan yang benar, bahkan saat tidak ada yang
                melihat.
              </p>
            </article>
            <article>
              <b>03</b>
              <h3>Empati</h3>
              <p>Kami mendengar, memahami, dan menghargai setiap perbedaan.</p>
            </article>
            <article>
              <b>04</b>
              <h3>Keberanian</h3>
              <p>
                Kami memberi ruang untuk mencoba, gagal, bangkit, dan
                berkembang.
              </p>
            </article>
          </div>
        </section>
        <section className="principal-section">
          <div>
            <Image
              src="/images/hero-classroom.jpg"
              alt="Kepala sekolah berbincang dengan siswa"
              width={1800}
              height={1120}
              sizes="(max-width: 820px) 100vw, 50vw"
            />
          </div>
          <blockquote>
            <span>“</span>
            <p>
              Tugas sekolah bukan mengisi pikiran dengan jawaban, tetapi
              menyalakan keberanian untuk terus bertanya.
            </p>
            <footer>
              <b>Dr. Ayu Larasati, M.Pd.</b>
              <small>Kepala SMP Nurul Huda</small>
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
          <p>
            Kami dengan senang hati menyambut keluarga Anda untuk berkunjung ke
            kampus Nurul Huda.
          </p>
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
