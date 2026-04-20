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
    return (
      <div className="min-h-screen bg-[var(--color-surface)] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <PageHeader
            title="Admin Access"
            subtitle="Let’s finish the client auth setup before anyone tries to sign in"
          />
          <EmptyState
            icon={<LockKeyhole className="h-5 w-5" />}
            heading="Supabase auth still needs client configuration"
            subtext="The private admin portal can’t open until the frontend has the Supabase authentication keys available."
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <PageHeader
            title="Checking Access"
            subtitle="We’re validating your private session and getting your dashboard ready"
          />
          <Card variant="default">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
                <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
                <p className="text-sm">Loading your admin workspace…</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            </div>
          </Card>
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
