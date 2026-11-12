"use client";
import { useClubs } from "../../lib/use-clubs";

export const initialRegistration = {
  studentName: "",
  nisn: "",
  originSchool: "",
  birthPlace: "",
  birthDate: "",
  gender: "Laki-laki" as "Laki-laki" | "Perempuan",
  address: "",
  parentName: "",
  parentOccupation: "",
  phone: "",
  email: "",
  extracurriculars: [] as string[],
};
export type RegistrationValues = typeof initialRegistration;
type Props = {
  form: RegistrationValues;
  update: (key: Exclude<keyof RegistrationValues, "extracurriculars">, value: string) => void;
  toggleExtracurricular: (name: string) => void;
  parent?: boolean;
};

export function StudentFields({
  form,
  update,
  toggleExtracurricular,
  parent = false,
}: Props) {
  const { clubs, loading: clubsLoading, error: clubsError } = useClubs();
  const fields: Array<{
    key: Exclude<keyof RegistrationValues, "gender" | "extracurriculars">;
    label: string;
    type?: string;
  }> = parent
    ? [
        { key: "parentName", label: "Nama orang tua/wali" },
        { key: "parentOccupation", label: "Pekerjaan orang tua/wali" },
        { key: "phone", label: "Nomor WhatsApp", type: "tel" },
        { key: "email", label: "Email", type: "email" },
      ]
    : [
        { key: "studentName", label: "Nama lengkap" },
        { key: "nisn", label: "NISN" },
        { key: "birthPlace", label: "Tempat lahir" },
        { key: "birthDate", label: "Tanggal lahir", type: "date" },
        { key: "originSchool", label: "Asal sekolah" },
      ];

  return (
    <fieldset>
      <legend>{parent ? "02 - Data orang tua/wali" : "01 - Data calon siswa"}</legend>
      <div className="form-grid">
        {fields.map(({ key, label, type }) => (
          <label key={key}>
            {label}
            <input
              required={key !== "parentOccupation"}
              name={key}
              type={type ?? "text"}
              value={form[key]}
              maxLength={
                key === "nisn" ? 10
                  : key === "studentName" || key === "parentName" ? 120
                    : key === "originSchool" ? 160
                      : key === "birthPlace" ? 100
                        : key === "parentOccupation" ? 120
                          : key === "phone" ? 20
                            : key === "email" ? 254
                              : 600
              }
              minLength={key === "nisn" ? 10 : undefined}
              inputMode={key === "nisn" ? "numeric" : key === "phone" ? "tel" : undefined}
              pattern={
                key === "nisn"
                  ? "[0-9]{10}"
                  : key === "phone"
                    ? "[+]?[0-9 ]{8,20}"
                    : undefined
              }
              title={key === "nisn" ? "NISN harus terdiri dari 10 angka" : undefined}
              max={type === "date" ? new Date().toISOString().slice(0, 10) : undefined}
              onChange={(event) =>
                update(
                  key,
                  key === "nisn" ? event.target.value.replace(/\D/g, "") : event.target.value,
                )
              }
            />
          </label>
        ))}
        {!parent && (
          <>
            <label>
              Jenis kelamin
              <select
                value={form.gender}
                onChange={(event) => update("gender", event.target.value)}
              >
                <option>Laki-laki</option>
                <option>Perempuan</option>
              </select>
            </label>
            <label className="span-2">
              Alamat domisili
              <textarea
                required
                rows={3}
                maxLength={600}
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
              />
            </label>
            <div className="span-2 extracurricular-picker">
              <span>Ekstrakurikuler yang diminati (opsional)</span>
              <p className="form-help">Boleh memilih lebih dari satu kegiatan atau tidak memilih.</p>
              {clubsLoading && <p className="form-help">Memuat kegiatan aktif...</p>}
              {clubsError && <p className="form-error" role="alert">Daftar kegiatan gagal dimuat: {clubsError}</p>}
              {!clubsLoading && !clubsError && clubs.filter((club) => club.active).length === 0 && (
                <p className="form-help">Belum ada kegiatan aktif yang tersedia.</p>
              )}
              <div className="extracurricular-options">
                {clubs.filter((club) => club.active).map((club) => (
                  <label key={club.id}>
                    <input
                      type="checkbox"
                      checked={form.extracurriculars.includes(club.name)}
                      onChange={() => toggleExtracurricular(club.name)}
                    />
                    <span>{club.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </fieldset>
  );
}
