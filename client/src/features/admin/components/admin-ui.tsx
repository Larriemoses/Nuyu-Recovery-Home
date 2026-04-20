import type { PropsWithChildren, ReactNode } from "react";

type AdminPanelProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}>;

type AdminMetricCardProps = {
  label: string;
  value: ReactNode;
  helper?: string;
  accent?: "primary" | "gold" | "muted";
};

type AdminActionTileProps = {
  title: string;
  description: string;
  meta?: string;
  className?: string;
};

const accentClasses: Record<NonNullable<AdminMetricCardProps["accent"]>, string> = {
  primary: "bg-[rgba(47,93,50,0.1)] text-[var(--nuyu-primary)]",
  gold: "bg-[rgba(169,131,24,0.12)] text-[var(--nuyu-gold)]",
  muted: "bg-[rgba(69,87,72,0.1)] text-[var(--nuyu-muted)]",
};

export function AdminPanel({
  eyebrow,
  title,
  description,
  actions,
  footer,
  className,
  contentClassName,
  children,
}: AdminPanelProps) {
  return (
    <section
      className={[
        "admin-panel rounded-2xl p-4 sm:p-5 lg:p-6",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 text-[1.18rem] font-semibold tracking-[-0.03em] text-[var(--nuyu-ink)] sm:text-[1.32rem]">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--nuyu-muted)]">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className={["mt-4", contentClassName ?? ""].join(" ")}>{children}</div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </section>
  );
}

export function AdminMetricCard({
  label,
  value,
  helper,
  accent = "muted",
}: AdminMetricCardProps) {
  return (
    <article className="admin-metric-card h-full rounded-[1.35rem] p-4 sm:p-5">
      <div
        className={[
          "inline-flex rounded-full px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em]",
          accentClasses[accent],
        ].join(" ")}
      >
        {label}
      </div>
      <div className="mt-4 break-words text-[1.85rem] font-semibold tracking-[-0.04em] text-[var(--nuyu-ink)] sm:text-[2rem]">
        {value}
      </div>
      {helper ? (
        <p className="mt-2 text-sm leading-6 text-[var(--nuyu-muted)]">{helper}</p>
      ) : null}
    </article>
  );
}

export function AdminActionTile({
  title,
  description,
  meta,
  className,
}: AdminActionTileProps) {
  return (
    <div
      className={[
        "admin-quiet-card rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-[var(--nuyu-ink)]">{title}</p>
        {meta ? (
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--nuyu-muted)]">
            {meta}
          </span>
        ) : null}
      </div>
      <p className="mt-2 leading-6">{description}</p>
    </div>
  );
}
