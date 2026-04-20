import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cn } from "./helpers";
export function Input({ label, helperText, error, leadingIcon, trailingIcon, id, className, ...props }) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    return (_jsxs("label", { className: "flex w-full flex-col gap-2 text-sm text-[var(--color-text-muted)]", children: [_jsx("span", { className: "font-medium text-[var(--color-text)]", children: label }), _jsxs("span", { className: cn("flex min-h-11 items-center gap-3 rounded-2xl border bg-[var(--color-surface-raised)] px-4 transition focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20", error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]", className), children: [leadingIcon ? (_jsx("span", { className: "text-[var(--color-text-muted)]", children: leadingIcon })) : null, _jsx("input", { id: inputId, className: "h-11 w-full border-0 bg-transparent p-0 text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]", "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : helperText ? helperId : undefined, ...props }), trailingIcon ? (_jsx("span", { className: "text-[var(--color-text-muted)]", children: trailingIcon })) : null] }), error ? (_jsx("span", { id: errorId, className: "text-sm text-[var(--color-danger)]", children: error })) : helperText ? (_jsx("span", { id: helperId, className: "text-sm text-[var(--color-text-muted)]", children: helperText })) : null] }));
}
