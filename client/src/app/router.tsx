import { Suspense, lazy, type PropsWithChildren } from "react";
import { createHashRouter } from "react-router-dom";
import { AppShell } from "../components/layout/app-shell";
import { HomePage } from "../features/home/pages/home-page";
const BookingPage = lazy(() =>
  import("../features/booking/pages/booking-page").then((module) => ({
    default: module.BookingPage,
  })),
);
const AdminAuthScope = lazy(() =>
  import("../features/admin/components/admin-auth-scope").then((module) => ({
    default: module.AdminAuthScope,
  })),
);
const ProtectedAdminRoute = lazy(() =>
  import("../features/admin/components/protected-admin-route").then((module) => ({
    default: module.ProtectedAdminRoute,
  })),
);
const AdminLoginPage = lazy(() =>
  import("../features/admin/pages/admin-login-page").then((module) => ({
    default: module.AdminLoginPage,
  })),
);
const AdminPage = lazy(() =>
  import("../features/admin/pages/admin-page").then((module) => ({
    default: module.AdminPage,
  })),
);
const AdminBookingsPage = lazy(() =>
  import("../features/admin/pages/admin-bookings-page").then((module) => ({
    default: module.AdminBookingsPage,
  })),
);
const AdminServicesPage = lazy(() =>
  import("../features/admin/pages/admin-services-page").then((module) => ({
    default: module.AdminServicesPage,
  })),
);
const AdminClientsPage = lazy(() =>
  import("../features/admin/pages/admin-clients-page").then((module) => ({
    default: module.AdminClientsPage,
  })),
);
const AdminOperationsPage = lazy(() =>
  import("../features/admin/pages/admin-operations-page").then((module) => ({
    default: module.AdminOperationsPage,
  })),
);
const AdminReportsPage = lazy(() =>
  import("../features/admin/pages/admin-reports-page").then((module) => ({
    default: module.AdminReportsPage,
  })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-12">
      <div className="glass-card max-w-xl rounded-[2rem] p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--nuyu-gold)]">
          Nuyu
        </p>
        <h1 className="display-font mt-4 text-2xl font-semibold text-[var(--nuyu-ink)]">
          Loading page
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--nuyu-muted)]">
          Preparing the next view as quickly as possible.
        </p>
      </div>
    </div>
  );
}

function SuspendedRoute({ children }: PropsWithChildren) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export const router = createHashRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "booking",
        element: (
          <SuspendedRoute>
            <BookingPage />
          </SuspendedRoute>
        ),
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <SuspendedRoute>
        <AdminAuthScope />
      </SuspendedRoute>
    ),
    children: [
      {
        path: "login",
        element: (
          <SuspendedRoute>
            <AdminLoginPage />
          </SuspendedRoute>
        ),
      },
      {
        element: (
          <SuspendedRoute>
            <ProtectedAdminRoute />
          </SuspendedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <SuspendedRoute>
                <AdminPage />
              </SuspendedRoute>
            ),
          },
          {
            path: "bookings",
            element: (
              <SuspendedRoute>
                <AdminBookingsPage />
              </SuspendedRoute>
            ),
          },
          {
            path: "services",
            element: (
              <SuspendedRoute>
                <AdminServicesPage />
              </SuspendedRoute>
            ),
          },
          {
            path: "clients",
            element: (
              <SuspendedRoute>
                <AdminClientsPage />
              </SuspendedRoute>
            ),
          },
          {
            path: "operations",
            element: (
              <SuspendedRoute>
                <AdminOperationsPage />
              </SuspendedRoute>
            ),
          },
          {
            path: "reports",
            element: (
              <SuspendedRoute>
                <AdminReportsPage />
              </SuspendedRoute>
            ),
          },
        ],
      },
    ],
  },
]);
