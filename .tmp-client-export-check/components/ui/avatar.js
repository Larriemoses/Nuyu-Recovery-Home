import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "./helpers";
const sizes = {
    sm: "h-9 w-9 text-sm",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
};
function getInitials(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}
export function Avatar({ name, src, size = "md", className }) {
    return src ? (_jsx("img", { src: src, alt: name, className: cn("rounded-2xl border border-[var(--color-border-subtle)] object-cover", sizes[size], className) })) : (_jsx("span", { "aria-label": name, className: cn("inline-flex items-center justify-center rounded-2xl bg-[var(--color-surface-overlay)] font-semibold text-[var(--color-text)]", sizes[size], className), children: getInitials(name) }));
}
