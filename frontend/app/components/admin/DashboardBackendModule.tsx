import { useEffect, useState } from "react";
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
import { hasBackendApi, requestApi } from "../../lib/api-client";
import type {
  Agenda,
  Application,
} from "../../lib/local-cms";
import { AdminPageHeader } from "./AdminUi";
import type { AdminView } from "./types";

type View = AdminView;
type DashboardMetric = {
  count: number | null;
  status: "available" | "unavailable";
};
type DashboardSummary = {
  students: DashboardMetric;
  teachers: DashboardMetric;
  ppdbApplicants: DashboardMetric;
  agenda: DashboardMetric;
};
type DashboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; summary: DashboardSummary };
export function DashboardModule({
  applications,
  agenda,
  adminName,
  onNavigate,
  onCreatePost,
}: {
  applications: Application[];
  agenda: Agenda[];
  adminName?: string;
  onNavigate: (view: View) => void;
  onCreatePost: () => void;
}) {
  const backendConfigured = hasBackendApi();
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    status: "loading",
  });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!backendConfigured) return;
    let active = true;
    requestApi<DashboardSummary>("/admin/dashboard/summary")
      .then((summary) => {
        if (active) setDashboardState({ status: "ready", summary });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setDashboardState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Ringkasan dashboard gagal dimuat.",
        });
      });
    return () => {
      active = false;
    };
  }, [backendConfigured, retryCount]);

  const summary =
    dashboardState.status === "ready" ? dashboardState.summary : null;
  const metricValue = (metric?: DashboardMetric) => {
    if (dashboardState.status === "loading") return "Memuat…";
    if (dashboardState.status === "error" || !metric) return "—";
    if (metric.status === "unavailable" || metric.count === null)
      return "Belum tersedia";
    return metric.count.toLocaleString("id-ID");
  };
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour >= 4 && hour < 11
      ? "Selamat pagi"
      : hour >= 11 && hour < 15
        ? "Selamat siang"
        : hour >= 15 && hour < 18
          ? "Selamat sore"
          : "Selamat malam";
  const currentDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  const studentMetricValue = metricValue(summary?.students);
  return (
    <div className="admin-view">
      <AdminPageHeader
        eyebrow={currentDate}
        title={`${greeting}${adminName ? `, ${adminName}` : ""}.`}
        description="Berikut ringkasan aktivitas sekolah hari ini."
        action={
          <button className="button button-dark" onClick={onCreatePost}>
            + Buat pengumuman
          </button>
        }
      />
      {backendConfigured && dashboardState.status === "loading" && (
        <p className="admin-form-error" role="status" aria-live="polite">
          Memuat ringkasan statistik dashboard…
        </p>
      )}
      {backendConfigured && dashboardState.status === "error" && (
        <div className="admin-form-error" role="alert">
          <p>Ringkasan dashboard gagal dimuat: {dashboardState.message}</p>
          <button
            className="button button-dark"
            onClick={() => {
              setDashboardState({ status: "loading" });
              setRetryCount((count) => count + 1);
            }}
          >
            Coba Lagi
          </button>
        </div>
      )}
      <section className="metric-grid">
        <article>
          <span className="metric-icon amber">
            <TrendingUp size={17} />
          </span>
          <small>Total siswa aktif</small>
          <strong>{studentMetricValue}</strong>
          <p>
            {summary?.students.status === "unavailable" ||
            summary?.students.count === null
              ? "Data siswa aktif belum tersedia dari API."
              : "Data siswa aktif dari database."}
          </p>
        </article>
        <article>
          <span className="metric-icon green">
            <BadgeCheck size={17} />
          </span>
          <small>Guru</small>
          <strong>
            {backendConfigured
              ? metricValue(summary?.teachers)
              : "Belum tersedia"}
          </strong>
          <p>
            {backendConfigured
              ? "Data guru dari backend"
              : "Backend belum dikonfigurasi."}
          </p>
        </article>
        <article>
          <span className="metric-icon blue">
            <Clock3 size={17} />
          </span>
          <small>Pendaftar PPDB</small>
          <strong>
            {backendConfigured
              ? metricValue(summary?.ppdbApplicants)
              : "Belum tersedia"}
          </strong>
          <p>
            {backendConfigured
              ? "Total pendaftar pada backend"
              : "Backend belum dikonfigurasi."}
          </p>
        </article>
        <article>
          <span className="metric-icon coral">
            <FileText size={17} />
          </span>
          <small>Agenda</small>
          <strong>
            {backendConfigured ? metricValue(summary?.agenda) : "Belum tersedia"}
          </strong>
          <p>
            {backendConfigured
              ? "Total agenda pada backend"
              : "Backend belum dikonfigurasi."}
          </p>
        </article>
      </section>
      <section className="admin-overview-strip">
        <article className="enrollment-progress">
          <div>
            <p className="admin-eyebrow">Target penerimaan</p>
            <h2>
              {backendConfigured
                ? "Ringkasan PPDB dari backend"
                : "Ringkasan PPDB belum tersedia"}
            </h2>
          </div>
          {backendConfigured ? (
            <>
              <strong>{metricValue(summary?.ppdbApplicants)}</strong>
              <p>Jumlah pendaftar yang tercatat pada backend.</p>
            </>
          ) : (
            <>
              <strong>Belum tersedia</strong>
              <p>Backend belum menyediakan ringkasan penerimaan PPDB.</p>
            </>
          )}
        </article>
        <article className="workspace-health">
          <div>
            <p className="admin-eyebrow">
              {backendConfigured ? "Status dashboard" : "Status sistem"}
            </p>
            <h2>
              {backendConfigured
                ? dashboardState.status === "ready"
                  ? "Terhubung ke backend"
                  : dashboardState.status === "loading"
                    ? "Memuat ringkasan"
                    : "Ringkasan gagal dimuat"
                : "Backend belum dikonfigurasi"}
            </h2>
          </div>
          {backendConfigured ? (
            <ul>
              <li>
                <span
                  className={`health-dot${dashboardState.status === "ready" ? " online" : ""}`}
                />
                API dashboard <b>{dashboardState.status}</b>
              </li>
              <li>
                <span className="health-dot" />
                Guru <b>{metricValue(summary?.teachers)}</b>
              </li>
              <li>
                <span className="health-dot" />
                Agenda <b>{metricValue(summary?.agenda)}</b>
              </li>
            </ul>
          ) : (
            <ul>
              <li>
                <span className="health-dot" />
                Ringkasan API <b>Belum tersedia</b>
              </li>
              <li>
                <span className="health-dot" />
                Agenda <b>Belum tersedia</b>
              </li>
              <li>
                <span className="health-dot" />
                Pesan <b>Belum tersedia</b>
              </li>
            </ul>
          )}
        </article>
      </section>
      {backendConfigured ? (
        <section
          className="admin-analytics-grid"
          aria-label="Analitik penerimaan siswa"
        >
          <article className="trend-card">
            <header>
              <div>
                <p className="admin-eyebrow">Tren pendaftaran</p>
                <h2>Data tren belum tersedia</h2>
              </div>
            </header>
            <p>API ringkasan belum menyediakan riwayat pendaftaran.</p>
          </article>
          <article className="funnel-card">
            <header>
              <div>
                <p className="admin-eyebrow">Alur PPDB</p>
                <h2>Rincian tahap belum tersedia</h2>
              </div>
            </header>
            <p>Statistik tahap PPDB belum tersedia dari API.</p>
          </article>
        </section>
      ) : (
        <AdmissionAnalytics />
      )}
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
            {backendConfigured
              ? "Kelola pesan masuk"
              : "Backend belum dikonfigurasi"}
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
                {backendConfigured ? (
                  <tr>
                    <td colSpan={4}>
                      Data rinci pendaftar tidak disediakan oleh API ringkasan.
                    </td>
                  </tr>
                ) : (
                  applications.slice(0, 5).map((item) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
        <aside className="admin-panel agenda-panel">
          <div className="panel-heading">
            <div>
              <h2>Agenda terdekat</h2>
              <p>
                {backendConfigured
                  ? `${metricValue(summary?.agenda)} agenda tercatat`
                  : "Jumlah agenda belum tersedia"}
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

function AdmissionAnalytics() {
  return (
    <section
      className="admin-analytics-grid"
      aria-label="Analitik penerimaan siswa"
    >
      <article className="trend-card">
        <header>
          <div>
            <p className="admin-eyebrow">Tren pendaftaran</p>
            <h2>Tren pendaftaran belum tersedia</h2>
          </div>
          <span>
            <TrendingUp size={15} /> Belum tersedia
          </span>
        </header>
        <p>Backend belum menyediakan riwayat pendaftaran.</p>
      </article>
      <article className="funnel-card">
        <header>
          <div>
            <p className="admin-eyebrow">Alur PPDB</p>
            <h2>Rincian tahap belum tersedia</h2>
          </div>
          <strong>—</strong>
        </header>
        <p>Backend belum menyediakan statistik tahap PPDB.</p>
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
