"use client";
import { useAgenda } from "../lib/use-agenda";

export function PublicAgenda() {
  const { agenda, loading, error, refresh } = useAgenda();
  return (
    <section className="public-agenda" aria-labelledby="public-agenda-title">
      <div className="section-heading horizontal">
        <div>
          <p className="section-kicker">Kalender sekolah</p>
          <h2 id="public-agenda-title">Catat tanggalnya.</h2>
        </div>
        <p>Kegiatan dan agenda terbuka untuk warga sekolah.</p>
      </div>
      {loading && <p role="status">Memuat agenda…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => void refresh()}>Coba lagi</button>
        </div>
      )}
      {!loading && !error && !agenda.length && (
        <p>Belum ada agenda publik yang diumumkan.</p>
      )}
      <div className="public-agenda-grid">
        {agenda.map((item) => (
          <article key={item.id}>
            <time dateTime={item.date}>
              {new Intl.DateTimeFormat("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date(item.date + "T12:00:00"))}
            </time>
            <small>
              {item.type}
              {item.completed ? " · Selesai" : ""}
            </small>
            <h3>{item.title}</h3>
            <p>
              {item.time} · {item.location}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
