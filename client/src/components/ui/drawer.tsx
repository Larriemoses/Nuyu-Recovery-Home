import { useEffect, useRef, type PropsWithChildren, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./button";

type DrawerProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ReactNode;
}>;

export function Drawer({
  open,
  onClose,
  title,
  description,
  footer,
  children,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.querySelector<HTMLElement>("button, [href], input, select, textarea")?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 top-auto sm:inset-y-0 sm:right-0 sm:left-auto">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="flex h-[82vh] w-full flex-col rounded-t-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] sm:h-full sm:w-[28rem] sm:rounded-none sm:rounded-l-3xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] px-4 py-4 sm:px-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-[var(--color-text)]">{title}</h2>
              {description ? (
                <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                  {description}
                </p>
              ) : null}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close drawer">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
          {footer ? (
            <div className="border-t border-[var(--color-border-subtle)] px-4 py-4 sm:px-6">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
