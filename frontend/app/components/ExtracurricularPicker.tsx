"use client";
import { useId } from "react";
import { useClubs } from "../lib/use-clubs";

export function ExtracurricularPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string[];
  onChange: (names: string[]) => void;
  disabled?: boolean;
}) {
  const { clubs, loading, error, refresh } = useClubs();
  const hintId = useId();
  const activeNames = clubs.map((club) => club.name);
  const names = [...new Set([...activeNames, ...value])];
  return (
    <fieldset
      className="extracurricular-picker"
      disabled={disabled}
      aria-describedby={hintId}
    >
      <legend>Ekstrakurikuler (opsional)</legend>
      <p id={hintId}>
        Boleh memilih lebih dari satu atau tidak memilih. Pilihan lama tetap
        tersimpan.
      </p>
      {loading && <p role="status">Memuat pilihan…</p>}
      {error && <p role="alert">{error}</p>}
      {error && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => void refresh()}
        >
          Coba lagi
        </button>
      )}
      {!loading && !error && !names.length && <p>Belum ada kegiatan aktif.</p>}
      {names.map((name) => (
        <label key={name}>
          <input
            type="checkbox"
            disabled={loading || Boolean(error)}
            checked={value.includes(name)}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [...new Set([...value, name])]
                  : value.filter((item) => item !== name),
              )
            }
          />
          {name}
          {!activeNames.includes(name) ? " (pilihan sebelumnya)" : ""}
        </label>
      ))}
    </fieldset>
  );
}
