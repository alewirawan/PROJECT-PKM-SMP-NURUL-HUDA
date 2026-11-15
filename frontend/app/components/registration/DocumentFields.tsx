"use client";
import { useState } from "react";
import { FileCheck2, Upload } from "lucide-react";
import { documentLabels } from "../../lib/cms/student-documents";
import type { StudentDocument } from "../../lib/cms/types";
import type { DocumentRequirements } from "../../lib/cms/types";
import { validateRegistrationFile } from "../../lib/registration-files";
import { FilePreview } from "./FilePreview";
export type SelectedFiles = Partial<Record<StudentDocument["key"], File>>;

function requirementLabel(
  key: StudentDocument["key"],
  requirements: DocumentRequirements,
) {
  if (
    requirements.requiredKinds.includes(
      key as (typeof requirements.requiredKinds)[number],
    )
  )
    return "Wajib";
  if (
    (key === "skl" || key === "ijazah") &&
    requirements.requireOneGraduationDocument &&
    !requirements.requiredKinds.some(
      (kind) => kind === "skl" || kind === "ijazah",
    )
  )
    return "Wajib pilih salah satu";
  return "Opsional";
}

export function DocumentFields({
  files,
  setFiles,
  requirements,
}: {
  files: SelectedFiles;
  setFiles: (files: SelectedFiles) => void;
  requirements: DocumentRequirements;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<File | null>(null);
  return (
    <fieldset>
      <legend>03 - Berkas pendaftaran</legend>
      <p className="form-help">
        PDF, JPG, atau PNG; maksimal 5 MB per berkas. Persyaratan mengikuti
        pengaturan PPDB terbaru dari sekolah. PIP/KIP selalu opsional.
      </p>
      <div className="registration-upload-grid">
        {documentLabels.map(({ key, label }) => (
          <article
            key={key}
            className={files[key] ? "upload-card has-file" : "upload-card"}
          >
            <div className="upload-card-heading">
              {files[key] ? <FileCheck2 size={22} /> : <Upload size={22} />}
              <div>
                <h3>{label}</h3>
                <small>{requirementLabel(key, requirements)}</small>
              </div>
            </div>
            <label>
              Pilih berkas {label}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                aria-describedby={errors[key] ? "file-error-" + key : undefined}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  const error = validateRegistrationFile(file);
                  setErrors((current) => ({ ...current, [key]: error }));
                  if (!error) setFiles({ ...files, [key]: file });
                }}
              />
            </label>
            {errors[key] && (
              <p className="form-error" id={"file-error-" + key} role="alert">
                {errors[key]}
              </p>
            )}
            {files[key] && (
              <>
                <p className="selected-file">
                  {files[key]!.name}
                  <small>
                    {Math.ceil(files[key]!.size / 1024)} KB · Akan dikirim
                    dengan formulir
                  </small>
                </p>
                <div className="file-actions">
                  <button type="button" onClick={() => setPreview(files[key]!)}>
                    Pratinjau {label}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...files };
                      delete next[key];
                      setFiles(next);
                      setErrors((current) => ({ ...current, [key]: "" }));
                    }}
                  >
                    Hapus {label}
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
      {preview && <FilePreview file={preview} close={() => setPreview(null)} />}
    </fieldset>
  );
}
