"use client";
import { useEffect, useState } from "react";
import { DialogPortal } from "../DialogPortal";
export function FilePreview({
  file,
  close,
}: {
  file: File;
  close: () => void;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(
      new Blob([file], {
        type: /\.pdf$/i.test(file.name)
          ? "application/pdf"
          : /\.png$/i.test(file.name)
            ? "image/png"
            : "image/jpeg",
      }),
    );
    const frame = requestAnimationFrame(() => setUrl(objectUrl));
    return () => {
      cancelAnimationFrame(frame);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);
  return (
    <DialogPortal
      className="file-preview-backdrop"
      dialogClassName="file-preview"
      labelledBy="file-preview-title"
      onClose={close}
    >
      <header>
        <div>
          <small>Pratinjau lokal - tidak dikirim ke server</small>
          <h2 id="file-preview-title">{file.name}</h2>
        </div>
        <button
          type="button"
          className="button registration-back"
          onClick={close}
        >
          Tutup pratinjau
        </button>
      </header>
      {url &&
        (/\.pdf$/i.test(file.name) ? (
          <>
            <iframe title={"Pratinjau " + file.name} src={url} />
            <p>
              Jika PDF tidak tampil di browser ini, buka file langsung dari
              perangkat Anda.
            </p>
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={"Pratinjau " + file.name} />
        ))}
    </DialogPortal>
  );
}
