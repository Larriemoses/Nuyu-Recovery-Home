import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "./helpers";

type CardVariant = "default" | "elevated" | "flat";

type CardProps = PropsWithChildren<{
  variant?: CardVariant;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
}>;

const variantClasses: Record<CardVariant, string> = {
  default:
    "border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-sm",
  elevated:
    "border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-md",
  flat: "border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] shadow-none",
};

export function Card({
  variant = "default",
  className,
  header,
  footer,
  contentClassName,
  children,
}: CardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl transition duration-200",
        variantClasses[variant],
        className,
      )}
    >
      {header ? <div className="border-b border-[var(--color-border-subtle)] px-4 py-4 sm:px-5">{header}</div> : null}
      <div className={cn("px-4 py-4 sm:px-5", contentClassName)}>{children}</div>
      {footer ? <div className="border-t border-[var(--color-border-subtle)] px-4 py-4 sm:px-5">{footer}</div> : null}
    </section>
  );
}
