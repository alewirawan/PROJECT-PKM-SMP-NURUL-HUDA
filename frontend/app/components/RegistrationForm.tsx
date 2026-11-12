"use client";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { ApiError } from "../lib/api-client";
import { getRegistrationSettings } from "../lib/api/applications/settings";
import { submitApplication } from "../lib/api/applications/submission";
import type {
  ApplicationCreate,
  ApplicationReceipt,
  RegistrationSettings,
} from "../lib/api/applications/types";
import {
  areRequiredFilesComplete,
  DocumentFields,
  type SelectedFiles,
} from "./registration/DocumentFields";
import { RegistrationReview } from "./registration/RegistrationReview";
import {
  initialRegistration,
  StudentFields,
  type RegistrationValues,
} from "./registration/StudentFields";

const steps = ["Data siswa", "Orang tua", "Berkas", "Periksa & kirim"];
type LoadedSettings = { settings: RegistrationSettings; demo: boolean };

function makePayload(form: RegistrationValues): ApplicationCreate {
  return {
    studentName: form.studentName.trim(),
    nisn: form.nisn,
    originSchool: form.originSchool.trim(),
    birthPlace: form.birthPlace.trim(),
    birthDate: form.birthDate,
    gender: form.gender,
    address: form.address.trim(),
    parentName: form.parentName.trim(),
    ...(form.parentOccupation.trim()
      ? { parentOccupation: form.parentOccupation.trim() }
      : {}),
    phone: form.phone,
    email: form.email.trim(),
    extracurriculars: [...new Set(form.extracurriculars)],
  };
}

