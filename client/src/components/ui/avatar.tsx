import { cn } from "./helpers";

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-9 w-9 text-sm",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
} as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  return src ? (
    <img
      src={src}
      alt={name}
      className={cn(
        "rounded-2xl border border-[var(--color-border-subtle)] object-cover",
        sizes[size],
        className,
      )}
    />
  ) : (
    <span
      aria-label={name}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl bg-[var(--color-surface-overlay)] font-semibold text-[var(--color-text)]",
        sizes[size],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
