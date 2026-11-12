"use client";
import { useState } from "react";
import { FileCheck2, Upload } from "lucide-react";
import { documentLabels } from "../../lib/cms/student-documents";
import type { DocumentRequirements, UploadDocumentKind } from "../../lib/api/applications/types";
import { validateDemoFile } from "../../lib/registration-files";
import { FilePreview } from "./FilePreview";

export type SelectedFiles = Partial<Record<UploadDocumentKind, File>>;
type Props = {
  files: SelectedFiles;
  setFiles: (files: SelectedFiles) => void;
  requirements: DocumentRequirements;
};

export function requiredDocumentKinds(requirements: DocumentRequirements) {
  return new Set(requirements.requiredKinds.filter((kind) => kind !== "kip"));
}

export function areRequiredFilesComplete(
  files: SelectedFiles,
  requirements: DocumentRequirements,
) {
  const required = requiredDocumentKinds(requirements);
  for (const kind of required) {
    if (!files[kind]) return false;
  }
  if (
    requirements.requireOneGraduationDocument &&
    !files.skl &&
    !files.ijazah
  ) return false;
  return true;
}

export function DocumentFields({ files, setFiles, requirements }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<File | null>(null);
  const required = requiredDocumentKinds(requirements);
  return (
    <fieldset>
      <legend>03 - Berkas pendaftaran</legend>
      <p className="form-help">
        Unggah PDF, JPG, atau PNG dengan ukuran maksimal 5 MiB per berkas.
        Berkas wajib mengikuti pengaturan sekolah. PIP/KIP selalu opsional.
      </p>
      <div className="registration-upload-grid">
        {documentLabels.filter((doc) => doc.key !== "photo").map(({ key, label }) => {
          const kind = key as UploadDocumentKind;
          const graduationChoice = requirements.requireOneGraduationDocument && (kind === "skl" || kind === "ijazah");
          const isRequired = (kind !== "kip" && required.has(kind)) || graduationChoice;
          return (
            <article key={key} className={files[kind] ? "upload-card has-file" : "upload-card"}>
              <div className="upload-card-heading">
                {files[kind] ? <FileCheck2 size={22} /> : <Upload size={22} />}
                <div>
                  <h3>{label}</h3>
                  <small>
                    {key === "skl" || key === "ijazah"
                      ? requirements.requireOneGraduationDocument
                        ? "Salah satu SKL atau ijazah wajib dipilih"
                        : "Sesuai pengaturan sekolah"
                      : key === "kip"
                        ? "Opsional, tidak dapat diwajibkan"
                        : isRequired
                          ? "Wajib sesuai pengaturan sekolah"
                          : "Opsional sesuai pengaturan sekolah"}
                  </small>
                  {isRequired && <span className="document-required-label">Wajib</span>}
                </div>
              </div>
              <label>
                Pilih berkas {label}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  aria-describedby={errors[key] ? "file-error-" + key : undefined}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    const error = validateDemoFile(file);
                    setErrors((current) => ({ ...current, [key]: error }));
                    if (!error) setFiles({ ...files, [kind]: file });
                  }}
                />
              </label>
              {errors[key] && <p className="form-error" id={"file-error-" + key} role="alert">{errors[key]}</p>}
              {files[kind] && (
                <>
                  <p className="selected-file">
                    {files[kind]!.name}
                    <small>{Math.ceil(files[kind]!.size / 1024)} KB · Siap dikirim bersama formulir</small>
                  </p>
                  <div className="file-actions">
                    <button type="button" onClick={() => setPreview(files[kind]!)}>Pratinjau {label}</button>
                    <button type="button" onClick={() => {
                      const next = { ...files };
                      delete next[kind];
                      setFiles(next);
                      setErrors((current) => ({ ...current, [key]: "" }));
                    }}>Hapus {label}</button>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
      {preview && <FilePreview file={preview} close={() => setPreview(null)} />}
    </fieldset>
  );
}
