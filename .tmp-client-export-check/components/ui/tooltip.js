import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cn } from "./helpers";
export function Tooltip({ content, className, children }) {
    const tooltipId = useId();
    return (_jsxs("span", { className: cn("group relative inline-flex", className), children: [_jsx("span", { "aria-describedby": tooltipId, children: children }), _jsx("span", { id: tooltipId, role: "tooltip", className: "pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-overlay)] px-3 py-2 text-xs text-[var(--color-text-muted)] shadow-md group-hover:block group-focus-within:block", children: content })] }));
}
