import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "./helpers";
const focusableSelector = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
export function Modal({ open, onClose, title, description, footer, panelClassName, contentClassName, children, }) {
    const panelRef = useRef(null);
    useEffect(() => {
        if (!open) {
            return;
        }
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose();
            }
            if (event.key !== "Tab" || !panelRef.current) {
                return;
            }
            const focusable = Array.from(panelRef.current.querySelectorAll(focusableSelector)).filter((element) => !element.hasAttribute("disabled"));
            if (!focusable.length) {
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        const firstFocusable = panelRef.current?.querySelector(focusableSelector);
        firstFocusable?.focus();
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);
    if (!open) {
        return null;
    }
    return createPortal(_jsxs("div", { className: "fixed inset-0 z-50 bg-black/45 backdrop-blur-sm", children: [_jsx("div", { className: "absolute inset-0", onClick: onClose, "aria-hidden": "true" }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center p-2 sm:p-4 lg:p-6", children: _jsxs("div", { ref: panelRef, role: "dialog", "aria-modal": "true", "aria-label": title, className: cn("relative flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.08)] sm:max-h-[86vh] sm:rounded-[1.5rem]", panelClassName), children: [_jsxs("div", { className: "flex items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3 sm:px-5", children: [_jsxs("div", { className: "min-w-0 space-y-1", children: [_jsx("h2", { className: "text-base font-semibold text-[var(--color-text)] sm:text-lg", children: title }), description ? (_jsx("p", { className: "text-sm leading-6 text-[var(--color-text-muted)]", children: description })) : null] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, "aria-label": "Close modal", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx("div", { className: cn("flex-1 overflow-y-auto px-4 py-4 sm:px-5", contentClassName), children: children }), footer ? (_jsx("div", { className: "border-t border-[var(--color-border-subtle)] px-4 py-3 sm:px-5", children: footer })) : null] }) })] }), document.body);
}
