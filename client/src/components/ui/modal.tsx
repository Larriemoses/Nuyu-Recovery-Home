import { useEffect, useRef, type PropsWithChildren, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "./helpers";

type ModalProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  panelClassName?: string;
  contentClassName?: string;
}>;

const focusableSelector =
  "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  panelClassName,
  contentClassName,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 lg:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            "relative flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.08)] sm:max-h-[86vh] sm:rounded-[1.5rem]",
            panelClassName,
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3 sm:px-5">
            <div className="min-w-0 space-y-1">
              <h2 className="text-base font-semibold text-[var(--color-text)] sm:text-lg">{title}</h2>
              {description ? (
                <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                  {description}
                </p>
              ) : null}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className={cn("flex-1 overflow-y-auto px-4 py-4 sm:px-5", contentClassName)}>
            {children}
          </div>
          {footer ? (
            <div className="border-t border-[var(--color-border-subtle)] px-4 py-3 sm:px-5">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
