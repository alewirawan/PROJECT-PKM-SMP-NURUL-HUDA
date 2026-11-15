"use client";

import type { ReactNode } from "react";
import { useSchoolSettingsState } from "./SchoolSettingsProvider";

const documentNames: Record<string, string> = {
  skl: "SKL",
  ijazah: "Ijazah",
  kk: "Kartu Keluarga",
  ktp: "KTP orang tua/wali",
  akta: "Akta kelahiran",
};

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("id-ID", { dateStyle: "long" });
}

export function PublicRegistrationInfo({
  children,
}: {
  children: ReactNode;
}) {
  const state = useSchoolSettingsState();
  const { settings } = state;
  const ready = state.source === "api" && state.status === "ready";
  const requirements = settings.documentRequirements;
  const openingDate = ready ? formatDate(settings.registrationOpensAt) : null;
  const closingDate = ready ? formatDate(settings.registrationClosesAt) : null;
  const requiredNames = requirements.requiredKinds.map(
    (kind) => documentNames[kind],
  );
  if (requirements.requireOneGraduationDocument)
    requiredNames.unshift("Salah satu SKL atau ijazah");

  const registrationStatus = state.source === "demo"
    ? "Mode demo — status resmi belum tersedia"
    : state.status === "loading"
      ? "Memuat dari server…"
      : state.status === "error"
        ? "Status belum dapat dimuat"
        : settings.registrationOpen
          ? "Pendaftaran dibuka"
          : "Pendaftaran ditutup";
  const schedule = openingDate || closingDate
    ? [openingDate && `Buka ${openingDate}`, closingDate && `Tutup ${closingDate}`]
        .filter(Boolean)
        .join(" · ")
    : ready
      ? "Jadwal informasi belum ditetapkan"
      : "Jadwal resmi belum tersedia";

  return (
    <>
      <section className="admission-summary">
        <article>
          <span>Tahun ajaran</span>
          <strong>{ready ? settings.academicYear : "Belum tersedia"}</strong>
          <small>{registrationStatus}</small>
        </article>
        <article>
          <span>Informasi jadwal</span>
          <strong>{schedule}</strong>
          <small>Tanggal tidak mengubah status buka/tutup otomatis</small>
        </article>
        <article>
          <span>Persyaratan</span>
          <strong>
            {ready
              ? requiredNames.length
                ? `${requiredNames.length} ketentuan berkas`
                : "Belum ada berkas wajib"
              : "Mengikuti pengaturan server"}
          </strong>
          <small>PIP/KIP selalu opsional</small>
        </article>
      </section>
      <section className="admission-content">
        <aside className="admission-guide">
          <p className="section-kicker">Sebelum mendaftar</p>
          <h2>Siapkan dokumen berikut.</h2>
          {ready ? (
            <ul>
              {requiredNames.length ? (
                requiredNames.map((name, index) => (
                  <li key={name}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <span>{name}</span>
                  </li>
                ))
              ) : (
                <li>
                  <span>Tidak ada berkas wajib yang ditetapkan.</span>
                </li>
              )}
              <li>
                <b>+</b>
                <span>PIP/KIP jika tersedia (opsional)</span>
              </li>
            </ul>
          ) : (
            <p className="form-help" role="status">
              Persyaratan resmi belum dapat dimuat dari backend. Jangan kirim
              dokumen sebelum status pendaftaran tersedia.
            </p>
          )}
          <p className="form-help">
            Berkas PDF, JPG, atau PNG; maksimal 5 MB per berkas.
          </p>
          <div className="help-card">
            <b>Butuh bantuan?</b>
            {ready ? (
              <>
                <p>Hubungi sekolah melalui kontak resmi PPDB.</p>
                <a href={`mailto:${settings.ppdbEmail}`}>
                  {settings.ppdbEmail}
                </a>
                <a href={`tel:${settings.whatsapp.replace(/[^\d+]/g, "")}`}>
                  {settings.whatsapp}
                </a>
              </>
            ) : (
              <p>Kontak resmi PPDB akan ditampilkan setelah pengaturan server tersedia.</p>
            )}
          </div>
        </aside>
        {children}
      </section>
    </>
  );
}
