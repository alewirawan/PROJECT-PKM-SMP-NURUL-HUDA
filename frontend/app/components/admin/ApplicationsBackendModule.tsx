"use client";

import { Download, Search } from "lucide-react";
import { useState } from "react";
import { ApiError } from "../../lib/api-client";
import {
  acceptApplication,
  completeReEnrollment,
} from "../../lib/api/applications";
import type { Application, ApplicationStatus } from "../../lib/local-cms";
import { StudentProfileDrawer } from "../student-records/StudentProfileDrawer";
import type { ReviewDocument } from "../student-records/DocumentReview";
import { AdminEmptyState, AdminPageHeader } from "./AdminUi";

type ApplicationsLoadError = {
  message: string;
  authentication: boolean;
};

function escapeCsvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function ApplicationsModule({
  applications,
  loadStatus,
  loadError,
  onRetry,
  onReauthenticate,
  onApplicationStatusChange,
  onApplicationReEnrollmentChange,
  onStudentsChanged,
  canManagePpdb,
  notify,
}: {
  applications: Application[];
  loadStatus: "loading" | "ready" | "error";
  loadError: ApplicationsLoadError | null;
  onRetry: () => void;
  onReauthenticate: () => void;
  onApplicationStatusChange: (id: string, status: ApplicationStatus) => void;
  onApplicationReEnrollmentChange: (
    id: string,
    status: "pending" | "completed" | null,
  ) => void;
  onStudentsChanged: () => void;
  canManagePpdb: boolean;
  notify: (message: string, tone?: "success" | "warning") => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [selected, setSelected] = useState<Application | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const statuses: ("Semua" | ApplicationStatus)[] = [
    "Semua",
    "Verifikasi",
    "Terverifikasi",
    "Wawancara",
    "Diterima",
    "Ditolak",
  ];
  const visible = applications.filter(
    (item) =>
      (filter === "Semua" || item.status === filter) &&
      `${item.studentName} ${item.originSchool} ${item.id}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const setStatus = (id: string, status: ApplicationStatus) =>
    notify(
      `Perubahan status ${status} untuk pendaftar ${id} belum tersedia.`,
      "warning",
    );
  const reviewDocument: ReviewDocument = () =>
    notify("Pemeriksaan dokumen belum tersedia.", "warning");

  function workflowErrorMessage(error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 401)
        return "Sesi Admin tidak valid atau telah berakhir. Silakan masuk kembali.";
      if (error.status === 403)
        return "Akun Admin tidak memiliki izin mengelola penerimaan PPDB.";
      if (error.status === 404)
        return "Pendaftar tidak ditemukan. Daftar akan diperbarui.";
      if (error.status === 409)
        return `${error.message} Daftar akan diperbarui.`;
      return error.message;
    }
    return error instanceof Error ? error.message : "Permintaan PPDB gagal.";
  }

  async function acceptSelected(application: Application) {
    if (
      !canManagePpdb ||
      workingId ||
      !["Terverifikasi", "Wawancara"].includes(application.status)
    )
      return;
    if (
      !window.confirm(
        `Tetapkan ${application.studentName} (${application.id}) sebagai diterima?`,
      )
    )
      return;
    setWorkingId(application.id);
    try {
      await acceptApplication(application.id);
      onApplicationStatusChange(application.id, "Diterima");
      setSelected({ ...application, status: "Diterima" });
      notify(`Pendaftar ${application.id} berhasil ditetapkan diterima.`);
    } catch (error) {
      notify(workflowErrorMessage(error), "warning");
      if (error instanceof ApiError && [404, 409].includes(error.status))
        onRetry();
    } finally {
      setWorkingId(null);
    }
  }

  async function completeSelectedReEnrollment(application: Application) {
    if (
      !canManagePpdb ||
      workingId ||
      application.status !== "Diterima" ||
      application.reEnrollmentStatus === "completed"
    )
      return;
    if (
      !window.confirm(
        `Konfirmasi daftar ulang ${application.studentName} (${application.id})? Siswa aktif akan dicatat di database.`,
      )
    )
      return;
    setWorkingId(application.id);
    try {
      const result = await completeReEnrollment(application.id);
      onApplicationReEnrollmentChange(
        application.id,
        result.reEnrollment.status,
      );
      setSelected({
        ...application,
        reEnrollmentStatus: result.reEnrollment.status,
      });
      onStudentsChanged();
      notify("Daftar ulang selesai dan data siswa aktif telah tercatat.");
    } catch (error) {
      notify(workflowErrorMessage(error), "warning");
      onRetry();
    } finally {
      setWorkingId(null);
    }
  }
  function exportCsv() {
    const rows = [
      [
        "ID",
        "Nama",
        "Asal sekolah",
        "Ekstrakurikuler",
        "Status",
        "Email",
        "Telepon",
      ],
      ...visible.map((item) => [
        item.id,
        item.studentName,
        item.originSchool,
        item.extracurricular ?? "Belum menentukan",
        item.status,
        item.email ?? "",
        item.phone ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pendaftar-nurul-huda.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    notify("Data pendaftar berhasil diekspor.");
  }
  return (
    <div className="admin-view">
      <AdminPageHeader
        eyebrow="Modul PPDB"
        title="Data pendaftar"
        description="Cari, tinjau, dan ekspor data calon siswa."
        action={
          <button
            className="button button-dark icon-button"
            onClick={exportCsv}
            disabled={loadStatus !== "ready"}
          >
            <Download size={16} /> Ekspor CSV
          </button>
        }
      />
      <section className="admin-toolbar">
        <label className="admin-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, sekolah, atau ID..."
          />
        </label>
        <div className="filter-row">
          {statuses.map((item) => (
            <button
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
      <section className="admin-panel admin-data-panel">
        <div className="panel-heading">
          <div>
            <h2>{visible.length} calon siswa</h2>
            <p>Gunakan tombol detail untuk membuka profil lengkap</p>
          </div>
        </div>
        {loadStatus === "loading" ? (
          <AdminEmptyState
            icon={Search}
            title="Memuat data pendaftar"
            description="Mengambil daftar dari database sekolah."
          />
        ) : loadStatus === "error" ? (
          <AdminEmptyState
            icon={Search}
            title={loadError?.authentication ? "Sesi Admin berakhir" : "Data pendaftar gagal dimuat"}
            description={loadError?.message ?? "Permintaan ke backend gagal."}
            action={
              <button
                className="button button-dark"
                onClick={
                  loadError?.authentication ? onReauthenticate : onRetry
                }
              >
                {loadError?.authentication ? "Masuk kembali" : "Coba lagi"}
              </button>
            }
          />
        ) : visible.length ? (
          <div className="table-wrap">
            <table className="admin-table-large">
              <thead>
                <tr>
                  <th>Calon siswa</th>
                  <th>Asal sekolah</th>
                  <th>Ekstrakurikuler</th>
                  <th>Tanggal masuk</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Calon siswa">
                      <b>{item.studentName}</b>
                      <small>{item.id}</small>
                    </td>
                    <td data-label="Asal sekolah">{item.originSchool}</td>
                    <td data-label="Ekstrakurikuler">
                      {item.extracurricular ?? "Belum menentukan"}
                    </td>
                    <td data-label="Tanggal masuk">
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(item.submittedAt))}
                    </td>
                    <td data-label="Status">
                      <select
                        className={`status-select status-${item.status.toLowerCase()}`}
                        value={item.status}
                        disabled
                        onChange={(event) =>
                          setStatus(
                            item.id,
                            event.target.value as ApplicationStatus,
                          )
                        }
                      >
                        {statuses.slice(1).map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td data-label="Aksi">
                      <button
                        className="table-detail-button"
                        type="button"
                        onClick={() => setSelected(item)}
                        aria-label={`Lihat detail ${item.studentName}`}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            icon={Search}
            title={
              applications.length === 0
                ? "Belum ada pendaftar"
                : "Pendaftar tidak ditemukan"
            }
            description={
              applications.length === 0
                ? "Data pendaftar akan tampil di sini setelah diterima."
                : "Ubah kata pencarian atau pilih status yang berbeda."
            }
          />
        )}
      </section>
      {selected && (
        <StudentProfileDrawer
          key={selected.id}
          student={selected}
          onClose={() => setSelected(null)}
          updateStatus={setStatus}
          reviewDocument={reviewDocument}
          readOnly
          extraActions={
            canManagePpdb ? (
              <div className="student-profile-actions">
                {["Terverifikasi", "Wawancara"].includes(selected.status) && (
                  <button
                    className="button button-accent"
                    type="button"
                    disabled={workingId === selected.id}
                    onClick={() => void acceptSelected(selected)}
                  >
                    {workingId === selected.id
                      ? "Memproses…"
                      : "Tetapkan diterima"}
                  </button>
                )}
                {selected.status === "Diterima" &&
                  (selected.reEnrollmentStatus === "completed" ? (
                    <span role="status">Daftar ulang selesai</span>
                  ) : (
                    <button
                      className="button button-accent"
                      type="button"
                      disabled={workingId === selected.id}
                      onClick={() =>
                        void completeSelectedReEnrollment(selected)
                      }
                    >
                      {workingId === selected.id
                        ? "Memproses…"
                        : "Konfirmasi daftar ulang"}
                    </button>
                  ))}
              </div>
            ) : null
          }
        />
      )}
    </div>
  );
}
