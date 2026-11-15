"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api-client";
import { getStudent, type StudentRecord } from "../../lib/api/students";
import { DialogPortal } from "../DialogPortal";
import { formatDate, studentInitials } from "./shared";

function formatError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401)
      return "Sesi Admin tidak valid atau telah berakhir. Silakan masuk kembali.";
    if (error.status === 403)
      return "Akun Admin tidak memiliki izin melihat detail siswa.";
    if (error.status === 404) return "Data siswa tidak ditemukan.";
    if (error.status === 409)
      return "Data siswa berubah. Tutup detail dan muat ulang daftar.";
    return error.message;
  }
  return error instanceof Error ? error.message : "Detail siswa gagal dimuat.";
}

export function StudentDetailDrawer({
  studentId,
  onClose,
}: {
  studentId: string;
  onClose: () => void;
}) {
  const [state, setState] = useState<
    | { status: "loading"; studentId: string }
    | { status: "ready"; studentId: string; student: StudentRecord }
    | { status: "error"; studentId: string; message: string }
  >({ status: "loading", studentId });
  const currentState =
    state.studentId === studentId ? state : { status: "loading" as const };

  useEffect(() => {
    let active = true;
    void getStudent(studentId)
      .then((student) => {
        if (active) setState({ status: "ready", studentId, student });
      })
      .catch((error: unknown) => {
        if (active)
          setState({
            status: "error",
            studentId,
            message: formatError(error),
          });
      });
    return () => {
      active = false;
    };
  }, [studentId]);

  const student = currentState.status === "ready" ? currentState.student : null;
  const details: [string, string | null][] = student
    ? [
        ["ID siswa", student.id],
        ["NISN", student.nisn],
        [
          "Tempat, tanggal lahir",
          [student.birthPlace, formatDate(student.birthDate ?? undefined)]
            .filter(Boolean)
            .join(", "),
        ],
        ["Jenis kelamin", student.gender],
        ["Alamat", student.address],
        ["Tanggal resmi tercatat", formatDate(student.officiallyRegisteredAt)],
      ]
    : [];

  return (
    <DialogPortal
      className="admin-drawer-backdrop student-drawer-backdrop"
      dialogClassName="student-profile-drawer"
      labelledBy="student-detail-title"
      onClose={onClose}
    >
      <button
        className="drawer-close"
        onClick={onClose}
        aria-label="Tutup detail"
        type="button"
      >
        <X size={18} />
      </button>
      {student ? (
        <>
          <div className="student-profile-hero">
            <span className="student-profile-avatar">
              {studentInitials(student.studentName)}
            </span>
            <div>
              <p className="admin-eyebrow">Profil siswa · database</p>
              <h2 id="student-detail-title">{student.studentName}</h2>
              <span className="student-source">
                {student.status === "active" ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          </div>
          <section className="student-profile-section">
            <h3>Biodata siswa</h3>
            <dl className="student-detail-grid">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "Belum dicatat"}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      ) : (
        <div
          className="student-empty"
          role={currentState.status === "error" ? "alert" : "status"}
        >
          <h3 id="student-detail-title">
            {currentState.status === "loading"
              ? "Memuat detail siswa"
              : "Detail siswa gagal dimuat"}
          </h3>
          <p>
            {currentState.status === "error"
              ? currentState.message
              : "Mengambil biodata dari database sekolah."}
          </p>
        </div>
      )}
    </DialogPortal>
  );
}
