"use client";
import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import { ApiError, hasBackendApi } from "../lib/api-client";
import {
  submitPublicApplication,
  type PublicApplicationReceipt,
} from "../lib/api/applications";
import type { DocumentRequirements } from "../lib/cms/types";
import { useSchoolSettingsState } from "./SchoolSettingsProvider";
import {
  StudentFields,
  initialRegistration,
  type RegistrationValues,
} from "./registration/StudentFields";
import {
  DocumentFields,
  type SelectedFiles,
} from "./registration/DocumentFields";
import { RegistrationReview } from "./registration/RegistrationReview";

const steps = ["Data siswa", "Orang tua", "Berkas", "Periksa & kirim"];

function missingDocuments(
  requirements: DocumentRequirements,
  files: SelectedFiles,
) {
  const missingKinds = requirements.requiredKinds.filter((kind) => !files[kind]);
  const graduationMissing =
    requirements.requireOneGraduationDocument && !files.skl && !files.ijazah;
  return { missingKinds, graduationMissing };
}

export function RegistrationForm() {
  const settingsState = useSchoolSettingsState();
  const { settings } = settingsState;
  const backendConfigured = hasBackendApi();
  const [form, setForm] = useState(initialRegistration);
  const [files, setFiles] = useState<SelectedFiles>({});
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState<PublicApplicationReceipt | null>(
    null,
  );
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);
  const idempotencyKey = useRef<string | null>(null);

  function update(key: keyof RegistrationValues, value: string) {
    idempotencyKey.current = null;
    setError("");
    setForm((current) => ({ ...current, [key]: value }));
  }
  function updateFiles(next: SelectedFiles) {
    idempotencyKey.current = null;
    setError("");
    setFiles(next);
  }
  function go(next: number) {
    setError("");
    setStep(next);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
      formRef.current
        ?.querySelector<HTMLElement>("fieldset input, h2")
        ?.focus();
    });
  }
  function requirementsError() {
    const missing = missingDocuments(settings.documentRequirements, files);
    if (!missing.missingKinds.length && !missing.graduationMissing) return "";
    const labels = missing.missingKinds
      .map((kind) =>
        ({
          skl: "SKL",
          ijazah: "Ijazah",
          kk: "Kartu Keluarga",
          ktp: "KTP orang tua/wali",
          akta: "Akta kelahiran",
        })[kind],
      )
      .join(", ");
    return missing.graduationMissing
      ? labels
        ? `Lengkapi berkas wajib: ${labels}, serta salah satu SKL atau ijazah.`
        : "Unggah salah satu SKL atau ijazah."
      : `Lengkapi berkas wajib: ${labels}.`;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 4) {
      if (step === 3 && requirementsError()) {
        setError(requirementsError());
        return;
      }
      go(step + 1);
      return;
    }
    if (submitting.current) return;
    if (!backendConfigured) {
      setError(
        "Pendaftaran belum dapat dikirim karena backend belum dikonfigurasi.",
      );
      return;
    }
    if (settingsState.status !== "ready") {
      setError(
        settingsState.error ??
          "Pengaturan PPDB belum berhasil dimuat dari server.",
      );
      return;
    }
    if (!settings.registrationOpen) {
      setError("Pendaftaran PPDB sedang ditutup.");
      return;
    }
    const documentError = requirementsError();
    if (documentError) {
      go(3);
      setError(documentError);
      return;
    }
    if (!consent) {
      setError("Persetujuan orang tua/wali diperlukan untuk mengirim data.");
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);
    idempotencyKey.current ??= crypto.randomUUID();
    const { extracurricular, ...studentData } = form;
    try {
      const receipt = await submitPublicApplication(
        {
          ...studentData,
          extracurriculars:
            extracurricular === "Belum menentukan" ? [] : [extracurricular],
        },
        files,
        idempotencyKey.current,
      );
      setSubmitted(receipt);
      setFiles({});
      setForm(initialRegistration);
      setConsent(false);
      idempotencyKey.current = null;
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : reason instanceof Error
            ? `Pendaftaran gagal dikirim: ${reason.message}`
            : "Pendaftaran gagal dikirim. Data tetap tersimpan pada formulir ini; coba lagi.",
      );
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  if (submitted)
    return (
      <div className="form-success" role="status">
        <span className="success-mark">✓</span>
        <p className="section-kicker">Pendaftaran tersimpan</p>
        <h2>Data berhasil dikirim ke PPDB.</h2>
        <strong>{submitted.id}</strong>
        <p>
          Status: {submitted.status}. Simpan nomor pendaftaran ini untuk
          keperluan komunikasi dengan sekolah.
        </p>
        <Link className="button button-dark" href="/">
          Kembali ke website
        </Link>
      </div>
    );

  const statusMessage = !backendConfigured
    ? "Pengiriman belum tersedia karena backend belum dikonfigurasi. Data formulir tidak disimpan di browser."
    : settingsState.status === "loading"
      ? "Memuat pengaturan PPDB dari server…"
      : settingsState.status === "error"
        ? `Pengaturan PPDB gagal dimuat${settingsState.error ? `: ${settingsState.error}` : "."}`
        : !settings.registrationOpen
          ? "Pendaftaran PPDB sedang ditutup."
          : "";

  return (
    <form
      className="registration-form registration-wizard"
      onSubmit={submit}
      ref={formRef}
    >
      <div className="form-heading">
        <span>Formulir PPDB</span>
        <strong>{settings.academicYear}</strong>
      </div>
      {statusMessage && (
        <p className="form-help" role="status">
          {statusMessage}
        </p>
      )}
      <ol
        className="wizard-progress"
        aria-label={"Langkah " + step + " dari 4"}
      >
        {steps.map((label, i) => (
          <li
            key={label}
            className={i + 1 <= step ? "active" : ""}
            aria-current={i + 1 === step ? "step" : undefined}
          >
            <b>{String(i + 1).padStart(2, "0")}</b>
            <span>{label}</span>
          </li>
        ))}
      </ol>
      {step === 1 && <StudentFields form={form} update={update} />}
      {step === 2 && <StudentFields form={form} update={update} parent />}
      {step === 3 && (
        <DocumentFields
          files={files}
          setFiles={updateFiles}
          requirements={settings.documentRequirements}
        />
      )}
      {step === 4 && (
        <>
          <RegistrationReview form={form} files={files} edit={go} />
          <label className="consent">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            Saya orang tua/wali dan menyetujui data ini digunakan untuk proses
            PPDB.
          </label>
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="registration-form-actions">
        {step > 1 && (
          <button
            type="button"
            className="button registration-back"
            onClick={() => go(step - 1)}
            disabled={isSubmitting}
          >
            Kembali
          </button>
        )}
        <button
          className="button button-accent submit-button"
          type="submit"
          disabled={
            isSubmitting ||
            (step === 4 &&
              (!backendConfigured ||
                settingsState.status !== "ready" ||
                !settings.registrationOpen))
          }
        >
          {isSubmitting
            ? "Mengirim…"
            : step === 4
              ? "Kirim pendaftaran"
              : "Lanjut: " + steps[step]}
        </button>
      </div>
    </form>
  );
}
