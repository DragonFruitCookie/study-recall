"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Small in-app confirmation popover (replaces window.confirm). Renders `trigger`
 * content as a button; clicking it opens a popover that names what will be
 * deleted. Cancel, Escape, or clicking outside closes it without doing anything.
 */
export function ConfirmDelete({
  message,
  onConfirm,
  disabled,
  ariaLabel,
  className = "",
  triggerClassName = "",
  children,
}: {
  message: ReactNode;
  onConfirm: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  triggerClassName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <span ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName}
      >
        {children}
      </button>
      {open && (
        <span
          role="alertdialog"
          aria-label="Confirm delete"
          className="absolute top-full right-0 z-20 mt-1.5 w-64 rounded-xl border border-coral/25 bg-panel p-3 text-left shadow-[0_8px_30px_-8px_rgb(0_0_0/0.7),0_0_24px_-12px_rgb(255_154_166/0.35)]"
        >
          <span className="block text-xs leading-relaxed text-fg/90 normal-case tracking-normal">{message}</span>
          <span className="mt-3 flex justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2.5 py-1 text-xs text-dim transition hover:bg-line/60 hover:text-fg focus-visible:ring-2 focus-visible:ring-violet/40 focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
              className="rounded-md bg-coral/15 px-2.5 py-1 text-xs font-medium text-coral ring-1 ring-coral/30 transition hover:bg-coral/25 focus-visible:ring-2 focus-visible:ring-coral/60 focus-visible:outline-none"
            >
              Delete
            </button>
          </span>
        </span>
      )}
    </span>
  );
}
