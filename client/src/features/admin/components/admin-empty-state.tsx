type AdminEmptyStateProps = {
  title: string;
  description: string;
};

export function AdminEmptyState({ title, description }: AdminEmptyStateProps) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[rgba(47,93,50,0.14)] bg-white/70 p-6 text-sm leading-7 text-[var(--nuyu-muted)]">
      <p className="font-semibold text-[var(--nuyu-ink)]">{title}</p>
      <p className="mt-2">{description}</p>
    </div>
  );
}
