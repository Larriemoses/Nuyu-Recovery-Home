import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "./helpers";
export function Skeleton({ className }) {
    return (_jsx("div", { className: cn("animate-pulse rounded-2xl bg-[linear-gradient(110deg,var(--color-surface-overlay),var(--color-surface-raised),var(--color-surface-overlay))] bg-[length:200%_100%]", className) }));
}
