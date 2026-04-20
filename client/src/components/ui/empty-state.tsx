import type { ReactNode } from "react";
import { Card } from "./card";

type EmptyStateProps = {
  icon?: ReactNode;
  heading: string;
  subtext: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  heading,
  subtext,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card variant="flat" className={className}>
      <div className="flex flex-col items-start gap-4 sm:items-center sm:text-center">
        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-primary)]">
            {icon}
          </div>
        ) : null}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">{heading}</h3>
          <p className="max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
            {subtext}
          </p>
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </Card>
  );
}
