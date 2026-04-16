import type { PropsWithChildren, ReactNode } from "react";

type SectionCardProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description?: string;
  footer?: ReactNode;
}>;

export function SectionCard({
  eyebrow,
  title,
  description,
  footer,
  children,
}: SectionCardProps) {
  return (
    <section className="glass-card rounded-[2rem] p-6 sm:p-8">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--nuyu-gold)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="display-font mt-3 text-2xl font-semibold text-[var(--nuyu-ink)]">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--nuyu-muted)]">
          {description}
        </p>
      ) : null}
      <div className="mt-6">{children}</div>
      {footer ? <div className="mt-6">{footer}</div> : null}
    </section>
  );
}
