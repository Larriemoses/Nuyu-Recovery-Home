import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, FileText, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, RefreshCcw, Settings2, UsersRound, } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button, Tooltip } from "../../../components/ui";
import { cn } from "../../../components/ui/helpers";
import { useAdminAuth } from "../context/admin-auth-provider";
import { useAdminPortal } from "../context/admin-portal-provider";
const navigation = [
    {
        to: "/admin",
        label: "Dashboard",
        description: "See the story behind today’s bookings and follow-ups",
        icon: LayoutDashboard,
    },
    {
        to: "/admin/bookings",
        label: "Bookings",
        description: "Review new requests and move people forward with confidence",
        icon: CalendarDays,
    },
    {
        to: "/admin/services",
        label: "Services",
        description: "Keep services, pricing, and packages up to date",
        icon: BriefcaseBusiness,
    },
    {
        to: "/admin/clients",
        label: "Clients",
        description: "Keep every client detail close and easy to scan",
        icon: UsersRound,
    },
    {
        to: "/admin/operations",
        label: "Operations",
        description: "Adjust schedules, holds, blocked times, and availability",
        icon: Settings2,
    },
    {
        to: "/admin/reports",
        label: "Reports",
        description: "Download daily, weekly, monthly, and yearly snapshots",
        icon: FileText,
    },
];
function AdminBrand({ compact = false, showName = true, }) {
    return (_jsxs(Link, { to: "/", className: cn("flex min-w-0 items-center gap-3", !showName && "justify-center"), children: [_jsx("img", { src: "/nuyu-logo.jpeg", alt: "Nuyu Recovery Home logo", className: cn("rounded-2xl border border-[var(--color-border-subtle)] object-cover", compact ? "h-10 w-10" : "h-12 w-12") }), showName ? (_jsx("div", { className: "min-w-0", children: _jsx("p", { className: cn("truncate font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-gold)]", compact ? "text-[0.72rem]" : "text-sm"), children: "Nuyu Recovery Home" }) })) : null] }));
}
export function AdminShell({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAdminAuth();
    const { isLoading, refresh } = useAdminPortal();
    const activePage = navigation.find((item) => item.to === "/admin"
        ? location.pathname === "/admin"
        : location.pathname.startsWith(item.to)) ?? navigation[0];
    const isNestedPage = activePage.to !== "/admin";
    async function handleSignOut() {
        await signOut();
        navigate("/admin/login", { replace: true });
    }
    return (_jsxs("div", { className: "min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]", children: [_jsxs("div", { className: "mx-auto flex min-h-screen max-w-[1440px]", children: [_jsxs("aside", { className: cn("hidden border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/94 backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col", collapsed ? "lg:w-16" : "lg:w-60"), children: [_jsxs("div", { className: "flex items-center justify-between px-3 py-4", children: [!collapsed ? (_jsx(AdminBrand, {})) : (_jsx("div", { className: "mx-auto", children: _jsx(AdminBrand, { compact: true, showName: false }) })), _jsx(Tooltip, { content: collapsed ? "Expand sidebar" : "Collapse sidebar", children: _jsx(Button, { variant: "ghost", size: "sm", className: cn("shrink-0", collapsed && "mx-auto"), onClick: () => setCollapsed((current) => !current), "aria-label": collapsed ? "Expand sidebar" : "Collapse sidebar", children: collapsed ? (_jsx(PanelLeftOpen, { className: "h-4 w-4" })) : (_jsx(PanelLeftClose, { className: "h-4 w-4" })) }) })] }), _jsx("nav", { className: "mt-2 flex-1 space-y-1 px-2", children: navigation.map((item) => {
                                    const Icon = item.icon;
                                    return (_jsx(Tooltip, { content: collapsed ? item.label.toLowerCase() : item.description, className: collapsed ? "w-full" : undefined, children: _jsxs(NavLink, { to: item.to, end: item.to === "/admin", className: ({ isActive }) => cn("flex min-h-11 items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]", collapsed && "justify-center px-0", isActive
                                                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                                                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text)]"), children: [_jsx(Icon, { className: "h-5 w-5 shrink-0 text-current" }), !collapsed ? _jsx("span", { children: item.label }) : null] }) }, item.to));
                                }) }), _jsx("div", { className: "border-t border-[var(--color-border-subtle)] px-3 py-4", children: _jsx(Button, { variant: "ghost", size: "md", fullWidth: true, leadingIcon: _jsx(LogOut, { className: "h-4 w-4" }), className: collapsed ? "justify-center px-0" : "justify-start", onClick: handleSignOut, children: !collapsed ? "Sign out" : null }) })] }), _jsxs("div", { className: "flex min-h-screen min-w-0 flex-1 flex-col", children: [_jsx("header", { className: "sticky top-0 z-20 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/92 backdrop-blur", children: _jsxs("div", { className: "mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [isNestedPage ? (_jsx(Button, { variant: "ghost", size: "sm", leadingIcon: _jsx(ArrowLeft, { className: "h-4 w-4" }), onClick: () => navigate("/admin"), children: "Back" })) : null, _jsx("div", { className: "lg:hidden", children: _jsx(AdminBrand, { compact: true }) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "secondary", size: "sm", leadingIcon: _jsx(RefreshCcw, { className: cn("h-4 w-4", isLoading && "animate-spin") }), className: "hidden sm:inline-flex", onClick: () => void refresh(), children: isLoading ? "Refreshing…" : "Refresh" }), _jsx(Button, { variant: "secondary", size: "sm", className: "sm:hidden", onClick: () => void refresh(), "aria-label": isLoading ? "Refreshing data" : "Refresh data", children: _jsx(RefreshCcw, { className: cn("h-4 w-4", isLoading && "animate-spin") }) })] })] }) }), _jsx("main", { className: "flex-1 pb-36 lg:pb-8", children: _jsx("div", { className: "mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "route-fade-enter space-y-4", children: children }) }) })] })] }), _jsx("nav", { className: "fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/98 px-3 py-3 backdrop-blur lg:hidden", children: _jsx("div", { className: "grid grid-cols-3 gap-2", children: navigation.map((item) => {
                        const Icon = item.icon;
                        return (_jsxs(NavLink, { to: item.to, end: item.to === "/admin", className: ({ isActive }) => cn("flex min-h-[4.35rem] flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 text-[0.72rem] font-medium transition active:scale-[0.98]", isActive
                                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                                : "bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)]"), children: [_jsx(Icon, { className: "h-4 w-4 text-current" }), _jsx("span", { className: "text-center leading-tight text-current", children: item.label })] }, item.to));
                    }) }) })] }));
}
