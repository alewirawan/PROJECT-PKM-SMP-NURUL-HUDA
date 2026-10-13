import type { Metadata } from "next";
import { PageHero } from "../components/PageHero";
import { RegistrationForm } from "../components/RegistrationForm";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Pendaftaran Siswa",
  description:
    "Informasi dan formulir simulasi PPDB SMP Nurul Huda tahun ajaran 2026/2027.",
};

export default function RegistrationPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="PPDB 2026/2027"
          title="Satu langkah menuju perjalanan yang berarti."
          description="Temukan alur, jadwal, persyaratan, dan isi formulir pendaftaran calon siswa SMP Nurul Huda."
        />
        <section className="admission-summary">
          <article>
            <span>Gelombang 01</span>
            <strong>1 Sep–30 Nov 2026</strong>
            <small>Kuota 120 siswa</small>
          </article>
          <article>
            <span>Tes potensi</span>
            <strong>6 Desember 2026</strong>
            <small>On-site di kampus</small>
          </article>
          <article>
            <span>Pengumuman</span>
            <strong>12 Desember 2026</strong>
            <small>Melalui portal calon siswa</small>
          </article>
        </section>
        <section className="admission-content">
          <aside className="admission-guide">
            <p className="section-kicker">Sebelum mendaftar</p>
            <h2>Siapkan dokumen berikut.</h2>
            <ul>
              {[
                "SKL atau ijazah (salah satu)",
                "Kartu Keluarga",
                "KTP orang tua/wali",
                "PIP/KIP (jika memiliki)",
                "Akta kelahiran",
              ].map((label, index) => (
                <li key={label}>
                  <b>0{index + 1}</b>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <p className="form-help">
              PDF, JPG, PNG; maksimal 5 MB per berkas. Ini persyaratan contoh
              untuk simulasi, bukan pengumuman resmi sekolah.
            </p>
            <div className="help-card">
              <b>Butuh bantuan?</b>
              <p>
                Tim PPDB siap membantu setiap hari kerja pukul 08.00–15.00 WIB.
              </p>
              <a href="tel:+622212345678">(022) 1234 5678 →</a>
            </div>
          </aside>
          <RegistrationForm />
        </section>
        <section className="admission-steps">
          <div className="section-heading">
            <p className="section-kicker">Alur seleksi</p>
            <h2>Empat langkah menuju Nurul Huda.</h2>
          </div>
          <div className="step-grid">
            <article>
              <b>01</b>
              <h3>Isi formulir</h3>
              <p>Lengkapi data calon siswa dan orang tua.</p>
            </article>
            <article>
              <b>02</b>
              <h3>Verifikasi</h3>
              <p>Tim kami memeriksa kelengkapan dokumen.</p>
            </article>
            <article>
              <b>03</b>
              <h3>Tes & wawancara</h3>
              <p>Kenali potensi dan cerita calon siswa.</p>
            </article>
            <article>
              <b>04</b>
              <h3>Pengumuman</h3>
              <p>Hasil seleksi tersedia melalui portal.</p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
