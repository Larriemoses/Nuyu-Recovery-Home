import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./button";
export function Drawer({ open, onClose, title, description, footer, children, }) {
    const panelRef = useRef(null);
    useEffect(() => {
        if (!open) {
            return;
        }
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose();
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        panelRef.current?.querySelector("button, [href], input, select, textarea")?.focus();
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);
    if (!open) {
        return null;
    }
    return createPortal(_jsxs("div", { className: "fixed inset-0 z-50 bg-black/45 backdrop-blur-sm", children: [_jsx("div", { className: "absolute inset-0", onClick: onClose, "aria-hidden": "true" }), _jsx("div", { className: "absolute inset-x-0 bottom-0 top-auto sm:inset-y-0 sm:right-0 sm:left-auto", children: _jsxs("div", { ref: panelRef, role: "dialog", "aria-modal": "true", "aria-label": title, className: "flex h-[82vh] w-full flex-col rounded-t-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] sm:h-full sm:w-[28rem] sm:rounded-none sm:rounded-l-3xl", children: [_jsxs("div", { className: "flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] px-4 py-4 sm:px-6", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h2", { className: "text-xl font-semibold text-[var(--color-text)]", children: title }), description ? (_jsx("p", { className: "text-sm leading-6 text-[var(--color-text-muted)]", children: description })) : null] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, "aria-label": "Close drawer", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto px-4 py-4 sm:px-6", children: children }), footer ? (_jsx("div", { className: "border-t border-[var(--color-border-subtle)] px-4 py-4 sm:px-6", children: footer })) : null] }) })] }), document.body);
}
