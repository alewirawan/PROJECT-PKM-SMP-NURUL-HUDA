import { documentLabels } from "../../lib/cms/student-documents";
import type { RegistrationValues } from "./StudentFields";
import type { SelectedFiles } from "./DocumentFields";

export function RegistrationReview({
  form,
  files,
  edit,
}: {
  form: RegistrationValues;
  files: SelectedFiles;
  edit: (step: number) => void;
}) {
  return (
    <section className="registration-review">
      <h2 tabIndex={-1}>Periksa sebelum mengirim</h2>
      <p>Pastikan data dan berkas sudah benar. Data akan dikirim ke server setelah tombol Kirim pendaftaran dipilih.</p>
      <article>
        <header>
          <h3>Calon siswa</h3>
          <button type="button" onClick={() => edit(1)}>Ubah data siswa</button>
        </header>
        <dl>
          <dt>Nama / NISN</dt><dd>{form.studentName} / {form.nisn}</dd>
          <dt>Tempat, tanggal lahir</dt><dd>{form.birthPlace}, {form.birthDate}</dd>
          <dt>Jenis kelamin</dt><dd>{form.gender}</dd>
          <dt>Asal sekolah</dt><dd>{form.originSchool}</dd>
          <dt>Alamat</dt><dd>{form.address}</dd>
          <dt>Ekstrakurikuler</dt><dd>{form.extracurriculars.length ? form.extracurriculars.join(", ") : "Belum memilih"}</dd>
        </dl>
      </article>
      <article>
        <header>
          <h3>Orang tua/wali</h3>
          <button type="button" onClick={() => edit(2)}>Ubah data orang tua</button>
        </header>
        <dl>
          <dt>Nama / pekerjaan</dt><dd>{form.parentName} / {form.parentOccupation || "Tidak diisi"}</dd>
          <dt>WhatsApp / email</dt><dd>{form.phone} / {form.email}</dd>
        </dl>
      </article>
      <article>
        <header>
          <h3>Berkas</h3>
          <button type="button" onClick={() => edit(3)}>Ubah berkas</button>
        </header>
        <dl>
          {documentLabels.filter((doc) => doc.key !== "photo").map((doc) => (
            <div key={doc.key}><dt>{doc.label}</dt><dd>{files[doc.key as keyof SelectedFiles]?.name ?? "Tidak dilampirkan"}</dd></div>
          ))}
        </dl>
      </article>
    </section>
  );
}
