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
          description="Tanyakan program belajar, proses pendaftaran, atau jadwalkan kunjungan untuk melihat langsung suasana belajar di Nurul Huda."
        />
        <section className="contact-layout">
          <div className="contact-map">
  <iframe
    src="https://maps.google.com/maps?q=SMP+Nurul+Huda+Cisoka&z=16&output=embed"
    loading="lazy"
    referrerPolicy="strict-origin-when-cross-origin"
    allowFullScreen
    style={{ border: 0, width: "100%", height: "100%", minHeight: 320 }}
  />
</div>
          <div className="contact-details">
            <p className="section-kicker">Kunjungi sekolah</p>
            <h2>Rumah belajar kami terbuka untuk Anda.</h2>
            <div className="contact-list">
              <article>
                <span>Alamat</span>
                <p>
                 Jl. Megu – Cisoka No. 8 ,Jl. Cisoka-Megu Kp. Secang RT 05/04, Desa Cempaka, Kecamatan Cisoka
                  <br />
                  Kabupaten Tangerang, Banten 15730.
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
                  nurulhudacisoka.smp@gmail.com
                  <br />
                  
                </p>
              </article>
              <article>
                <span>Jam layanan</span>
                <p>
                  Senin–Jumat, 07.00–12.00
                  <br />
                 
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
              Isi formulir berikut.
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
              <summary>Kapan pendaftaran PPDB dibuka?</summary>
              <p>
                Pendaftaran Peserta Didik Baru (PPDB) dibuka setiap tahun menjelang tahun ajaran baru setiap tanggal 1 mei. Informasi mengenai jadwal pendaftaran, persyaratan, dan tahapan seleksi dapat diperoleh melalui panitia penerimaan siswa baru SMP Nurul Huda
              </p>
            </details>
            <details>
              <summary>Bagaimana cara mendaftar sebagai calon siswa baru?</summary>
              <p>
                Calon siswa dapat melakukan pendaftaran dengan menghubungi panitia PPDB atau datang langsung ke SMP Nurul Huda untuk mendapatkan informasi mengenai prosedur pendaftaran dan persyaratan yang harus dipenuhi.
              </p>
            </details>
            <details>
              <summary>
                Apa saja ekstrakurikuler yang tersedia?
              </summary>
              <p>
                Smp Nurul Huda menyediakan berbagai ekstrakurikuler, yaitu PMR,Pramuka,Rohis,Seni Tari,Futsal dan Badminton
              </p>
            </details>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
