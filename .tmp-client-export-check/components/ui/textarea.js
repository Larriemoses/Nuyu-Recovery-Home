import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cn } from "./helpers";
export function Textarea({ label, helperText, error, leadingIcon, id, className, ...props }) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const helperId = `${textareaId}-helper`;
    const errorId = `${textareaId}-error`;
    return (_jsxs("label", { className: "flex w-full flex-col gap-2 text-sm text-[var(--color-text-muted)]", children: [_jsx("span", { className: "font-medium text-[var(--color-text)]", children: label }), _jsxs("span", { className: cn("flex gap-3 rounded-2xl border bg-[var(--color-surface-raised)] px-4 py-3 transition focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20", error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]", className), children: [leadingIcon ? (_jsx("span", { className: "pt-1 text-[var(--color-text-muted)]", children: leadingIcon })) : null, _jsx("textarea", { id: textareaId, className: "min-h-28 w-full resize-none border-0 bg-transparent p-0 text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]", "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : helperText ? helperId : undefined, ...props })] }), error ? (_jsx("span", { id: errorId, className: "text-sm text-[var(--color-danger)]", children: error })) : helperText ? (_jsx("span", { id: helperId, className: "text-sm text-[var(--color-text-muted)]", children: helperText })) : null] }));
}
