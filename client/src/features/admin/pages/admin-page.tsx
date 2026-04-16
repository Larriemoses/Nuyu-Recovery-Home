import { Link } from "react-router-dom";
import { SectionCard } from "../../../components/ui/section-card";
import { formatCurrency } from "../../../utils/currency";
import { AdminEmptyState } from "../components/admin-empty-state";
import { AdminStatusPill } from "../components/admin-status-pill";
import { useAdminPortal } from "../context/admin-portal-provider";
import { formatBookingSchedule, formatDateTime } from "../utils/admin-format";

const quickActions = [
  {
    to: "/admin/bookings",
    title: "Review bookings",
    description: "Check every appointment, package booking, and stay request.",
  },
  {
    to: "/admin/reports",
    title: "Open reports",
    description: "View daily, weekly, monthly, and yearly reports and export them.",
  },
  {
    to: "/admin/services",
    title: "Check services",
    description: "Review pricing, packages, and availability windows.",
  },
  {
    to: "/admin/operations",
    title: "Watch operations",
    description: "See holds, blocked slots, and payment readiness in one place.",
  },
];

export function AdminPage() {
  const { data, isLoading, errorMessage } = useAdminPortal();

  if (isLoading) {
    return (
      <SectionCard eyebrow="Admin Home" title="Loading admin home">
        <div className="rounded-[1.5rem] bg-white/75 p-6 text-sm text-[var(--nuyu-muted)]">
          Loading live admin data...
        </div>
      </SectionCard>
    );
  }

  if (errorMessage || !data) {
    return (
      <SectionCard eyebrow="Admin Home" title="Admin home could not be loaded">
        <AdminEmptyState
          title="Admin data is unavailable"
          description={errorMessage ?? "No admin data was returned."}
        />
      </SectionCard>
    );
  }

  const waitingForReview = data.metrics.pendingBookings + data.metrics.heldBookings;

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Admin Home"
        title="Simple view of what needs attention today"
        description="Use this page to see the most important numbers first, then jump straight to the next task without needing technical tools."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] bg-white/78 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
              Waiting for review
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--nuyu-ink)]">
              {waitingForReview}
            </p>
            <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
              Pending and held bookings that may need attention
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/78 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
              Total clients
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--nuyu-ink)]">
              {data.metrics.totalClients}
            </p>
            <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
              Client records currently stored in the system
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/78 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
              Active services
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--nuyu-ink)]">
              {data.metrics.activeServicesCount}
            </p>
            <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
              Live services the team can currently offer
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/78 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
              Revenue tracked
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--nuyu-ink)]">
              {formatCurrency(data.metrics.totalRevenueKobo)}
            </p>
            <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
              Paid or confirmed value saved so far
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-[1.5rem] border border-[rgba(47,93,50,0.08)] bg-[var(--nuyu-cream)] p-5 transition hover:bg-white"
            >
              <p className="text-sm font-semibold text-[var(--nuyu-ink)]">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--nuyu-muted)]">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Ready Now"
        title="What is working today"
        description="This keeps the admin team clear on what can be tested now and what still comes later."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[1.5rem] bg-[var(--nuyu-cream)] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--nuyu-ink)]">Booking flow</p>
              <AdminStatusPill label="Ready" tone="green" />
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--nuyu-muted)]">
              The public site and booking flow are ready to test up to the payment handoff step.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-[var(--nuyu-cream)] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--nuyu-ink)]">Admin portal</p>
              <AdminStatusPill label="Ready" tone="green" />
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--nuyu-muted)]">
              Admin login, overview pages, and private reports are all live and ready for testing.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-[var(--nuyu-cream)] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--nuyu-ink)]">Paystack</p>
              <AdminStatusPill
                label={data.setup.paystackConfigured ? "Ready" : "Later"}
                tone={data.setup.paystackConfigured ? "green" : "gold"}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--nuyu-muted)]">
              {data.setup.paystackConfigured
                ? "Payment is connected."
                : "Payment is still the final stage, so the app should be tested through booking and admin review first."}
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          eyebrow="Recent bookings"
          title="Latest activity"
          description="These are the newest records the admin team may want to review first."
        >
          <div className="space-y-3">
            {data.recentBookings.length ? (
              data.recentBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-[1.5rem] border border-[rgba(47,93,50,0.08)] bg-white/78 p-4 text-sm text-[var(--nuyu-muted)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--nuyu-ink)]">{booking.clientName}</p>
                      <p className="mt-1">{booking.serviceName}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <AdminStatusPill label={booking.bookingKind} tone="green" />
                      <AdminStatusPill label={booking.status} tone="ink" />
                    </div>
                  </div>

                  <p className="mt-3">{formatBookingSchedule(booking)}</p>
                  <p className="mt-2 font-semibold text-[var(--nuyu-ink)]">
                    {formatCurrency(booking.totalAmountKobo)}
                  </p>
                </article>
              ))
            ) : (
              <AdminEmptyState
                title="No bookings yet"
                description="When people start using the public booking flow, the newest records will appear here."
              />
            )}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Active holds"
          title="Reservations waiting on the next step"
          description="These are the time-sensitive reservations that are still being held."
        >
          <div className="space-y-3">
            {data.activeHolds.length ? (
              data.activeHolds.map((hold) => (
                <article
                  key={hold.id}
                  className="rounded-[1.5rem] border border-[rgba(47,93,50,0.08)] bg-white/78 p-4 text-sm text-[var(--nuyu-muted)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--nuyu-ink)]">{hold.serviceName}</p>
                      <p className="mt-1">{hold.clientEmail}</p>
                    </div>
                    <AdminStatusPill label="Hold" tone="gold" />
                  </div>
                  <p className="mt-3">{formatDateTime(hold.startsAt)}</p>
                  <p className="mt-1">Expires {formatDateTime(hold.expiresAt)}</p>
                </article>
              ))
            ) : (
              <AdminEmptyState
                title="No active holds right now"
                description="When a booking is temporarily reserved, it will show here."
              />
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        eyebrow="Service snapshot"
        title="Where demand is building"
        description="This shows which services are already attracting the most activity."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.servicePerformance.length ? (
            data.servicePerformance.map((item) => (
              <article
                key={item.serviceId}
                className="rounded-[1.5rem] bg-white/78 p-5 text-sm text-[var(--nuyu-muted)]"
              >
                <p className="font-semibold text-[var(--nuyu-ink)]">{item.serviceName}</p>
                <p className="mt-2 capitalize">{item.bookingKind}</p>
                <p className="mt-4">{item.bookingsCount} bookings so far</p>
                <p className="mt-1">
                  {item.pendingCount} pending and {item.heldCount} held
                </p>
                <p className="mt-3 font-semibold text-[var(--nuyu-ink)]">
                  {formatCurrency(item.estimatedValueKobo)}
                </p>
              </article>
            ))
          ) : (
            <AdminEmptyState
              title="Service activity will appear here"
              description="Once bookings come in, this section will show which services are attracting demand."
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
}
