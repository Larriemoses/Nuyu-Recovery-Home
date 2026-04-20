import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy } from "react";
import { Navigate, createHashRouter } from "react-router-dom";
import { AppShell } from "../components/layout/app-shell";
import { HomePage } from "../features/home/pages/home-page";
const AdminAuthScope = lazy(() => import("../features/admin/components/admin-auth-scope").then((module) => ({
    default: module.AdminAuthScope,
})));
const ProtectedAdminRoute = lazy(() => import("../features/admin/components/protected-admin-route").then((module) => ({
    default: module.ProtectedAdminRoute,
})));
const AdminLoginPage = lazy(() => import("../features/admin/pages/admin-login-page").then((module) => ({
    default: module.AdminLoginPage,
})));
const AdminPage = lazy(() => import("../features/admin/pages/admin-page").then((module) => ({
    default: module.AdminPage,
})));
const AdminBookingsPage = lazy(() => import("../features/admin/pages/admin-bookings-page").then((module) => ({
    default: module.AdminBookingsPage,
})));
const AdminServicesPage = lazy(() => import("../features/admin/pages/admin-services-page").then((module) => ({
    default: module.AdminServicesPage,
})));
const AdminClientsPage = lazy(() => import("../features/admin/pages/admin-clients-page").then((module) => ({
    default: module.AdminClientsPage,
})));
const AdminOperationsPage = lazy(() => import("../features/admin/pages/admin-operations-page").then((module) => ({
    default: module.AdminOperationsPage,
})));
const AdminReportsPage = lazy(() => import("../features/admin/pages/admin-reports-page").then((module) => ({
    default: module.AdminReportsPage,
})));
function RouteFallback() {
    return (_jsx("div", { className: "flex min-h-[40vh] items-center justify-center px-6 py-12", children: _jsxs("div", { className: "glass-card max-w-xl rounded-[2rem] p-8 text-center", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.28em] text-[var(--nuyu-gold)]", children: "Nuyu" }), _jsx("h1", { className: "display-font mt-4 text-2xl font-semibold text-[var(--nuyu-ink)]", children: "Loading page" }), _jsx("p", { className: "mt-3 text-sm leading-7 text-[var(--nuyu-muted)]", children: "Preparing the next view as quickly as possible." })] }) }));
}
function SuspendedRoute({ children }) {
    return _jsx(Suspense, { fallback: _jsx(RouteFallback, {}), children: children });
}
export const router = createHashRouter([
    {
        path: "/",
        element: _jsx(AppShell, {}),
        children: [
            {
                index: true,
                element: _jsx(HomePage, {}),
            },
            {
                path: "booking",
                element: _jsx(Navigate, { to: "/?book=1", replace: true }),
            },
        ],
    },
    {
        path: "/admin",
        element: (_jsx(SuspendedRoute, { children: _jsx(AdminAuthScope, {}) })),
        children: [
            {
                path: "login",
                element: (_jsx(SuspendedRoute, { children: _jsx(AdminLoginPage, {}) })),
            },
            {
                element: (_jsx(SuspendedRoute, { children: _jsx(ProtectedAdminRoute, {}) })),
                children: [
                    {
                        index: true,
                        element: (_jsx(SuspendedRoute, { children: _jsx(AdminPage, {}) })),
                    },
                    {
                        path: "bookings",
                        element: (_jsx(SuspendedRoute, { children: _jsx(AdminBookingsPage, {}) })),
                    },
                    {
                        path: "services",
                        element: (_jsx(SuspendedRoute, { children: _jsx(AdminServicesPage, {}) })),
                    },
                    {
                        path: "clients",
                        element: (_jsx(SuspendedRoute, { children: _jsx(AdminClientsPage, {}) })),
                    },
                    {
                        path: "operations",
                        element: (_jsx(SuspendedRoute, { children: _jsx(AdminOperationsPage, {}) })),
                    },
                    {
                        path: "reports",
                        element: (_jsx(SuspendedRoute, { children: _jsx(AdminReportsPage, {}) })),
                    },
                ],
            },
        ],
    },
]);
