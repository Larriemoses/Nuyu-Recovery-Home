import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "./helpers";
export function PageHeader({ title, subtitle, actions, className, }) {
    return (_jsxs("header", { className: cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className), children: [_jsxs("div", { className: "min-w-0 space-y-1", children: [_jsx("h1", { className: "text-2xl font-semibold tracking-[-0.03em] text-[var(--color-text)] sm:text-3xl", children: title }), subtitle ? (_jsx("p", { className: "max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]", children: subtitle })) : null] }), actions ? _jsx("div", { className: "flex shrink-0 flex-wrap gap-2", children: actions }) : null] }));
}
