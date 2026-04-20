import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "./helpers";
const variantClasses = {
    default: "border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-sm",
    elevated: "border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-md",
    flat: "border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] shadow-none",
};
export function Card({ variant = "default", className, header, footer, contentClassName, children, }) {
    return (_jsxs("section", { className: cn("rounded-2xl transition duration-200", variantClasses[variant], className), children: [header ? _jsx("div", { className: "border-b border-[var(--color-border-subtle)] px-4 py-4 sm:px-5", children: header }) : null, _jsx("div", { className: cn("px-4 py-4 sm:px-5", contentClassName), children: children }), footer ? _jsx("div", { className: "border-t border-[var(--color-border-subtle)] px-4 py-4 sm:px-5", children: footer }) : null] }));
}
