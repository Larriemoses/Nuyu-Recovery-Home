import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./spinner";
import { cn } from "./helpers";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  disabledReason?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] shadow-sm",
  secondary:
    "border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)] hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-overlay)]",
  ghost:
    "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text)]",
  danger:
    "bg-[var(--color-danger)] text-white hover:bg-[color-mix(in_oklab,var(--color-danger)_86%,black)] shadow-sm",
  link: "px-0 text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 rounded-xl px-3.5 text-sm",
  md: "min-h-11 rounded-2xl px-4 text-sm",
  lg: "min-h-12 rounded-2xl px-5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  fullWidth,
  leadingIcon,
  trailingIcon,
  disabled,
  disabledReason,
  className,
  children,
  title,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        variant !== "link" && "border border-transparent",
        isDisabled &&
          "cursor-not-allowed text-[var(--color-text-disabled)] opacity-60 hover:bg-inherit hover:text-[var(--color-text-disabled)]",
        className,
      )}
      disabled={isDisabled}
      title={isDisabled ? disabledReason ?? title : title}
      {...props}
    >
      {loading ? <Spinner size="sm" label="Loading button" /> : leadingIcon}
      <span>{children}</span>
      {!loading ? trailingIcon : null}
    </button>
  );
}
