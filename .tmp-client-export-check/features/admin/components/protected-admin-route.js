import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LockKeyhole, Sparkles } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Card, EmptyState, PageHeader, Skeleton } from "../../../components/ui";
import { AdminShell } from "./admin-shell-v2";
import { useAdminAuth } from "../context/admin-auth-provider";
import { AdminPortalProvider } from "../context/admin-portal-provider";
export function ProtectedAdminRoute() {
    const location = useLocation();
    const { hasSupabase, isAdmin, isLoading } = useAdminAuth();
    if (!hasSupabase) {
        return (_jsx("div", { className: "min-h-screen bg-[var(--color-surface)] px-4 py-8 sm:px-6", children: _jsxs("div", { className: "mx-auto max-w-3xl space-y-4", children: [_jsx(PageHeader, { title: "Admin Access", subtitle: "Let\u2019s finish the client auth setup before anyone tries to sign in" }), _jsx(EmptyState, { icon: _jsx(LockKeyhole, { className: "h-5 w-5" }), heading: "Supabase auth still needs client configuration", subtext: "The private admin portal can\u2019t open until the frontend has the Supabase authentication keys available." })] }) }));
    }
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-[var(--color-surface)] px-4 py-8 sm:px-6", children: _jsxs("div", { className: "mx-auto max-w-4xl space-y-4", children: [_jsx(PageHeader, { title: "Checking Access", subtitle: "We\u2019re validating your private session and getting your dashboard ready" }), _jsx(Card, { variant: "default", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-3 text-[var(--color-text-muted)]", children: [_jsx(Sparkles, { className: "h-5 w-5 text-[var(--color-primary)]" }), _jsx("p", { className: "text-sm", children: "Loading your admin workspace\u2026" })] }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4", children: [_jsx(Skeleton, { className: "h-28 w-full" }), _jsx(Skeleton, { className: "h-28 w-full" }), _jsx(Skeleton, { className: "h-28 w-full" }), _jsx(Skeleton, { className: "h-28 w-full" })] })] }) })] }) }));
    }
    if (!isAdmin) {
        return (_jsx(Navigate, { to: "/admin/login", replace: true, state: { from: location.pathname } }));
    }
    return (_jsx(AdminPortalProvider, { children: _jsx(AdminShell, { children: _jsx(Outlet, {}) }) }));
}
