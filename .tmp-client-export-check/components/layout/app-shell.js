import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, Outlet } from "react-router-dom";
import { PublicFooter } from "./public-footer";
export function AppShell() {
    return (_jsxs("div", { className: "nuyu-page-shell", children: [_jsx("header", { className: "nuyu-page-header px-4 py-3 sm:px-6 sm:py-4", children: _jsx("div", { className: "mx-auto flex max-w-7xl items-center justify-between gap-3", children: _jsx(Link, { to: "/", className: "inline-flex", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("img", { src: "/nuyu-logo.jpeg", alt: "Nuyu Recovery Home logo", className: "h-12 w-12 rounded-2xl border border-[var(--color-border-subtle)] object-cover shadow-[0_14px_28px_rgba(17,24,19,0.08)]" }), _jsx("div", { children: _jsx("p", { className: "text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-gold)]", children: "Nuyu Recovery Home" }) })] }) }) }) }), _jsx("main", { className: "mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5", children: _jsx(Outlet, {}) }), _jsx(PublicFooter, {})] }));
}
