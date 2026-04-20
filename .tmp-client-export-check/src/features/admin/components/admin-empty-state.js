import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function AdminEmptyState({ title, description }) {
    return (_jsxs("div", { className: "rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-6 text-sm leading-7 text-[var(--nuyu-muted)]", children: [_jsx("p", { className: "font-semibold text-[var(--nuyu-ink)]", children: title }), _jsx("p", { className: "mt-2", children: description })] }));
}
