"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../lib/api-client";
import { getMyApplication } from "../../lib/api/applications/self-service";
import { replaceMyDocument } from "../../lib/api/documents";
import type {
  ApplicantDocument,
  ApplicantRecord,
  UploadDocumentKind,
} from "../../lib/api/applications/types";
import { validateDemoFile } from "../../lib/registration-files";

const allowedKinds: UploadDocumentKind[] = [
  "skl",
  "ijazah",
  "kk",
  "ktp",
  "kip",
  "akta",
];

export function ApplicantPortal() {
  const [record, setRecord] = useState<ApplicantRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadingKind, setUploadingKind] =
    useState<UploadDocumentKind | null>(null);
  const [success, setSuccess] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setRecord(await getMyApplication());
    } catch (reason) {
      setRecord(null);

      if (reason instanceof ApiError && reason.status === 401) {
        setError(
          "Sesi pendaftar belum tersedia atau sudah berakhir. Silakan masuk melalui alur akun pendaftar yang disediakan Anggota 09.",
        );
      } else {
        setError(
          reason instanceof Error
            ? reason.message
            : "Data pendaftar gagal dimuat.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getMyApplication()
      .then((application) => {
        if (active) {
          setRecord(application);
        }
      })
      .catch((reason: unknown) => {
        if (!active) return;

        setRecord(null);

        if (reason instanceof ApiError && reason.status === 401) {
          setError(
            "Sesi pendaftar belum tersedia atau sudah berakhir. Silakan masuk melalui alur akun pendaftar yang disediakan Anggota 09.",
          );
        } else {
          setError(
            reason instanceof Error
              ? reason.message
              : "Data pendaftar gagal dimuat.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleReplacement(
    kind: UploadDocumentKind,
    file?: File,
  ) {
    if (!file) return;

    const validation = validateDemoFile(file);

    if (validation) {
      setError(validation);
      return;
    }

    setUploadingKind(kind);
    setError("");
    setSuccess("");

    try {
      const updated = await replaceMyDocument(kind, file);

      setRecord((current) =>
        current
          ? {
              ...current,
              documents: current.documents.map((document) =>
                document.kind === kind ? updated : document,
              ),
            }
          : current,
      );

      setSuccess(
        `${updated.label} berhasil dikirim dan menunggu pemeriksaan ulang.`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Penggantian berkas gagal dikirim.",
      );
    } finally {
      setUploadingKind(null);
    }
  }

  return (
    <section className="applicant-portal">
      <div className="section-heading">
        <p className="section-kicker">Area pribadi</p>
        <h2>Menu Pendaftar</h2>
        <p>
          Informasi di halaman ini hanya dimuat berdasarkan sesi akun
          pendaftar, bukan nomor pendaftaran di alamat URL.
        </p>
      </div>

      {loading && <p role="status">Memuat data pendaftaran...</p>}

      {error && <p className="form-error" role="alert">{error}</p>}

      {success && <p className="form-success" role="status">{success}</p>}

      {record && (
        <div className="applicant-portal-card">
          <div className="applicant-portal-summary">
            <div>
              <small>Nomor pendaftaran</small>
              <h3>{record.id}</h3>
            </div>

            <div>
              <small>Status pendaftaran</small>
              <p className="applicant-status">{record.status}</p>
            </div>
          </div>

          <h3>Status berkas</h3>

          <div className="applicant-portal-grid">
            {record.documents
              .filter((document: ApplicantDocument) =>
                allowedKinds.includes(document.kind),
              )
              .map((document) => {
                const canReplace =
                  document.status === "Belum ada" ||
                  document.status === "Perlu perbaikan";

                return (
                  <article
                    className="applicant-document-row"
                    key={document.id}
                  >
                    <strong>{document.label}</strong>

                    <p>
                      <span className="applicant-status">
                        {document.status}
                      </span>
                    </p>

                    {document.hasFile && document.fileName && (
                      <p className="form-help">
                        Berkas: {document.fileName}
                      </p>
                    )}

                    {document.reviewNote && (
                      <p className="applicant-note">
                        Catatan pemeriksaan: {document.reviewNote}
                      </p>
                    )}

                    {canReplace ? (
                      <label>
                        {document.status === "Perlu perbaikan"
                          ? "Pilih berkas perbaikan"
                          : "Lengkapi berkas"}

                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          disabled={uploadingKind !== null}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            void handleReplacement(document.kind, file);
                          }}
                        />

                        <small>
                          PDF, JPG, atau PNG; maksimal 5 MiB.
                        </small>
                      </label>
                    ) : document.status === "Terverifikasi" ? (
                      <p className="form-help">
                        Berkas sudah terverifikasi dan terkunci. Hubungi
                        admin jika perlu tindakan lebih lanjut.
                      </p>
                    ) : (
                      <p className="form-help">
                        Berkas sedang diperiksa. Tunggu hasil pemeriksaan
                        admin.
                      </p>
                    )}

                    {uploadingKind === document.kind && (
                      <p role="status">Mengirim berkas...</p>
                    )}
                  </article>
                );
              })}
          </div>

          <p className="form-help">
            Penggantian berkas tidak mengubah status penerimaan. Admin
            sekolah tetap melakukan pemeriksaan ulang.
          </p>

          <button
            type="button"
            className="button registration-back"
            onClick={() => void refresh()}
            disabled={loading || uploadingKind !== null}
          >
            Muat ulang status
          </button>
        </div>
      )}
    </section>
  );
}
