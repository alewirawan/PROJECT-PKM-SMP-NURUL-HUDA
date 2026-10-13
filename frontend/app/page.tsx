import { Achievements } from "./components/Achievements";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { HomeNews } from "./components/HomeNews";
import { programs } from "./data";

export default function Home() {
  return (
    <>
      <SiteHeader active="/" />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> Pendidikan yang tumbuh bersama zaman
            </p>
            <h1>
              Membentuk generasi yang <em>berani bermimpi.</em>
            </h1>
            <p className="hero-lead">
              Lingkungan belajar hangat yang memadukan keunggulan akademik,
              karakter, dan keterampilan masa depan untuk setiap siswa.
            </p>
            <div className="hero-actions">
              <Link className="button button-accent" href="/pendaftaran">
                Mulai pendaftaran <span aria-hidden="true">↗</span>
              </Link>
              <Link className="text-link" href="/tentang">
                Kenali sekolah kami <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="hero-trust">
              <div className="avatar-stack" aria-hidden="true">
                <span>AN</span>
                <span>KS</span>
                <span>RM</span>
              </div>
              <p>
                <strong>4,9/5</strong>
                <br />
                dari orang tua & alumni
              </p>
            </div>
          </div>
          <div className="hero-visual">
            <Image
              src="/images/hero-classroom.jpg"
              alt="Guru dan siswa belajar bersama di ruang kelas"
              width={1800}
              height={1120}
              sizes="(max-width: 820px) 100vw, 50vw"
              priority
            />
            <div className="hero-badge">
              <strong>17+</strong>
              <span>
                Tahun membangun
                <br />
                generasi unggul
              </span>
            </div>
            <div className="hero-card">
              <span className="hero-card-icon" aria-hidden="true">
                ✦
              </span>
              <div>
                <small>Akreditasi Sekolah</small>
                <strong>A — Unggul</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="stats" aria-label="Statistik sekolah">
          <div>
            <strong>98%</strong>
            <span>
              Lulusan melanjutkan
              <br />
              ke SMA/SMK pilihan
            </span>
          </div>
          <div>
            <strong>32</strong>
            <span>
              Pengajar profesional
              <br />
              dan berdedikasi
            </span>
          </div>
          <div>
            <strong>18</strong>
            <span>
              Program akademik
              <br />
              dan ekstrakurikuler
            </span>
          </div>
          <div>
            <strong>12:1</strong>
            <span>
              Rasio siswa dengan
              <br />
              tenaga pendidik
            </span>
          </div>
        </section>

        <section className="intro-section">
          <p className="section-kicker">Belajar di Nurul Huda</p>
          <h2>
            Setiap anak punya cahaya.
            <br />
            Kami membantu mereka <em>menemukannya.</em>
          </h2>
          <p>
            Kurikulum relevan, pendampingan personal, dan ruang eksplorasi yang
            dirancang agar siswa tumbuh menjadi pribadi utuh.
          </p>
        </section>

        <section className="program-section">
          <div className="section-heading horizontal">
            <div>
              <p className="section-kicker">Program unggulan</p>
              <h2>
                Belajar dengan arah,
                <br />
                tumbuh dengan pilihan.
              </h2>
            </div>
            <Link className="text-link" href="/program">
              Lihat semua program →
            </Link>
          </div>
          <div className="program-grid">
            {programs.map((program) => (
              <article className="program-card" key={program.number}>
                <span className="program-number">{program.number}</span>
                <div>
                  <h3>{program.title}</h3>
                  <p>{program.description}</p>
                </div>
                <ul>
                  {program.subjects.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link href="/program" aria-label={`Pelajari ${program.title}`}>
                  ↗
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="experience-section">
          <div className="experience-images">
            <Image
              className="image-main"
              src="/images/campus.jpg"
              alt="Lingkungan kampus sekolah yang hijau"
              width={1600}
              height={1048}
              sizes="(max-width: 820px) 86vw, 45vw"
            />
            <Image
              className="image-small"
              src="/images/students.jpg"
              alt="Siswa Nurul Huda berdiskusi bersama"
              width={1400}
              height={933}
              sizes="(max-width: 820px) 42vw, 22vw"
            />
            <span className="round-label">
              Ruang aman
              <br />
              untuk tumbuh
            </span>
          </div>
          <div className="experience-copy">
            <p className="section-kicker">Pengalaman yang utuh</p>
            <h2>Sekolah adalah tempat menemukan siapa dirimu.</h2>
            <p>
              Di Nurul Huda, proses belajar melampaui ruang kelas. Siswa bertemu
              tantangan nyata, membangun pertemanan, dan mengenali potensi
              terbaiknya.
            </p>
            <div className="feature-list">
              <div>
                <b>01</b>
                <span>
                  <strong>Pendampingan personal</strong>
                  <small>
                    Wali kelas dan konselor menemani perjalanan setiap siswa.
                  </small>
                </span>
              </div>
              <div>
                <b>02</b>
                <span>
                  <strong>Belajar berbasis proyek</strong>
                  <small>
                    Pengetahuan tumbuh melalui eksplorasi dan karya nyata.
                  </small>
                </span>
              </div>
              <div>
                <b>03</b>
                <span>
                  <strong>Komunitas yang suportif</strong>
                  <small>
                    Budaya sekolah yang menghargai suara dan keberagaman.
                  </small>
                </span>
              </div>
            </div>
            <Link className="button button-dark" href="/tentang">
              Cerita tentang Nurul Huda
            </Link>
          </div>
        </section>

        <section className="quote-section">
          <span className="quote-mark">“</span>
          <blockquote>
            Nurul Huda tidak hanya membantu anak kami meraih nilai baik, tetapi
            juga menemukan keberanian untuk menyampaikan ide dan bertanggung
            jawab atas pilihannya.
          </blockquote>
          <p>
            <b>Ratih Andayani</b>
            <span>Orang tua siswa kelas VIII</span>
          </p>
        </section>

        <section className="news-section">
          <div className="section-heading horizontal">
            <div>
              <p className="section-kicker">Cerita terbaru</p>
              <h2>Kabar dari Nurul Huda</h2>
            </div>
            <Link className="text-link" href="/blog">
              Baca semua cerita →
            </Link>
          </div>
          <HomeNews />
        </section>

        <Achievements compact />
        <section className="cta-section">
          <p className="section-kicker">Penerimaan siswa baru</p>
          <h2>
            Perjalanan besar dimulai
            <br />
            dari satu langkah kecil.
          </h2>
          <p>
            Kenali Nurul Huda lebih dekat dan temukan lingkungan belajar yang
            tepat untuk putra-putri Anda.
          </p>
          <div>
            <Link className="button button-accent" href="/pendaftaran">
              Daftar sebagai calon siswa
            </Link>
            <Link className="button button-outline-light" href="/kontak">
              Jadwalkan kunjungan
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
