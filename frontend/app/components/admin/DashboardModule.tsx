import {
  BadgeCheck,
  CalendarPlus,
  Clock3,
  FileText,
  MessageSquare,
  PenLine,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import type {
  Agenda,
  Application,
  CmsPost,
  ContactMessage,
} from "../../lib/local-cms";
import { AdminPageHeader } from "./AdminUi";
import type { AdminView } from "./types";

type View = AdminView;

export function DashboardModule({
  applications,
  posts,
  agenda,
  messages,
  onNavigate,
  onCreatePost,
}: {
  applications: Application[];
  posts: CmsPost[];
  agenda: Agenda[];
  messages: ContactMessage[];
  onNavigate: (view: View) => void;
  onCreatePost: () => void;
}) {
  const published = posts.filter((post) => post.status === "Terbit").length;
  const verified = applications.filter((item) =>
    ["Terverifikasi", "Diterima"].includes(item.status),
  ).length;
  const pending = applications.filter(
    (item) => item.status === "Verifikasi",
  ).length;
  const targetApplicants = 80;
  const progress = Math.min(
    100,
    Math.round((applications.length / targetApplicants) * 100),
  );
  const activeAgenda = agenda.filter((item) => !item.completed).length;
  const unreadMessages = messages.filter(
    (item) => item.status === "Baru",
  ).length;
  return (
    <div className="admin-view">
      <AdminPageHeader
        eyebrow="Kamis, 18 September 2026"
        title="Selamat pagi, Rania."
        description="Berikut ringkasan aktivitas sekolah hari ini."
        action={
          <button className="button button-dark" onClick={onCreatePost}>
            + Buat pengumuman
          </button>
        }
      />
      <section className="metric-grid">
        <article>
          <span className="metric-icon amber">
            <TrendingUp size={17} />
          </span>
          <small>Total pendaftar</small>
          <strong>{applications.length}</strong>
          <p>
            <b>Data aktif</b> di penyimpanan lokal
          </p>
        </article>
        <article>
          <span className="metric-icon green">
            <BadgeCheck size={17} />
          </span>
          <small>Terverifikasi</small>
          <strong>{verified}</strong>
          <p>
            {applications.length
              ? Math.round((verified / applications.length) * 100)
              : 0}
            % dari total pendaftar
          </p>
        </article>
        <article>
          <span className="metric-icon blue">
            <Clock3 size={17} />
          </span>
          <small>Menunggu review</small>
          <strong>{pending}</strong>
          <p>Perlu ditinjau tim PPDB</p>
        </article>
        <article>
          <span className="metric-icon coral">
            <FileText size={17} />
          </span>
          <small>Artikel terbit</small>
          <strong>{published}</strong>
          <p>{posts.length - published} draft tersimpan</p>
        </article>
      </section>
      <section className="admin-overview-strip">
        <article className="enrollment-progress">
          <div>
            <p className="admin-eyebrow">Target penerimaan</p>
            <h2>Progres PPDB 2026/2027</h2>
          </div>
          <strong>{progress}%</strong>
          <div
            className="progress-track"
            aria-label={`${progress}% dari target pendaftar`}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <p>
            <b>{applications.length}</b> dari target {targetApplicants} calon
            siswa <span>·</span> {targetApplicants - applications.length} slot
            tersisa
          </p>
        </article>
        <article className="workspace-health">
          <div>
            <p className="admin-eyebrow">Status sistem</p>
            <h2>Semua layanan aktif</h2>
          </div>
          <ul>
            <li>
              <span className="health-dot online" />
              Website publik <b>Online</b>
            </li>
            <li>
              <span className="health-dot" />
              Agenda aktif <b>{activeAgenda}</b>
            </li>
            <li>
              <span className="health-dot alert" />
              Pesan perlu dibaca <b>{unreadMessages}</b>
            </li>
          </ul>
        </article>
      </section>
      <AdmissionAnalytics applications={applications} />
      <section className="admin-quick-actions">
        <button onClick={() => onNavigate("applications")}>
          <span>
            <UserCheck size={19} />
          </span>
          <b>Review pendaftar</b>
          <small>Ubah status dan ekspor data</small>
        </button>
        <button onClick={onCreatePost}>
          <span>
            <PenLine size={19} />
          </span>
          <b>Tulis artikel baru</b>
          <small>Terbit otomatis ke website</small>
        </button>
        <button onClick={() => onNavigate("agenda")}>
          <span>
            <CalendarPlus size={19} />
          </span>
          <b>Tambah agenda</b>
          <small>Kelola kalender sekolah</small>
        </button>
        <button onClick={() => onNavigate("messages")}>
          <span>
            <MessageSquare size={19} />
          </span>
          <b>Buka pesan</b>
          <small>
            {messages.filter((item) => item.status === "Baru").length} pesan
            belum dibaca
          </small>
        </button>
      </section>
      <section className="admin-grid">
        <article className="admin-panel applications-panel">
          <div className="panel-heading">
            <div>
              <h2>Pendaftar terbaru</h2>
              <p>Data PPDB yang baru masuk</p>
            </div>
            <button
              className="panel-link"
              onClick={() => onNavigate("applications")}
            >
              Lihat semua
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Calon siswa</th>
                  <th>Ekstrakurikuler</th>
                  <th>Status</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 5).map((item) => (
                  <tr key={item.id}>
                    <td data-label="Calon siswa">
                      <b>{item.studentName}</b>
                      <small>{item.originSchool}</small>
                    </td>
                    <td>{item.extracurricular ?? "Belum menentukan"}</td>
                    <td>
                      <span
                        className={`status status-${item.status.toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{item.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <aside className="admin-panel agenda-panel">
          <div className="panel-heading">
            <div>
              <h2>Agenda terdekat</h2>
              <p>
                {agenda.filter((item) => !item.completed).length} kegiatan aktif
              </p>
            </div>
            <button onClick={() => onNavigate("agenda")}>+</button>
          </div>
          {agenda
            .filter((item) => !item.completed)
            .slice(0, 3)
            .map((item) => (
              <AgendaRow item={item} key={item.id} />
            ))}
          <button className="panel-link" onClick={() => onNavigate("agenda")}>
            Kelola seluruh agenda →
          </button>
        </aside>
      </section>
    </div>
  );
}

function AdmissionAnalytics({ applications }: { applications: Application[] }) {
  const total = applications.length;
  const stages = [
    { label: "Mendaftar", value: total, tone: "registered" },
    {
      label: "Terverifikasi",
      value: applications.filter((item) =>
        ["Terverifikasi", "Wawancara", "Diterima"].includes(item.status),
      ).length,
      tone: "verified",
    },
    {
      label: "Wawancara",
      value: applications.filter((item) =>
        ["Wawancara", "Diterima"].includes(item.status),
      ).length,
      tone: "interview",
    },
    {
      label: "Diterima",
      value: applications.filter((item) => item.status === "Diterima").length,
      tone: "accepted",
    },
  ];
  const weekValues = [
    Math.max(1, Math.round(total * 0.25)),
    Math.max(1, Math.round(total * 0.5)),
    Math.max(1, Math.round(total * 0.75)),
    Math.max(1, total),
  ];
  const maxWeek = Math.max(...weekValues, 1);
  const conversion = total
    ? Math.round((stages.at(-1)!.value / total) * 100)
    : 0;
  return (
    <section
      className="admin-analytics-grid"
      aria-label="Analitik penerimaan siswa"
    >
      <article className="trend-card">
        <header>
          <div>
            <p className="admin-eyebrow">Tren pendaftaran</p>
            <h2>Pertumbuhan empat pekan</h2>
          </div>
          <span>
            <TrendingUp size={15} /> Data demo
          </span>
        </header>
        <div className="bar-chart">
          {weekValues.map((value, index) => (
            <div className="chart-column" key={index}>
              <b>{value}</b>
              <div>
                <span
                  style={{
                    height: `${Math.max(18, (value / maxWeek) * 100)}%`,
                  }}
                />
              </div>
              <small>Pekan {index + 1}</small>
            </div>
          ))}
        </div>
      </article>
      <article className="funnel-card">
        <header>
          <div>
            <p className="admin-eyebrow">Alur PPDB</p>
            <h2>Perjalanan calon siswa</h2>
          </div>
          <strong>
            {conversion}%<small>konversi</small>
          </strong>
        </header>
        <div className="funnel-list">
          {stages.map((stage) => (
            <div className={`funnel-row ${stage.tone}`} key={stage.label}>
              <div>
                <span>{stage.label}</span>
                <b>{stage.value}</b>
              </div>
              <i
                style={{
                  width: `${total ? Math.max(12, (stage.value / total) * 100) : 0}%`,
                }}
              />
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function AgendaRow({ item }: { item: Agenda }) {
  const date = new Date(`${item.date}T12:00:00`);
  return (
    <div className="agenda-item">
      <time>
        <b>{date.getDate()}</b>
        <span>
          {new Intl.DateTimeFormat("id-ID", { month: "short" })
            .format(date)
            .toUpperCase()}
        </span>
      </time>
      <div>
        <b>{item.title}</b>
        <small>
          {item.time} · {item.location}
        </small>
      </div>
    </div>
  );
}
