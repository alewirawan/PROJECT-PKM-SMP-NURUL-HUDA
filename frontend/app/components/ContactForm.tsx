"use client";

import { FormEvent, useState } from "react";
import { addMessage } from "../lib/local-cms";

const initial = { name: "", email: "", topic: "Informasi PPDB", message: "" };

export function ContactForm() {
  const [form, setForm] = useState(initial);
  const [done, setDone] = useState(false);

  function update(key: keyof typeof initial, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addMessage({
      id: `MSG-${Date.now()}`,
      ...form,
      status: "Baru",
      submittedAt: new Date().toISOString(),
    });
    setForm(initial);
    setDone(true);
  }

  if (done)
    return (
      <div className="contact-success" role="status">
        <span>✓</span>
        <h3>Pesan sudah diterima.</h3>
        <p>
          Pesan demo tersimpan dan langsung muncul di menu Pesan masuk pada
          dashboard admin.
        </p>
        <button className="button button-dark" onClick={() => setDone(false)}>
          Kirim pesan lain
        </button>
      </div>
    );

  return (
    <form onSubmit={submit}>
      <label>
        Nama lengkap
        <input
          required
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Nama Anda"
        />
      </label>
      <label>
        Email
        <input
          required
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          type="email"
          placeholder="nama@email.com"
        />
      </label>
      <label>
        Topik
        <select
          value={form.topic}
          onChange={(event) => update("topic", event.target.value)}
        >
          <option>Informasi PPDB</option>
          <option>Kunjungan sekolah</option>
          <option>Program akademik</option>
          <option>Lainnya</option>
        </select>
      </label>
      <label>
        Pesan
        <textarea
          required
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          rows={5}
          placeholder="Tuliskan pertanyaan Anda..."
        />
      </label>
      <button className="button button-dark" type="submit">
        Kirim pesan →
      </button>
      <small>Mode demo lokal — pesan tidak dikirim ke internet.</small>
    </form>
  );
}
