import Link from "next/link";

export default function NotFound() {
  return (
    <main className="route-state">
      <p className="section-kicker">404</p>
      <h1>Halaman tidak ditemukan.</h1>
      <p>Alamat mungkin berubah atau halaman sudah tidak tersedia.</p>
      <Link className="button button-dark" href="/">
        Kembali ke beranda
      </Link>
    </main>
  );
}
