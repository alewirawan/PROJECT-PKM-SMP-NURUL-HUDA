"use client";

import { BadgeCheck, Mail, RotateCcw } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { saveSchoolSettings, type SchoolSettings } from "../../lib/local-cms";
import { AdminPageHeader } from "./AdminUi";

export function SettingsModule({
  settings,
  setSettings,
  newsletterCount,
  notify,
  onReset,
}: {
  settings: SchoolSettings;
  setSettings: (value: SchoolSettings) => void;
  newsletterCount: number;
  notify: (message: string) => void;
  onReset: () => void;
}) {
  const [form, setForm] = useState(settings);
  useEffect(() => {
    const timer = window.setTimeout(() => setForm(settings), 0);
    return () => window.clearTimeout(timer);
  }, [settings]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettings(form);
    saveSchoolSettings(form);
    notify("Pengaturan sekolah berhasil disimpan.");
  }
  function update<K extends keyof SchoolSettings>(
    key: K,
    value: SchoolSettings[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  return (
    <div className="admin-view">
      <AdminPageHeader
        eyebrow="Konfigurasi lokal"
        title="Pengaturan sekolah"
        description="Kelola identitas, kontak, dan status penerimaan siswa."
      />
      <section className="settings-layout">
        <form className="admin-form-card settings-form" onSubmit={submit}>
          <p className="admin-eyebrow">Profil sekolah</p>
          <h2>Informasi utama</h2>
          <div className="admin-form-grid">
            <label>
              Nama sekolah
              <input
                required
                value={form.schoolName}
                onChange={(event) => update("schoolName", event.target.value)}
              />
            </label>
            <label>
              Tagline
              <input
                required
                value={form.tagline}
                onChange={(event) => update("tagline", event.target.value)}
              />
            </label>
            <label>
              Email utama
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
              />
            </label>
            <label>
              Email PPDB
              <input
                required
                type="email"
                value={form.ppdbEmail}
                onChange={(event) => update("ppdbEmail", event.target.value)}
              />
            </label>
            <label>
              Telepon
              <input
                required
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
              />
            </label>
            <label>
              WhatsApp
              <input
                required
                value={form.whatsapp}
                onChange={(event) => update("whatsapp", event.target.value)}
              />
            </label>
            <label>
              Tahun ajaran
              <input
                required
                value={form.academicYear}
                onChange={(event) => update("academicYear", event.target.value)}
              />
            </label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={form.registrationOpen}
                onChange={(event) =>
                  update("registrationOpen", event.target.checked)
                }
              />
              <span />
              <b>PPDB sedang dibuka</b>
            </label>
            <label className="span-2">
              Alamat
              <textarea
                required
                rows={3}
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
              />
            </label>
          </div>
          <button className="button button-accent" type="submit">
            Simpan pengaturan
          </button>
        </form>
        <aside className="settings-side">
          <article>
            <span>
              <Mail size={18} />
            </span>
            <div>
              <small>Subscriber newsletter</small>
              <strong>{newsletterCount}</strong>
              <p>Tersimpan pada browser lokal ini.</p>
            </div>
          </article>
          <article>
            <span>
              <BadgeCheck size={18} />
            </span>
            <div>
              <small>Status PPDB</small>
              <strong>{form.registrationOpen ? "Dibuka" : "Ditutup"}</strong>
              <p>Tahun ajaran {form.academicYear}</p>
            </div>
          </article>
          <article className="danger-zone">
            <div>
              <small>Reset data demo</small>
              <strong>Kembalikan kondisi awal</strong>
              <p>
                Menghapus artikel, pendaftar, agenda, pesan, subscriber, dan
                pengaturan lokal.
              </p>
              <button
                onClick={() => {
                  if (window.confirm("Reset seluruh data demo lokal?"))
                    onReset();
                }}
              >
                <RotateCcw size={14} /> Reset data lokal
              </button>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
