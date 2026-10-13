"use client";

import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Search,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  normalizeDocuments,
  requiredDocumentsComplete,
  saveApplications,
  type Application,
  type ApplicationStatus,
  type RegistrationSource,
  type StudentDocument,
} from "../lib/local-cms";
import { OfflineStudentForm } from "./student-records/OfflineStudentForm";
import { StudentProfileDrawer } from "./student-records/StudentProfileDrawer";
import {
  completedDocuments,
  SourceBadge,
  studentInitials,
} from "./student-records/shared";

type Props = {
  applications: Application[];
  setApplications: (value: Application[]) => void;
  notify: (message: string, tone?: "success" | "warning") => void;
};

export function StudentRecordsModule({
  applications,
  setApplications,
  notify,
}: Props) {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<
    "Semua" | RegistrationSource
  >("Semua");
  const [documentFilter, setDocumentFilter] = useState<
    "Semua" | "Lengkap" | "Belum lengkap"
  >("Semua");
  const [selected, setSelected] = useState<Application | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const records = useMemo(
    () =>
      applications.filter((student) => {
        const needle = query.trim().toLowerCase();
        const matchesQuery =
          !needle ||
          [
            student.studentName,
            student.id,
            student.nisn,
            student.originSchool,
            student.parentName,
          ].some((value) => value?.toLowerCase().includes(needle));
        const matchesSource =
          sourceFilter === "Semua" ||
          (student.registrationSource ?? "Website") === sourceFilter;
        const isComplete = requiredDocumentsComplete(student.documents);
        const matchesDocuments =
          documentFilter === "Semua" ||
          (documentFilter === "Lengkap" ? isComplete : !isComplete);
        return matchesQuery && matchesSource && matchesDocuments;
      }),
    [applications, query, sourceFilter, documentFilter],
  );

  const websiteCount = applications.filter(
    (item) => (item.registrationSource ?? "Website") === "Website",
  ).length;
  const offlineCount = applications.length - websiteCount;
  const completeCount = applications.filter((item) =>
    requiredDocumentsComplete(item.documents),
  ).length;

  function updateStatus(id: string, status: ApplicationStatus) {
    const next = applications.map((item) =>
      item.id === id ? { ...item, status } : item,
    );
    try {
      saveApplications(next);
    } catch {
      notify("Penyimpanan gagal. Status belum berubah.", "warning");
      return;
    }
    setApplications(next);
    setSelected((item) => (item?.id === id ? { ...item, status } : item));
    notify("Status siswa berhasil diperbarui.");
  }

  function reviewDocument(
    id: string,
    key: StudentDocument["key"],
    patch: Partial<Pick<StudentDocument, "status" | "reviewNote">>,
  ) {
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
      notify("Penyimpanan gagal. Pemeriksaan belum disimpan.", "warning");
      return;
    }
    setApplications(next);
    setSelected(next.find((item) => item.id === id) ?? null);
    notify("Pemeriksaan berkas simulasi disimpan.");
  }

  function saveOfflineStudent(record: Application) {
    const next = [record, ...applications];
    saveApplications(next);
    setApplications(next);
    setSelected(record);
    notify("Data siswa offline berhasil ditambahkan.");
  }

  return (
    <div className="admin-view student-records-view">
      <header className="admin-page-header student-page-header">
        <div>
          <p className="admin-eyebrow">Pusat data siswa</p>
          <h1>Data siswa</h1>
          <p>
            Temukan profil, jalur pendaftaran, dan kelengkapan berkas dalam satu
            tampilan.
          </p>
        </div>
        <button
          className="button button-dark icon-button"
          onClick={() => setFormOpen(true)}
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
            <span>Total calon siswa</span>
            <strong>{applications.length}</strong>
            <small>Tahun ajaran aktif</small>
          </div>
          <UsersRound size={30} />
        </article>
        <article>
          <Globe2 size={19} />
          <div>
            <strong>{websiteCount}</strong>
            <span>Dari website</span>
          </div>
        </article>
        <article>
          <Building2 size={19} />
          <div>
            <strong>{offlineCount}</strong>
            <span>Daftar offline</span>
          </div>
        </article>
        <article>
          <CheckCircle2 size={19} />
          <div>
            <strong>{completeCount}</strong>
            <span>Berkas lengkap</span>
          </div>
        </article>
      </section>

      <section className="student-ledger-panel">
        <div className="student-ledger-heading">
          <div>
            <p className="admin-eyebrow">Direktori aktif</p>
            <h2>Semua calon siswa</h2>
          </div>
          <span>{records.length} data ditampilkan</span>
        </div>
        <div className="student-ledger-toolbar">
          <label className="admin-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, NISN, nomor, atau sekolah..."
            />
          </label>
          <div className="student-selects">
            <label>
              Sumber
              <select
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(event.target.value as typeof sourceFilter)
                }
              >
                <option>Semua</option>
                <option>Website</option>
                <option>Offline</option>
              </select>
            </label>
            <label>
              Dokumen
              <select
                value={documentFilter}
                onChange={(event) =>
                  setDocumentFilter(event.target.value as typeof documentFilter)
                }
              >
                <option>Semua</option>
                <option>Lengkap</option>
                <option>Belum lengkap</option>
              </select>
            </label>
          </div>
        </div>
        {records.length ? (
          <div className="student-ledger">
            <div className="student-ledger-labels">
              <span>Siswa</span>
              <span>Asal pendaftaran</span>
              <span>Kelengkapan</span>
              <span>Status</span>
              <span />
            </div>
            {records.map((student, index) => {
              const complete = completedDocuments(student.documents);
              return (
                <button
                  className="student-ledger-row"
                  onClick={() => setSelected(student)}
                  key={student.id}
                >
                  <span className={`student-avatar student-tone-${index % 4}`}>
                    {studentInitials(student.studentName)}
                  </span>
                  <span className="student-identity">
                    <b>{student.studentName}</b>
                    <small>
                      {student.id} · NISN {student.nisn || "belum dicatat"}
                    </small>
                    <em>{student.originSchool}</em>
                  </span>
                  <SourceBadge source={student.registrationSource} />
                  <span className="student-document-progress">
                    <span>
                      <i
                        style={{
                          width: `${Math.min(100, (complete / normalizeDocuments(student.documents).length) * 100)}%`,
                        }}
                      />
                    </span>
                    <b>
                      {complete}/{normalizeDocuments(student.documents).length}
                    </b>
                    <small>dokumen</small>
                  </span>
                  <span
                    className={`status status-${student.status.toLowerCase()}`}
                  >
                    {student.status}
                  </span>
                  <ChevronRight size={18} />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="student-empty">
            <Search size={25} />
            <h3>Data siswa tidak ditemukan</h3>
            <p>Coba ubah kata pencarian atau filter yang dipilih.</p>
          </div>
        )}
      </section>

      {selected && (
        <StudentProfileDrawer
          student={selected}
          onClose={() => setSelected(null)}
          updateStatus={updateStatus}
          reviewDocument={reviewDocument}
        />
      )}

      <OfflineStudentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={saveOfflineStudent}
      />
    </div>
  );
}
