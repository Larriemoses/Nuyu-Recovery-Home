type AdminStatusPillProps = {
  label: string;
  tone?: "green" | "gold" | "ink" | "rose";
};

const toneClasses: Record<NonNullable<AdminStatusPillProps["tone"]>, string> = {
  green:
    "border-[rgba(47,93,50,0.12)] bg-[rgba(47,93,50,0.1)] text-[var(--nuyu-primary-deep)]",
  gold:
    "border-[rgba(169,131,24,0.14)] bg-[rgba(169,131,24,0.1)] text-[var(--nuyu-ink)]",
  ink: "border-[rgba(24,50,28,0.12)] bg-[rgba(24,50,28,0.08)] text-[var(--nuyu-ink)]",
  rose:
    "border-[rgba(129,88,69,0.12)] bg-[rgba(129,88,69,0.08)] text-[var(--nuyu-ink)]",
};

export function AdminStatusPill({
  label,
  tone = "ink",
}: AdminStatusPillProps) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        toneClasses[tone],
      ].join(" ")}
    >
      {label}
    </span>
  );
}
