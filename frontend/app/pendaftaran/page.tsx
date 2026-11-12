import type { Metadata } from "next";
import { PageHero } from "../components/PageHero";
import { RegistrationForm } from "../components/RegistrationForm";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Pendaftaran Siswa",
  description: "Formulir pendaftaran calon siswa SMP Nurul Huda.",
};

export default function RegistrationPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="PPDB Online"
          title="Satu langkah menuju perjalanan yang berarti."
          description="Lengkapi data calon siswa dan unggah berkas sesuai persyaratan yang ditetapkan sekolah."
        />
        <section className="admission-summary">
          <article><span>Informasi PPDB</span><strong>Jadwal dan status</strong><small>Mengikuti pengaturan manual admin sekolah</small></article>
          <article><span>Persyaratan</span><strong>Berkas dinamis</strong><small>Daftar wajib dibaca dari Pengaturan PPDB</small></article>
          <article><span>Ekstrakurikuler</span><strong>Pilihan opsional</strong><small>Dapat memilih lebih dari satu kegiatan aktif</small></article>
        </section>
        <section className="admission-content">
          <aside className="admission-guide">
            <p className="section-kicker">Sebelum mendaftar</p>
            <h2>Siapkan data dan dokumen calon siswa.</h2>
            <p className="form-help">Jenis dokumen yang wajib diunggah mengikuti pengaturan sekolah. PIP/KIP selalu opsional. Format berkas yang diterima adalah PDF, JPG, atau PNG dengan ukuran maksimal 5 MiB per berkas.</p>
            <div className="help-card">
              <b>Butuh bantuan?</b>
              <p>Hubungi pihak sekolah melalui informasi kontak resmi yang tercantum pada website.</p>
            </div>
          </aside>
          <RegistrationForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
