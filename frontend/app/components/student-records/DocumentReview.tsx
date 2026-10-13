"use client";
import { useState } from "react";
import { normalizeDocuments } from "../../lib/cms/student-documents";
import type { Application, StudentDocument } from "../../lib/cms/types";
import { getDemoFile } from "../../lib/registration-files";
import { FilePreview } from "../registration/FilePreview";
export type ReviewDocument = (
  id: string,
  key: StudentDocument["key"],
  patch: Partial<Pick<StudentDocument, "status" | "reviewNote">>,
) => void;
export function DocumentReview({
  student,
  review,
}: {
  student: Application;
  review: ReviewDocument;
}) {
  const [preview, setPreview] = useState<File | null>(null);
  const documents = normalizeDocuments(student.documents);
  return (
    <section className="student-profile-section">
      <h3>Berkas pendaftaran</h3>
      <p className="form-help">
        Pemeriksaan simulasi, terpisah dari status penerimaan. Pratinjau file
        hanya tersedia pada tab yang sama sebelum refresh. Nama file contoh
        tidak berarti file sudah diunggah.
      </p>
      <p>
        {documents.filter((d) => d.fileName).length}/{documents.length} jenis
        berkas dicatat. PIP/KIP opsional; SKL atau ijazah cukup salah satu. Pas
        foto lama tetap disimpan jika tersedia.
      </p>
      <div className="document-review-grid">
        {documents.map((doc) => {
          const file = getDemoFile(student.id, doc.key);
          return (
            <article className="document-review-card" key={doc.key}>
              <header>
                <h4>{doc.label}</h4>
                <span
                  className={
                    "document-badge " +
                    (doc.status === "Terverifikasi" ? "verified" : "")
                  }
                >
                  {doc.status}
                </span>
              </header>
              <p className="selected-file">
                {doc.fileName ?? "Belum ada berkas"}
              </p>
              {file ? (
                <button type="button" onClick={() => setPreview(file)}>
                  Pratinjau {doc.label}
                </button>
              ) : (
                <small>
                  {doc.fileName
                    ? "File contoh / pratinjau tidak tersedia setelah refresh."
                    : "Belum dilampirkan oleh pendaftar."}
                </small>
              )}
              <label>
                Status {doc.label}
                <select
                  disabled={!doc.fileName}
                  value={doc.status}
                  onChange={(e) =>
                    review(student.id, doc.key, {
                      status: e.target.value as StudentDocument["status"],
                    })
                  }
                >
                  {!doc.fileName && <option>Belum ada</option>}
                  <option>Menunggu pemeriksaan</option>
                  <option>Terverifikasi</option>
                  <option>Perlu perbaikan</option>
                </select>
              </label>
              <label>
                Catatan {doc.label}
                <textarea
                  key={student.id + doc.key + (doc.reviewNote ?? "")}
                  defaultValue={doc.reviewNote ?? ""}
                  maxLength={400}
                  rows={2}
                  placeholder="Contoh: tulisan pada berkas belum terbaca."
                  onBlur={(e) => {
                    if (e.target.value !== (doc.reviewNote ?? ""))
                      review(student.id, doc.key, {
                        reviewNote: e.target.value,
                      });
                  }}
                />
              </label>
            </article>
          );
        })}
      </div>
      {preview && <FilePreview file={preview} close={() => setPreview(null)} />}
    </section>
  );
}
