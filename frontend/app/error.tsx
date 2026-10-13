"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="route-state" role="alert">
      <p className="section-kicker">Terjadi kendala</p>
      <h1>Halaman belum dapat ditampilkan.</h1>
      <p>
        Coba muat ulang bagian ini. Data yang sudah tersimpan tidak dihapus.
      </p>
      <button className="button button-dark" type="button" onClick={reset}>
        Coba lagi
      </button>
    </main>
  );
}
