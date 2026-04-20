import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "./helpers";
const badgeClasses = {
    default: "bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)] border-[var(--color-border)]",
    success: "bg-[color-mix(in_oklab,var(--color-success)_14%,transparent)] text-[var(--color-success)] border-[color-mix(in_oklab,var(--color-success)_24%,transparent)]",
    warning: "bg-[color-mix(in_oklab,var(--color-warning)_14%,transparent)] text-[var(--color-warning)] border-[color-mix(in_oklab,var(--color-warning)_24%,transparent)]",
    danger: "bg-[color-mix(in_oklab,var(--color-danger)_14%,transparent)] text-[var(--color-danger)] border-[color-mix(in_oklab,var(--color-danger)_24%,transparent)]",
    info: "bg-[color-mix(in_oklab,var(--color-info)_14%,transparent)] text-[var(--color-info)] border-[color-mix(in_oklab,var(--color-info)_24%,transparent)]",
};
export function Badge({ children, variant = "default", withDot, className, }) {
    return (_jsxs("span", { className: cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium", badgeClasses[variant], className), children: [withDot ? _jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-current" }) : null, _jsx("span", { children: children })] }));
}
