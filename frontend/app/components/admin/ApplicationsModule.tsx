"use client";

import { Download, Search } from "lucide-react";
import { useState } from "react";
import {
  saveApplications,
  type Application,
  type ApplicationStatus,
} from "../../lib/local-cms";
import { StudentProfileDrawer } from "../student-records/StudentProfileDrawer";
import { normalizeDocuments } from "../../lib/cms/student-documents";
import type { ReviewDocument } from "../student-records/DocumentReview";
import { AdminEmptyState, AdminPageHeader } from "./AdminUi";

function escapeCsvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function ApplicationsModule({
  applications,
  setApplications,
  notify,
}: {
  applications: Application[];
  setApplications: (value: Application[]) => void;
  notify: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [selected, setSelected] = useState<Application | null>(null);
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
  function setStatus(id: string, status: ApplicationStatus) {
    const next = applications.map((item) =>
      item.id === id ? { ...item, status } : item,
    );
    try {
      saveApplications(next);
    } catch {
      notify("Penyimpanan gagal. Status belum berubah.");
      return;
    }
    setApplications(next);
    setSelected((item) => (item?.id === id ? { ...item, status } : item));
    notify("Status pendaftar berhasil diperbarui.");
  }
  const reviewDocument: ReviewDocument = (id, key, patch) => {
    const next = applications.map((item) =>
      item.id === id
        ? {
            ...item,
            documents: normalizeDocuments(item.documents).map((doc) =>
              doc.key === key
                ? {
                    ...doc,
                    ...patch,
                    status: doc.fileName
                      ? (patch.status ?? doc.status)
                      : ("Belum ada" as const),
                  }
                : doc,
            ),
          }
        : item,
    );
    try {
      saveApplications(next);
    } catch {
      notify("Penyimpanan gagal. Pemeriksaan belum disimpan.");
      return;
    }
    setApplications(next);
    setSelected(next.find((item) => item.id === id) ?? null);
    notify("Pemeriksaan berkas simulasi disimpan.");
  };
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
        description="Cari, tinjau, ubah status, dan ekspor data calon siswa."
        action={
          <button
            className="button button-dark icon-button"
            onClick={exportCsv}
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
        {visible.length ? (
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
            title="Pendaftar tidak ditemukan"
            description="Ubah kata pencarian atau pilih status yang berbeda."
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
        />
      )}
    </div>
  );
}
