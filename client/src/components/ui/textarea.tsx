import { useId, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "./helpers";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  helperText?: string;
  error?: string;
  leadingIcon?: ReactNode;
};

export function Textarea({
  label,
  helperText,
  error,
  leadingIcon,
  id,
  className,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const helperId = `${textareaId}-helper`;
  const errorId = `${textareaId}-error`;

  return (
    <label className="flex w-full flex-col gap-2 text-sm text-[var(--color-text-muted)]">
      <span className="font-medium text-[var(--color-text)]">{label}</span>
      <span
        className={cn(
          "flex gap-3 rounded-2xl border bg-[var(--color-surface-raised)] px-4 py-3 transition focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20",
          error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]",
          className,
        )}
      >
        {leadingIcon ? (
          <span className="pt-1 text-[var(--color-text-muted)]">{leadingIcon}</span>
        ) : null}
        <textarea
          id={textareaId}
          className="min-h-28 w-full resize-none border-0 bg-transparent p-0 text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...props}
        />
      </span>
      {error ? (
        <span id={errorId} className="text-sm text-[var(--color-danger)]">
          {error}
        </span>
      ) : helperText ? (
        <span id={helperId} className="text-sm text-[var(--color-text-muted)]">
          {helperText}
        </span>
      ) : null}
    </label>
  );
}
