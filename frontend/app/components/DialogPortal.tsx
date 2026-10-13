"use client";

import { useEffect, useEffectEvent, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type DialogPortalProps = {
  children: ReactNode;
  className: string;
  dialogClassName: string;
  labelledBy: string;
  onClose: () => void;
  backdropClassName?: string;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function DialogPortal({
  children,
  className,
  dialogClassName,
  labelledBy,
  onClose,
  backdropClassName = "dialog-scrim",
}: DialogPortalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const handleClose = useEffectEvent(onClose);

  useEffect(() => {
    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.scrollTo({ top: 0 });
    Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    )
      .find((element) => element.getClientRects().length > 0)
      ?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      const dialogs = Array.from(
        document.querySelectorAll('[role="dialog"][aria-modal="true"]'),
      ).filter((element) => element.getClientRects().length > 0);
      if (dialogs.at(-1) !== dialogRef.current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, []);

  return createPortal(
    <div className={className}>
      <button
        className={backdropClassName}
        type="button"
        onClick={onClose}
        aria-label="Tutup dialog"
      />
      <div
        className={dialogClassName}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
