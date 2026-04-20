type AdminStatusPillProps = {
  label: string;
  tone?: "green" | "gold" | "ink" | "rose";
};

const toneClasses: Record<NonNullable<AdminStatusPillProps["tone"]>, string> = {
  green: "border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
  gold:
    "border-transparent bg-[color-mix(in_oklab,var(--color-warning)_16%,white)] text-[var(--color-warning)]",
  ink:
    "border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] text-[var(--color-text)]",
  rose:
    "border-transparent bg-[color-mix(in_oklab,var(--color-danger)_14%,white)] text-[var(--color-danger)]",
};

export function AdminStatusPill({
  label,
  tone = "ink",
}: AdminStatusPillProps) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em]",
        toneClasses[tone],
      ].join(" ")}
    >
      {label}
    </span>
  );
}
