import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "./helpers";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  helperText?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function Input({
  label,
  helperText,
  error,
  leadingIcon,
  trailingIcon,
  id,
  className,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <label className="flex w-full flex-col gap-2 text-sm text-[var(--color-text-muted)]">
      <span className="font-medium text-[var(--color-text)]">{label}</span>
      <span
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-2xl border bg-[var(--color-surface-raised)] px-4 transition focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20",
          error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]",
          className,
        )}
      >
        {leadingIcon ? (
          <span className="text-[var(--color-text-muted)]">{leadingIcon}</span>
        ) : null}
        <input
          id={inputId}
          className="h-11 w-full border-0 bg-transparent p-0 text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...props}
        />
        {trailingIcon ? (
          <span className="text-[var(--color-text-muted)]">{trailingIcon}</span>
        ) : null}
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
