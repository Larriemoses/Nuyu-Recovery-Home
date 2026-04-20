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
    <section className="public-panel rounded-[1.7rem] p-4 sm:p-5">
      <div className="border-b border-[var(--color-border-subtle)] pb-4">
        {eyebrow ? (
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-[1.24rem] font-semibold tracking-[-0.03em] text-[var(--nuyu-ink)] sm:text-[1.48rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-3xl text-[0.92rem] leading-6 text-[var(--nuyu-muted)] sm:text-[0.96rem]">
            {description}
          </p>
        ) : null}
      </div>

      <div className="pt-4 sm:pt-5">{children}</div>

      {footer ? (
        <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4">{footer}</div>
      ) : null}
    </section>
  );
}
