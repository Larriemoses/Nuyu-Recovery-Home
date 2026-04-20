import { useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "./helpers";

type FeedbackVariant = "success" | "error" | "warning" | "info";

type FeedbackProps = {
  variant?: FeedbackVariant;
  title?: string;
  message: string;
  dismissible?: boolean;
  className?: string;
  actions?: ReactNode;
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
} as const;

const styles: Record<FeedbackVariant, string> = {
  success:
    "border-[color-mix(in_oklab,var(--color-success)_26%,transparent)] bg-[color-mix(in_oklab,var(--color-success)_12%,transparent)] text-[var(--color-success)]",
  error:
    "border-[color-mix(in_oklab,var(--color-danger)_26%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_12%,transparent)] text-[var(--color-danger)]",
  warning:
    "border-[color-mix(in_oklab,var(--color-warning)_26%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)] text-[var(--color-warning)]",
  info:
    "border-[color-mix(in_oklab,var(--color-info)_26%,transparent)] bg-[color-mix(in_oklab,var(--color-info)_12%,transparent)] text-[var(--color-info)]",
};

export function Feedback({
  variant = "info",
  title,
  message,
  dismissible,
  className,
  actions,
}: FeedbackProps) {
  const [visible, setVisible] = useState(true);
  const Icon = icons[variant];

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
        styles[variant],
        className,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <p className={cn("leading-6", title && "mt-1")}>{message}</p>
        {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {dismissible ? (
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-full p-1 text-current/80 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20"
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
