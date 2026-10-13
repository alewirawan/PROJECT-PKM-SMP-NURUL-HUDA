import type { Metadata } from "next";
import { ContactForm } from "../components/ContactForm";
import { PageHero } from "../components/PageHero";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Kontak",
  description: "Hubungi dan jadwalkan kunjungan ke SMP Nurul Huda.",
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader active="/kontak" />
      <main>
        <PageHero
          eyebrow="Hubungi kami"
          title="Kami senang mendengar dari Anda."
          description="Tanyakan program belajar, proses pendaftaran, atau jadwalkan kunjungan untuk merasakan langsung suasana Nurul Huda."
        />
        <section className="contact-layout">
          <div className="contact-map">
            <div className="map-grid" />
            <span className="map-road one" />
            <span className="map-road two" />
            <div className="map-pin">
              <b>N</b>
              <span>SMP Nurul Huda</span>
            </div>
          </div>
          <div className="contact-details">
            <p className="section-kicker">Kunjungi kampus</p>
            <h2>Rumah belajar kami terbuka untuk Anda.</h2>
            <div className="contact-list">
              <article>
                <span>Alamat</span>
                <p>
                  Jl. Cakrawala Pendidikan No. 17
                  <br />
                  Bandung, Jawa Barat 40123
                </p>
              </article>
              <article>
                <span>Telepon</span>
                <p>
                  (022) 1234 5678
                  <br />
                  0812 3456 7890
                </p>
              </article>
              <article>
                <span>Email</span>
                <p>
                  halo@nurulhuda.sch.id
                  <br />
                  ppdb@nurulhuda.sch.id
                </p>
              </article>
              <article>
                <span>Jam layanan</span>
                <p>
                  Senin–Jumat, 07.00–16.00
                  <br />
                  Sabtu, 08.00–12.00
                </p>
              </article>
            </div>
          </div>
        </section>
        <section className="contact-form-section">
          <div>
            <p className="section-kicker">Kirim pesan</p>
            <h2>Ada yang ingin ditanyakan?</h2>
            <p>
              Isi formulir berikut. Pesan demo akan langsung tersedia di
              dashboard admin untuk ditindaklanjuti.
            </p>
          </div>
          <ContactForm />
        </section>
        <section className="faq-section">
          <div className="section-heading">
            <p className="section-kicker">Pertanyaan umum</p>
            <h2>Informasi yang sering dicari.</h2>
          </div>
          <div className="faq-list">
            <details open>
              <summary>Apakah tersedia program beasiswa?</summary>
              <p>
                Ya. Nurul Huda menyediakan beasiswa prestasi akademik,
                nonakademik, dan dukungan finansial berdasarkan proses seleksi.
              </p>
            </details>
            <details>
              <summary>Apakah calon siswa dapat melakukan school tour?</summary>
              <p>
                Bisa. Kunjungan tersedia setiap Selasa dan Kamis dengan
                perjanjian melalui tim penerimaan siswa.
              </p>
            </details>
            <details>
              <summary>
                Apakah sekolah menyediakan layanan antar-jemput?
              </summary>
              <p>
                Tersedia rute terbatas untuk wilayah Bandung Utara, Tengah, dan
                Timur. Rute final menyesuaikan jumlah peminat.
              </p>
            </details>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
