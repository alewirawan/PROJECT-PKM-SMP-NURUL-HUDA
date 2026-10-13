"use client";

import { FileCheck2, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  createStudentDocuments,
  type Application,
  type ApplicationStatus,
  type StudentDocument,
} from "../../lib/local-cms";
import { useCatalog } from "../../lib/use-catalog";
import { emptyOfflineForm, statusOptions } from "./shared";

export function OfflineStudentForm({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (record: Application) => void;
}) {
  const { clubs } = useCatalog();
  const [form, setForm] = useState(emptyOfflineForm);
  const [saveError, setSaveError] = useState("");
  const [availableDocuments, setAvailableDocuments] = useState<
    StudentDocument["key"][]
  >(["kk", "akta"]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.querySelector<HTMLElement>(".student-entry-form input")?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  function close() {
    onClose();
  }

  function saveOfflineStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = `NH-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    try {
      onSave({
        ...form,
        id,
        registrationSource: "Offline",
        documents: createStudentDocuments("Offline", [], availableDocuments),
        submittedAt: new Date().toISOString(),
      });
    } catch {
      setSaveError(
        "Penyimpanan gagal. Isian tetap tersedia, silakan coba kembali.",
      );
      return;
    }
    setSaveError("");
    setForm(emptyOfflineForm);
    setAvailableDocuments(["kk", "akta"]);
    onClose();
  }

  if (!open) return null;
  return createPortal(
    <div className="student-entry-backdrop">
      <button
        className="dialog-scrim"
        type="button"
        onClick={() => close()}
        aria-label="Tutup formulir"
      />
      <form
        className="student-entry-form"
        onSubmit={saveOfflineStudent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="offline-student-title"
      >
        <header>
          <div>
            <p className="admin-eyebrow">Meja penerimaan</p>
            <h2 id="offline-student-title">Tambah siswa offline</h2>
            <span>
              Simulasi lokal: gunakan data dummy. Checklist hanya mencatat
              penerimaan berkas fisik, bukan upload.
            </span>
          </div>
          <button type="button" onClick={() => close()} aria-label="Tutup">
            <X size={18} />
          </button>
        </header>
        <div className="student-entry-scroll">
          {saveError && (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          )}
          <fieldset>
            <legend>Identitas siswa</legend>
            <div className="admin-form-grid">
              <label className="span-2">
                Nama lengkap
                <input
                  required
                  value={form.studentName}
                  onChange={(event) =>
                    setForm({ ...form, studentName: event.target.value })
                  }
                />
              </label>
              <label>
                NISN
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  minLength={10}
                  maxLength={10}
                  title="NISN harus terdiri dari 10 angka"
                  value={form.nisn}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      nisn: event.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </label>
              <label>
                Jenis kelamin
                <select
                  value={form.gender}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      gender: event.target.value as typeof form.gender,
                    })
                  }
                >
                  <option>Laki-laki</option>
                  <option>Perempuan</option>
                </select>
              </label>
              <label>
                Tempat lahir
                <input
                  required
                  value={form.birthPlace}
                  onChange={(event) =>
                    setForm({ ...form, birthPlace: event.target.value })
                  }
                />
              </label>
              <label>
                Tanggal lahir
                <input
                  required
                  type="date"
                  value={form.birthDate}
                  onChange={(event) =>
                    setForm({ ...form, birthDate: event.target.value })
                  }
                />
              </label>
              <label className="span-2">
                Asal sekolah
                <input
                  required
                  value={form.originSchool}
                  onChange={(event) =>
                    setForm({ ...form, originSchool: event.target.value })
                  }
                />
              </label>
              <label className="span-2">
                Alamat
                <textarea
                  required
                  rows={2}
                  value={form.address}
                  onChange={(event) =>
                    setForm({ ...form, address: event.target.value })
                  }
                />
              </label>
              <label>
                Ekstrakurikuler
                <select
                  value={form.extracurricular}
                  onChange={(event) =>
                    setForm({ ...form, extracurricular: event.target.value })
                  }
                >
                  <option>Belum menentukan</option>
                  {clubs
                    .filter((c) => c.active)
                    .map((c) => (
                      <option key={c.id}>{c.name}</option>
                    ))}
                </select>
              </label>
              <label>
                Status awal
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as ApplicationStatus,
                    })
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Orang tua & kontak</legend>
            <div className="admin-form-grid">
              <label>
                Nama orang tua / wali
                <input
                  required
                  value={form.parentName}
                  onChange={(event) =>
                    setForm({ ...form, parentName: event.target.value })
                  }
                />
              </label>
              <label>
                Pekerjaan
                <input
                  required
                  value={form.parentOccupation}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      parentOccupation: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Nomor WhatsApp
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  pattern="[0-9+() -]{8,20}"
                  title="Masukkan nomor telepon yang valid"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                />
              </label>
              <label>
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                />
              </label>
              <label className="span-2">
                Catatan
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  placeholder="Catatan untuk panitia PPDB"
                />
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Dokumen yang diterima</legend>
            <div className="offline-document-checks">
              {createStudentDocuments("Offline").map((document) => (
                <label key={document.key}>
                  <input
                    type="checkbox"
                    checked={availableDocuments.includes(document.key)}
                    onChange={(event) =>
                      setAvailableDocuments((current) =>
                        event.target.checked
                          ? [...current, document.key]
                          : current.filter((key) => key !== document.key),
                      )
                    }
                  />
                  <span>
                    <FileCheck2 size={16} />
                    <b>{document.label}</b>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <footer>
          <button
            type="button"
            className="button admin-button-muted"
            onClick={() => close()}
          >
            Batal
          </button>
          <button className="button button-accent" type="submit">
            Simpan data siswa →
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
