type AdminEmptyStateProps = {
  title: string;
  description: string;
};

export function AdminEmptyState({ title, description }: AdminEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-6 text-sm leading-7 text-[var(--nuyu-muted)]">
      <p className="font-semibold text-[var(--nuyu-ink)]">{title}</p>
      <p className="mt-2">{description}</p>
    </div>
  );
}
