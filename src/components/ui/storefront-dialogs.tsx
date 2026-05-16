"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type BaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children?: ReactNode;
};

function useDialogModalSync(open: boolean, onOpenChange: (open: boolean) => void) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      return;
    }
    if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const handleCloseEvent = () => {
    onOpenChange(false);
  };

  return { ref, handleCloseEvent };
}

export type ConfirmDialogProps = BaseProps & {
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  /** Emphasize the confirm action (e.g. remove / destructive). */
  destructive?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const { ref, handleCloseEvent } = useDialogModalSync(open, onOpenChange);
  const [pending, setPending] = useState(false);

  const runConfirm = async () => {
    if (pending) return;
    setPending(true);
    try {
      await Promise.resolve(onConfirm());
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <dialog
      ref={ref}
      className="storefront-dialog"
      aria-labelledby={titleId}
      aria-describedby={children ? descId : undefined}
      onClose={handleCloseEvent}
    >
      <div
        className="box-border flex min-h-[100dvh] w-full min-w-0 items-center justify-center p-4 md:p-6"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) ref.current?.close();
        }}
      >
        <div
          className="w-full max-w-[420px] rounded-[3px] border border-[var(--color-divider)] bg-white p-6 shadow-[0_12px_40px_-12px_oklch(0.2_0.02_80_/_0.35)]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h2 id={titleId} className="text-[18px] font-bold tracking-[-0.02em] text-[var(--color-ink)]">
            {title}
          </h2>
          {children ? (
            <div id={descId} className="mt-3 text-[14px] leading-relaxed text-[var(--color-muted)]">
              {children}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              disabled={pending}
              className="btn-outline-dark disabled:opacity-50"
              onClick={() => ref.current?.close()}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={pending}
              className={
                destructive
                  ? "inline-flex items-center justify-center rounded-[2px] border border-red-800/35 bg-red-50 px-[18px] py-2.5 text-[13px] font-semibold text-red-950 transition-colors hover:bg-red-100 disabled:opacity-50"
                  : "btn-primary disabled:opacity-50"
              }
              onClick={() => void runConfirm()}
            >
              {pending ? "…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export type AlertDialogProps = BaseProps & {
  actionLabel: string;
  onAction?: () => void | Promise<void>;
};

export function AlertDialog({ open, onOpenChange, title, children, actionLabel, onAction }: AlertDialogProps) {
  const titleId = useId();
  const descId = useId();
  const { ref, handleCloseEvent } = useDialogModalSync(open, onOpenChange);
  const [pending, setPending] = useState(false);

  const runAction = async () => {
    if (pending) return;
    if (!onAction) {
      ref.current?.close();
      return;
    }
    setPending(true);
    try {
      await Promise.resolve(onAction());
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <dialog
      ref={ref}
      className="storefront-dialog"
      aria-labelledby={titleId}
      aria-describedby={children ? descId : undefined}
      onClose={handleCloseEvent}
    >
      <div
        className="box-border flex min-h-[100dvh] w-full min-w-0 items-center justify-center p-4 md:p-6"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) ref.current?.close();
        }}
      >
        <div
          className="w-full max-w-[420px] rounded-[3px] border border-[var(--color-divider)] bg-white p-6 shadow-[0_12px_40px_-12px_oklch(0.2_0.02_80_/_0.35)]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h2 id={titleId} className="text-[18px] font-bold tracking-[-0.02em] text-[var(--color-ink)]">
            {title}
          </h2>
          {children ? (
            <div id={descId} className="mt-3 text-[14px] leading-relaxed text-[var(--color-muted)]">
              {children}
            </div>
          ) : null}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              disabled={pending}
              className="btn-primary min-w-[100px] disabled:opacity-50"
              onClick={() => void runAction()}
            >
              {pending ? "…" : actionLabel}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
