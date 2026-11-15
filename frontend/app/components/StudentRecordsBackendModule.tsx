"use client";

import {
  ChevronLeft,
  ChevronRight,
  Search,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError } from "../lib/api-client";
import {
  listStudents,
  type StudentPage,
  type StudentStatus,
} from "../lib/api/students";
import { StudentDetailDrawer } from "./student-records/StudentDetailDrawer";
import { studentInitials } from "./student-records/shared";

type Props = {
  notify: (message: string, tone?: "success" | "warning") => void;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; page: StudentPage; requestKey: string }
  | { status: "error"; message: string; requestKey: string };

function apiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401)
      return "Sesi Admin tidak valid atau telah berakhir. Silakan masuk kembali.";
    if (error.status === 403)
      return "Akun Admin tidak memiliki izin melihat data siswa.";
    if (error.status === 404) return "Data siswa tidak ditemukan.";
    if (error.status === 409)
      return "Data siswa berubah. Muat ulang daftar sebelum melanjutkan.";
    return error.message;
  }
  return error instanceof Error ? error.message : "Permintaan data siswa gagal.";
}

export function StudentRecordsModule({ notify }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<StudentStatus>("active");
  const [pageNumber, setPageNumber] = useState(1);
  const [limit, setLimit] = useState(25);
  const [retry, setRetry] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const requestKey = JSON.stringify({
    query: debouncedQuery,
    status,
    pageNumber,
    limit,
    retry,
  });
  const currentLoadState =
    loadState.status !== "loading" && loadState.requestKey === requestKey
      ? loadState
      : { status: "loading" as const };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPageNumber(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;
    void listStudents({
      q: debouncedQuery || undefined,
      status,
      page: pageNumber,
      limit,
    })
      .then((page) => {
        if (active)
          setLoadState({ status: "ready", page, requestKey });
      })
      .catch((error: unknown) => {
        if (active)
          setLoadState({
            status: "error",
            message: apiErrorMessage(error),
            requestKey,
          });
      });
    return () => {
      active = false;
    };
  }, [debouncedQuery, status, pageNumber, limit, retry, requestKey]);

  const page =
    currentLoadState.status === "ready" ? currentLoadState.page : null;
  const studentCount = page?.pagination.total;
  const totalPages = page?.pagination.totalPages ?? 0;
  const activePage = page?.pagination.page ?? pageNumber;

  return (
    <div className="admin-view student-records-view">
      <header className="admin-page-header student-page-header">
        <div>
          <p className="admin-eyebrow">Pusat data siswa</p>
          <h1>Data siswa</h1>
          <p>
            Temukan profil siswa aktif yang tercatat pada database sekolah.
          </p>
        </div>
        <button
          className="button button-dark icon-button"
          onClick={() =>
            notify(
              "Pencatatan siswa manual belum tersedia di backend. Data tidak disimpan secara lokal.",
              "warning",
            )
          }
        >
          <UserPlus size={16} /> Tambah siswa offline
        </button>
      </header>

      <section
        className="student-ledger-summary"
        aria-label="Ringkasan data siswa"
      >
        <article className="student-summary-main">
          <div>
            <span>Total sesuai filter</span>
            <strong>
              {currentLoadState.status === "loading"
                ? "…"
                : currentLoadState.status === "error"
                  ? "—"
                  : studentCount?.toLocaleString("id-ID")}
            </strong>
            <small>
              {status === "active" ? "Siswa aktif" : "Siswa nonaktif"}
            </small>
          </div>
          <UsersRound size={30} />
        </article>
        <article>
          <div>
            <strong>
              {currentLoadState.status === "ready" ? page?.items.length : "—"}
            </strong>
            <span>Di halaman ini</span>
          </div>
        </article>
        <article>
          <div>
            <strong>
              {currentLoadState.status === "ready" ? activePage : "—"}
            </strong>
            <span>Halaman</span>
          </div>
        </article>
        <article>
          <div>
            <strong>
              {currentLoadState.status === "ready" ? totalPages : "—"}
            </strong>
            <span>Total halaman</span>
          </div>
        </article>
      </section>

      <section className="student-ledger-panel">
        <div className="student-ledger-heading">
          <div>
            <p className="admin-eyebrow">Direktori aktif</p>
            <h2>Semua siswa</h2>
          </div>
          <span>
            {currentLoadState.status === "ready"
              ? `${currentLoadState.page.items.length} data ditampilkan`
              : currentLoadState.status === "loading"
                ? "Memuat data siswa…"
                : "Data belum tersedia"}
          </span>
        </div>
        <div className="student-ledger-toolbar">
          <label className="admin-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama siswa..."
              aria-label="Cari nama siswa"
            />
          </label>
          <div className="student-selects">
            <label>
              Status
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as StudentStatus);
                  setPageNumber(1);
                }}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </label>
            <label>
              Per halaman
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPageNumber(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>
        </div>

        {currentLoadState.status === "loading" ? (
          <div className="student-empty" role="status" aria-live="polite">
            <Search size={25} />
            <h3>Memuat data siswa</h3>
            <p>Mengambil daftar dari database sekolah.</p>
          </div>
        ) : currentLoadState.status === "error" ? (
          <div className="student-empty" role="alert">
            <Search size={25} />
            <h3>Data siswa gagal dimuat</h3>
            <p>{currentLoadState.message}</p>
            <button
              className="button button-dark"
              onClick={() => setRetry((current) => current + 1)}
            >
              Coba lagi
            </button>
          </div>
        ) : currentLoadState.page.items.length ? (
          <>
            <div className="student-ledger">
              <div className="student-ledger-labels">
                <span>Siswa</span>
                <span>Asal data</span>
                <span>Tanggal tercatat</span>
                <span>Status</span>
                <span />
              </div>
              {currentLoadState.page.items.map((student, index) => (
                <button
                  className="student-ledger-row"
                  onClick={() => setSelectedId(student.id)}
                  key={student.id}
                  type="button"
                  aria-label={`Lihat detail ${student.studentName}`}
                >
                  <span className={`student-avatar student-tone-${index % 4}`}>
                    {studentInitials(student.studentName)}
                  </span>
                  <span className="student-identity">
                    <b>{student.studentName}</b>
                    <small>ID siswa · {student.id}</small>
                  </span>
                  <span className="student-source">Database</span>
                  <span className="student-document-progress">
                    <b>
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(student.officiallyRegisteredAt))}
                    </b>
                    <small>tercatat resmi</small>
                  </span>
                  <span className={`status status-${student.status}`}>
                    {student.status === "active" ? "Aktif" : "Nonaktif"}
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
            <nav className="student-ledger-heading" aria-label="Pagination siswa">
              <button
                className="button admin-button-muted"
                type="button"
                disabled={activePage <= 1}
                onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft size={15} /> Sebelumnya
              </button>
              <span>
                Halaman {activePage} dari {totalPages}
              </span>
              <button
                className="button admin-button-muted"
                type="button"
                disabled={activePage >= totalPages}
                onClick={() => setPageNumber((current) => current + 1)}
              >
                Berikutnya <ChevronRight size={15} />
              </button>
            </nav>
          </>
        ) : (
          <div className="student-empty">
            <Search size={25} />
            <h3>
              {debouncedQuery
                ? "Data siswa tidak ditemukan"
                : "Belum ada siswa pada status ini"}
            </h3>
            <p>
              {debouncedQuery
                ? "Coba ubah kata pencarian."
                : "Data siswa resmi akan tampil di sini setelah daftar ulang selesai."}
            </p>
          </div>
        )}
      </section>

      {selectedId && (
        <StudentDetailDrawer
          studentId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
