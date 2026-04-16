import { Link, NavLink, useNavigate } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { BrandMark } from "../../../components/layout/brand-mark";
import { useAdminAuth } from "../context/admin-auth-provider";
import { useAdminPortal } from "../context/admin-portal-provider";

const navigation = [
  {
    to: "/admin",
    label: "Home",
    description: "Start here for the clearest summary of what needs attention.",
  },
  {
    to: "/admin/bookings",
    label: "Bookings",
    description: "See every appointment, package booking, and stay request.",
  },
  {
    to: "/admin/services",
    label: "Services",
    description: "Review pricing, packages, and availability windows.",
  },
  {
    to: "/admin/clients",
    label: "Clients",
    description: "Review people, contact details, and activity.",
  },
  {
    to: "/admin/operations",
    label: "Operations",
    description: "Track holds, blocked slots, and payment readiness.",
  },
  {
    to: "/admin/reports",
    label: "Reports",
    description: "View and export daily, weekly, monthly, and yearly reports.",
  },
];

export function AdminShell({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const { adminUser, signOut } = useAdminAuth();
  const { data, isLoading, refresh } = useAdminPortal();

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(47,93,50,0.06),rgba(247,243,232,0.95))]">
      <header className="border-b border-[rgba(47,93,50,0.08)] bg-[rgba(247,243,232,0.9)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/" className="inline-flex">
            <BrandMark
              size="sm"
              subtitle="Private admin space for bookings, clients, services, reports, and operations"
            />
          </Link>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="rounded-[1.5rem] border border-[rgba(47,93,50,0.08)] bg-white/70 px-5 py-3 text-sm text-[var(--nuyu-muted)]">
              <p className="font-semibold text-[var(--nuyu-ink)]">
                {adminUser?.fullName ?? "Admin"}
              </p>
              <p className="mt-1">{adminUser?.email ?? "Private admin session"}</p>
            </div>

            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-full border border-[rgba(47,93,50,0.12)] bg-white/80 px-5 py-3 text-sm font-semibold text-[var(--nuyu-primary)] transition hover:bg-white"
            >
              {isLoading ? "Refreshing..." : "Refresh data"}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-[var(--nuyu-primary)] bg-[var(--nuyu-primary)] px-5 py-3 text-sm font-semibold text-[var(--nuyu-cream)] transition hover:opacity-90"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
        <section className="glass-card rounded-[2rem] p-4 sm:p-5">
          <div className="mb-4 rounded-[1.5rem] bg-[rgba(47,93,50,0.08)] px-4 py-4 text-sm text-[var(--nuyu-muted)]">
            <p className="font-semibold text-[var(--nuyu-ink)]">
              Choose what you want to manage today
            </p>
            <p className="mt-1">
              Each page is written to be simple to use without technical knowledge.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                className={({ isActive }) =>
                  [
                    "rounded-[1.5rem] border p-4 transition",
                    isActive
                      ? "border-[var(--nuyu-primary)] bg-[rgba(47,93,50,0.1)]"
                      : "border-[rgba(47,93,50,0.08)] bg-white/70 hover:bg-white",
                  ].join(" ")
                }
              >
                <p className="text-sm font-semibold text-[var(--nuyu-ink)]">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--nuyu-muted)]">
                  {item.description}
                </p>
              </NavLink>
            ))}
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="rounded-full border border-[rgba(47,93,50,0.08)] bg-white/70 px-4 py-2 text-sm text-[var(--nuyu-muted)]">
            {data?.metrics.totalBookings ?? 0} bookings
          </div>
          <div className="rounded-full border border-[rgba(47,93,50,0.08)] bg-white/70 px-4 py-2 text-sm text-[var(--nuyu-muted)]">
            {data?.metrics.totalClients ?? 0} clients
          </div>
          <div className="rounded-full border border-[rgba(47,93,50,0.08)] bg-white/70 px-4 py-2 text-sm text-[var(--nuyu-muted)]">
            {data?.metrics.activeHolds ?? 0} holds waiting
          </div>
          <div className="rounded-full border border-[rgba(47,93,50,0.08)] bg-white/70 px-4 py-2 text-sm text-[var(--nuyu-muted)]">
            {data?.metrics.activeServicesCount ?? 0} live services
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 pb-12 sm:px-8">{children}</main>
    </div>
  );
}
