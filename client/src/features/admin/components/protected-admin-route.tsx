import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AdminShell } from "./admin-shell";
import { useAdminAuth } from "../context/admin-auth-provider";
import { AdminPortalProvider } from "../context/admin-portal-provider";

export function ProtectedAdminRoute() {
  const location = useLocation();
  const { hasSupabase, isAdmin, isLoading } = useAdminAuth();

  if (!hasSupabase) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="glass-card max-w-xl rounded-[2rem] p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--nuyu-gold)]">
            Admin Access
          </p>
          <h1 className="display-font mt-4 text-3xl font-semibold text-[var(--nuyu-ink)]">
            Supabase auth still needs client configuration
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--nuyu-muted)]">
            The private admin portal cannot open until the frontend has the
            Supabase authentication keys available.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="glass-card max-w-xl rounded-[2rem] p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--nuyu-gold)]">
            Admin Access
          </p>
          <h1 className="display-font mt-4 text-3xl font-semibold text-[var(--nuyu-ink)]">
            Checking your private session
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--nuyu-muted)]">
            We are validating your admin credentials and loading the private dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return (
    <AdminPortalProvider>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </AdminPortalProvider>
  );
}
