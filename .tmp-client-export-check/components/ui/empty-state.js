import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "./card";
export function EmptyState({ icon, heading, subtext, action, className, }) {
    return (_jsx(Card, { variant: "flat", className: className, children: _jsxs("div", { className: "flex flex-col items-start gap-4 sm:items-center sm:text-center", children: [icon ? (_jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-primary)]", children: icon })) : null, _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-lg font-semibold text-[var(--color-text)]", children: heading }), _jsx("p", { className: "max-w-xl text-sm leading-6 text-[var(--color-text-muted)]", children: subtext })] }), action ? _jsx("div", { children: action }) : null] }) }));
}
