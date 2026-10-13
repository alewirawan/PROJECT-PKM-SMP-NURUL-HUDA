"use client";

import { FormEvent, useState } from "react";
import { addNewsletterSubscription } from "../lib/local-cms";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addNewsletterSubscription({
      email,
      subscribedAt: new Date().toISOString(),
    });
    setDone(true);
    setEmail("");
  }

  return done ? (
    <div className="inline-success" role="status">
      <span>✓</span>
      <div>
        <b>Berhasil berlangganan</b>
        <small>Email tersimpan di demo lokal.</small>
      </div>
      <button onClick={() => setDone(false)}>Tambah lagi</button>
    </div>
  ) : (
    <form onSubmit={submit}>
      <label className="sr-only" htmlFor="newsletter-email">
        Alamat email
      </label>
      <input
        id="newsletter-email"
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Alamat email Anda"
      />
      <button className="button button-accent" type="submit">
        Berlangganan
      </button>
    </form>
  );
}