export function RegistrationForm() {
  const [form, setForm] = useState(initialRegistration);
  const [files, setFiles] = useState<SelectedFiles>({});
  const [step, setStep] = useState(1);
  const [receipt, setReceipt] = useState<ApplicationReceipt | null>(null);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [configuration, setConfiguration] = useState<LoadedSettings | null>(null);
  const [configurationError, setConfigurationError] = useState("");
  const [loadingConfiguration, setLoadingConfiguration] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const idempotencyRef = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    let active = true;
    getRegistrationSettings()
      .then((result) => {
        if (active) setConfiguration(result);
      })
      .catch((reason: unknown) => {
        if (active) {
          setConfigurationError(
            reason instanceof Error ? reason.message : "Pengaturan PPDB gagal dimuat.",
          );
        }
      })
      .finally(() => {
        if (active) setLoadingConfiguration(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function update(
    key: Exclude<keyof RegistrationValues, "extracurriculars">,
    value: string,
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleExtracurricular(name: string) {
    setForm((current) => ({
      ...current,
      extracurriculars: current.extracurriculars.includes(name)
        ? current.extracurriculars.filter((item) => item !== name)
        : [...current.extracurriculars, name],
    }));
  }

  function go(next: number) {
    setError("");
    setStep(next);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
      formRef.current?.querySelector<HTMLElement>("fieldset input, h2")?.focus();
    });
  }

  function validateBeforeSubmit() {
    if (form.studentName.trim().length < 2 || form.studentName.length > 120)
      return "Nama siswa harus terdiri dari 2 sampai 120 karakter.";
    if (!/^[0-9]{10}$/.test(form.nisn)) return "NISN harus terdiri dari 10 angka.";
    if (form.originSchool.trim().length < 2) return "Asal sekolah wajib diisi.";
    if (form.birthPlace.trim().length < 2 || !form.birthDate)
      return "Tempat dan tanggal lahir wajib diisi.";
    if (form.birthDate > new Date().toISOString().slice(0, 10))
      return "Tanggal lahir tidak boleh di masa depan.";
    if (!form.address.trim() || form.address.length > 600)
      return "Alamat wajib diisi dan maksimal 600 karakter.";
    if (form.parentName.trim().length < 2) return "Nama orang tua/wali wajib diisi.";
    if (!/^[+]?[0-9 ]{8,20}$/.test(form.phone))
      return "Nomor WhatsApp harus 8 sampai 20 digit/spasi dan boleh diawali +.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Masukkan alamat email yang valid.";
    if (!configuration) return "Pengaturan PPDB belum tersedia.";
    if (!areRequiredFilesComplete(files, configuration.settings.documentRequirements))
      return "Berkas wajib sesuai pengaturan sekolah belum lengkap.";
    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 4) {
      if (
        step === 3 &&
        configuration &&
        !areRequiredFilesComplete(files, configuration.settings.documentRequirements)
      ) {
        setError("Lengkapi berkas yang diwajibkan pada pengaturan PPDB.");
        return;
      }
      go(step + 1);
      return;
    }
    if (submitting) return;
    const validationError = validateBeforeSubmit();
    if (validationError) {
      setError(validationError);
      if (configuration && !areRequiredFilesComplete(files, configuration.settings.documentRequirements)) go(3);
      return;
    }
    if (!consent) {
      setError("Konfirmasikan bahwa data yang dikirim sudah benar.");
      return;
    }
    if (!configuration || configuration.demo) {
      setError("Pengiriman resmi belum tersedia karena frontend masih berjalan dalam mode demo. Hubungkan NEXT_PUBLIC_API_BASE_URL dan aktifkan API backend terlebih dahulu.");
      return;
    }
    if (!configuration.settings.registrationOpen) {
      setError("Pendaftaran sedang ditutup oleh admin sekolah.");
      return;
    }

    const payload = makePayload(form);
    const fingerprint = JSON.stringify({
      payload,
      files: Object.entries(files).map(([kind, file]) => [kind, file?.name, file?.size, file?.lastModified, file?.type]),
    });
    if (!idempotencyRef.current || idempotencyRef.current.fingerprint !== fingerprint) {
      idempotencyRef.current = { fingerprint, key: crypto.randomUUID() };
    }

    setSubmitting(true);
    setError("");
    try {
      const result = await submitApplication(payload, files, idempotencyRef.current.key);
      setReceipt(result);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) {
        setError("Permintaan sebelumnya masih diproses atau isi pengiriman berbeda dengan kunci percobaan yang sama. Periksa koneksi lalu kirim ulang tanpa mengubah isian.");
      } else {
        setError(reason instanceof Error ? reason.message : "Pendaftaran gagal dikirim. Isian dan berkas tetap tersimpan di halaman ini.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (receipt) {
    return (
      <div className="form-success" role="status">
        <span className="success-mark">✓</span>
        <p className="section-kicker">Bukti pendaftaran dari server</p>
        <h2>Pendaftaran berhasil diterima.</h2>
        <strong>{receipt.id}</strong>
        <p>Status awal: {receipt.status}</p>
        <p>Waktu pengiriman: {new Date(receipt.submittedAt).toLocaleString("id-ID")}</p>
        <p>Simpan nomor ini sebagai bukti pendaftaran. Nomor pendaftaran bukan kata sandi atau akses untuk membuka data pribadi.</p>
        <Link className="button button-dark" href="/pendaftar">Buka Menu Pendaftar</Link>
      </div>
    );
  }

  if (loadingConfiguration) return <div className="registration-form" role="status">Memuat pengaturan PPDB...</div>;
  if (configurationError) return <div className="registration-form"><p className="form-error" role="alert">Pengaturan PPDB tidak dapat dimuat: {configurationError}</p></div>;
  if (!configuration) return <div className="registration-form"><p className="form-error">Pengaturan PPDB belum tersedia.</p></div>;

  const settings = configuration.settings;
  return (
    <form className="registration-form registration-wizard" onSubmit={handleSubmit} ref={formRef}>
      <div className="form-heading">
        <span>Formulir PPDB</span>
        <strong>{settings.academicYear}</strong>
      </div>
      {configuration.demo && (
        <div className="demo-alert"><b>Mode demo.</b> Formulir dapat ditinjau, tetapi pengiriman resmi tidak aktif karena API backend belum dikonfigurasi. Data tidak disimpan sebagai pendaftaran.</div>
      )}
      {!settings.registrationOpen && <p className="form-error" role="status">Pendaftaran sedang ditutup. Formulir tidak dapat dikirim.</p>}
      {(settings.registrationOpensAt || settings.registrationClosesAt) && (
        <p className="form-help">Jadwal informasi: {settings.registrationOpensAt ? new Date(settings.registrationOpensAt).toLocaleString("id-ID") : "Belum ditentukan"} sampai {settings.registrationClosesAt ? new Date(settings.registrationClosesAt).toLocaleString("id-ID") : "Belum ditentukan"}. Status buka/tutup tetap mengikuti toggle manual admin.</p>
      )}
      <ol className="wizard-progress" aria-label={`Langkah ${step} dari 4`}>
        {steps.map((label, index) => (
          <li key={label} className={index + 1 <= step ? "active" : ""} aria-current={index + 1 === step ? "step" : undefined}>
            <b>{String(index + 1).padStart(2, "0")}</b><span>{label}</span>
          </li>
        ))}
      </ol>
      {step === 1 && <StudentFields form={form} update={update} toggleExtracurricular={toggleExtracurricular} />}
      {step === 2 && <StudentFields form={form} update={update} toggleExtracurricular={toggleExtracurricular} parent />}
      {step === 3 && <DocumentFields files={files} setFiles={setFiles} requirements={settings.documentRequirements} />}
      {step === 4 && (
        <>
          <RegistrationReview form={form} files={files} edit={go} />
          <label className="consent">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            Saya menyatakan data yang diisi benar dan bersedia mengikuti proses verifikasi sekolah.
          </label>
        </>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="registration-form-actions">
        {step > 1 && <button type="button" className="button registration-back" disabled={submitting} onClick={() => go(step - 1)}>Kembali</button>}
        <button className="button button-accent submit-button" type="submit" disabled={submitting || (step === 4 && (!settings.registrationOpen || configuration.demo))}>
          {submitting ? "Mengirim pendaftaran..." : step === 4 ? "Kirim pendaftaran" : "Lanjut: " + steps[step]}
        </button>
      </div>
    </form>
  );
}
