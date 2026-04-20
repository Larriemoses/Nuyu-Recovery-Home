import { cn } from "./helpers";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[linear-gradient(110deg,var(--color-surface-overlay),var(--color-surface-raised),var(--color-surface-overlay))] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
