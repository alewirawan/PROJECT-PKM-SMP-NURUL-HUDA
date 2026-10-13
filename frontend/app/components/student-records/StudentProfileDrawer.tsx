"use client";
import { useState } from "react";
import { X } from "lucide-react";
import type { Application, ApplicationStatus } from "../../lib/local-cms";
import { DialogPortal } from "../DialogPortal";
import { DocumentReview, type ReviewDocument } from "./DocumentReview";
import {
  formatDate,
  SourceBadge,
  statusOptions,
  studentInitials,
} from "./shared";
export function StudentProfileDrawer({
  student,
  onClose,
  updateStatus,
  reviewDocument,
}: {
  student: Application;
  onClose: () => void;
  updateStatus: (id: string, status: ApplicationStatus) => void;
  reviewDocument: ReviewDocument;
}) {
  const [tab, setTab] = useState(0);
  const tabs = ["Biodata", "Orang tua/wali", "Berkas", "Status pendaftaran"];
  const identity = [
    ["Nomor pendaftaran", student.id],
    ["NISN", student.nisn],
    [
      "Tempat, tanggal lahir",
      (student.birthPlace ?? "—") + ", " + formatDate(student.birthDate),
    ],
    ["Jenis kelamin", student.gender],
    ["Asal sekolah", student.originSchool],
    ["Ekstrakurikuler", student.extracurricular ?? "Belum menentukan"],
    ["Alamat", student.address],
  ];
  const family = [
    ["Nama orang tua/wali", student.parentName],
    ["Pekerjaan", student.parentOccupation],
    ["WhatsApp", student.phone],
    ["Email", student.email],
  ];
  return (
    <DialogPortal
      className="admin-drawer-backdrop student-drawer-backdrop"
      dialogClassName="student-profile-drawer"
      labelledBy="student-profile-title"
      onClose={onClose}
    >
      <button
        className="drawer-close"
        onClick={onClose}
        aria-label="Tutup detail"
      >
        <X size={18} />
      </button>
      <div className="student-profile-hero">
        <span className="student-profile-avatar">
          {studentInitials(student.studentName)}
        </span>
        <div>
          <p className="admin-eyebrow">Profil calon siswa · simulasi</p>
          <h2 id="student-profile-title">{student.studentName}</h2>
          <SourceBadge source={student.registrationSource} />
        </div>
      </div>
      <div
        className="profile-tabbar"
        role="tablist"
        aria-label="Detail calon siswa"
      >
        {tabs.map((label, index) => (
          <button
            type="button"
            key={label}
            role="tab"
            id={"student-tab-" + index}
            aria-controls={"student-panel-" + index}
            aria-selected={tab === index}
            tabIndex={tab === index ? 0 : -1}
            onClick={() => setTab(index)}
            onKeyDown={(e) => {
              if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? 3
                      : (index + (e.key === "ArrowRight" ? 1 : 3)) % 4;
                setTab(next);
                document.getElementById("student-tab-" + next)?.focus();
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {tabs.map((label, index) => (
        <div
          key={label}
          role="tabpanel"
          id={"student-panel-" + index}
          aria-labelledby={"student-tab-" + index}
          hidden={tab !== index}
        >
          {index < 2 && (
            <section className="student-profile-section">
              <h3>{label}</h3>
              <dl className="student-detail-grid">
                {(index === 0 ? identity : family).map(([name, value]) => (
                  <div key={name}>
                    <dt>{name}</dt>
                    <dd>{value || "Belum dicatat"}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {index === 2 && (
            <DocumentReview student={student} review={reviewDocument} />
          )}
          {index === 3 && (
            <section className="student-profile-section">
              <h3>Status pendaftaran</h3>
              <p>
                Masuk {formatDate(student.submittedAt)}. Verifikasi berkas tidak
                otomatis mengubah keputusan penerimaan.
              </p>
              <label>
                Status penerimaan
                <select
                  value={student.status}
                  onChange={(e) =>
                    updateStatus(
                      student.id,
                      e.target.value as ApplicationStatus,
                    )
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <aside className="student-note">
                <b>Catatan panitia</b>
                <p>{student.notes || "Belum ada catatan."}</p>
              </aside>
            </section>
          )}
        </div>
      ))}
    </DialogPortal>
  );
}
