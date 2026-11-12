import type { Metadata } from "next";
import { PageHero } from "../components/PageHero";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { ApplicantPortal } from "../components/registration/ApplicantPortal";

export const metadata: Metadata = {
  title: "Menu Pendaftar",
  description: "Lihat status pendaftaran dan perbaiki berkas melalui akun pendaftar SMP Nurul Huda.",
};

export default function ApplicantPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="Portal calon siswa"
          title="Pantau proses pendaftaran Anda."
          description="Periksa status berkas dan kirim perbaikan melalui sesi akun pendaftar yang aman."
        />
        <ApplicantPortal />
      </main>
      <SiteFooter />
    </>
  );
}
