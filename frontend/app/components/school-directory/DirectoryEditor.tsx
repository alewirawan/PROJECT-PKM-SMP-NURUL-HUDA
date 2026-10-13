"use client";

import { Save, X } from "lucide-react";
import type { FormEventHandler } from "react";
import {
  hasOtherPrincipal,
  type SchoolLeader,
  type Teacher,
} from "../../school-directory-data";
import { DialogPortal } from "../DialogPortal";
import {
  clusters,
  levels,
  portraitPositions,
  tones,
  type Editor,
} from "./shared";

export function DirectoryEditor({
  editor,
  leaders,
  setEditor,
  onClose,
  onSubmit,
}: {
  editor: NonNullable<Editor>;
  leaders: SchoolLeader[];
  setEditor: (editor: Editor) => void;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <DialogPortal
      className="directory-editor-backdrop"
      dialogClassName="directory-editor-shell"
      labelledBy="directory-editor-title"
      onClose={() => onClose()}
    >
      <form className="directory-editor" onSubmit={onSubmit}>
        <header>
          <div>
            <p className="admin-eyebrow">
              {editor.isNew ? "Profil baru" : "Edit profil"}
            </p>
            <h2 id="directory-editor-title">
              {editor.kind === "leader"
                ? "Pengelola sekolah"
                : "Tenaga pendidik"}
            </h2>
          </div>
          <button type="button" onClick={() => onClose()} aria-label="Tutup">
            <X size={18} />
          </button>
        </header>
        <div className="directory-editor-body">
          <div className="directory-photo-choice">
            <span
              className={`directory-editor-portrait ${editor.kind}`}
              style={{
                backgroundPosition:
                  portraitPositions[editor.value.portraitIndex % 8],
              }}
            />
            <div>
              <b>Pilih contoh foto</b>
              <div>
                {portraitPositions.map((position, index) => (
                  <button
                    type="button"
                    className={
                      editor.value.portraitIndex === index ? "active" : ""
                    }
                    onClick={() =>
                      setEditor({
                        ...editor,
                        value: { ...editor.value, portraitIndex: index },
                      } as Editor)
                    }
                    key={position}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="admin-form-grid">
            <label className="span-2">
              Nama lengkap
              <input
                required
                value={editor.value.name}
                onChange={(event) =>
                  setEditor({
                    ...editor,
                    value: { ...editor.value, name: event.target.value },
                  } as Editor)
                }
              />
            </label>
            <label>
              Inisial
              <input
                maxLength={3}
                value={editor.value.initials}
                onChange={(event) =>
                  setEditor({
                    ...editor,
                    value: {
                      ...editor.value,
                      initials: event.target.value.toUpperCase(),
                    },
                  } as Editor)
                }
                placeholder="Otomatis dari nama"
              />
            </label>
            <label>
              Aksen warna
              <select
                value={editor.value.tone}
                onChange={(event) =>
                  setEditor({
                    ...editor,
                    value: { ...editor.value, tone: event.target.value },
                  } as Editor)
                }
              >
                {tones.map((tone) => (
                  <option key={tone}>{tone}</option>
                ))}
              </select>
            </label>
            {editor.kind === "leader" ? (
              <>
                <label>
                  Jabatan
                  <input
                    required
                    value={editor.value.role}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        value: {
                          ...editor.value,
                          role: event.target.value,
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Level struktur
                  <select
                    value={editor.value.level}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        value: {
                          ...editor.value,
                          level: event.target.value as SchoolLeader["level"],
                        },
                      })
                    }
                  >
                    {levels.map((level) => (
                      <option
                        value={level.value}
                        disabled={
                          level.value === "principal" &&
                          hasOtherPrincipal(leaders, editor.value.id)
                        }
                        key={level.value}
                      >
                        {level.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="span-2">
                  Fokus kerja
                  <input
                    required
                    value={editor.value.focus}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        value: {
                          ...editor.value,
                          focus: event.target.value,
                        },
                      })
                    }
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Mata pelajaran
                  <input
                    required
                    value={editor.value.subject}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        value: {
                          ...editor.value,
                          subject: event.target.value,
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Rumpun
                  <select
                    value={editor.value.cluster}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        value: {
                          ...editor.value,
                          cluster: event.target.value as Teacher["cluster"],
                        },
                      })
                    }
                  >
                    {clusters.map((cluster) => (
                      <option key={cluster}>{cluster}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Pengalaman (tahun)
                  <input
                    required
                    type="number"
                    min="0"
                    max="60"
                    value={editor.value.years}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        value: {
                          ...editor.value,
                          years: Number(event.target.value),
                        },
                      })
                    }
                  />
                </label>
                <label className="span-2">
                  Catatan profil
                  <textarea
                    required
                    rows={3}
                    value={editor.value.note}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        value: {
                          ...editor.value,
                          note: event.target.value,
                        },
                      })
                    }
                  />
                </label>
              </>
            )}
          </div>
        </div>
        <footer>
          <button
            className="button admin-button-muted"
            type="button"
            onClick={() => onClose()}
          >
            Batal
          </button>
          <button className="button button-accent icon-button" type="submit">
            <Save size={15} /> Simpan perubahan
          </button>
        </footer>
      </form>
    </DialogPortal>
  );
}
