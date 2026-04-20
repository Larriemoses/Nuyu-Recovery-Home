import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  HeartHandshake,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  Feedback,
  Skeleton,
} from "../../../components/ui";
import { formatCurrency } from "../../../utils/currency";
import { useAdminPortal } from "../context/admin-portal-provider";
import { formatBookingSchedule } from "../utils/admin-format";

const quickActions = [
  {
    to: "/admin/bookings",
    title: "Review bookings",
  },
  {
    to: "/admin/operations",
    title: "Update availability",
  },
  {
    to: "/admin/reports",
    title: "Export reports",
  },
  {
    to: "/admin/services",
    title: "Check services",
  },
] as const;

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(14rem,1fr))]">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

type MetricTileProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint: string;
  to?: string;
};

function MetricTile({ icon, label, value, hint, to }: MetricTileProps) {
  const tile = (
    <Card
      variant="default"
      className={[
        "relative h-full",
        to ? "transition-colors duration-200 group-hover:border-[var(--color-border)]" : "",
      ].join(" ")}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-surface-overlay)] text-[var(--color-primary)]">
            {icon}
          </span>
        </div>
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text)]">
            {value}
          </p>
        </div>
        <p className={["text-sm leading-6 text-[var(--color-text-muted)]", to ? "pr-8" : ""].join(" ")}>
          {hint}
        </p>
        {to ? (
          <ArrowRight className="pointer-events-none absolute bottom-5 right-5 h-4 w-4 text-[var(--color-text-muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--color-text)]" />
        ) : null}
      </div>
    </Card>
  );

  if (!to) {
    return tile;
  }

  return (
    <Link to={to} className="group block h-full">
      {tile}
    </Link>
  );
}

function getMomentumWidthClass(bookingsCount: number, strongestCount: number) {
  const ratio = strongestCount > 0 ? bookingsCount / strongestCount : 0;

  if (ratio >= 0.95) {
    return "w-full";
  }

  if (ratio >= 0.8) {
    return "w-10/12";
  }

  if (ratio >= 0.65) {
    return "w-8/12";
  }

  if (ratio >= 0.5) {
    return "w-6/12";
  }

  if (ratio >= 0.35) {
    return "w-5/12";
  }

  if (ratio >= 0.2) {
    return "w-4/12";
  }

  return "w-3/12";
}

export function AdminPage() {
  const { data, isLoading, errorMessage } = useAdminPortal();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (errorMessage || !data) {
    return (
      <div className="space-y-4">
        <Feedback
          variant="error"
          title="We couldn’t load the dashboard"
          message={errorMessage ?? "Something interrupted the admin data load, so the overview is empty right now."}
        />
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          heading="Your dashboard isn’t ready yet"
          subtext="Refresh the page once the server is back up, and we’ll bring your latest bookings, services, and reports right back."
        />
      </div>
    );
  }

  const waitingForReview = data.metrics.pendingBookings + data.metrics.heldBookings;
  const latestBookings = data.recentBookings.slice(0, 4);
  const topServices = data.servicePerformance.slice(0, 4);
  const attentionMessage =
    waitingForReview === 0
      ? "No bookings need your attention today."
      : `${waitingForReview} booking${waitingForReview === 1 ? "" : "s"} need your attention today.`;

  return (
    <div className="space-y-4">
      <Feedback variant="warning" message={attentionMessage} />

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(14rem,1fr))]">
        <MetricTile
          icon={<Clock3 className="h-5 w-5" />}
          label="Needs attention"
          value={waitingForReview}
          hint="Pending bookings to review"
          to="/admin/bookings?filter=attention"
        />
        <MetricTile
          icon={<CircleDollarSign className="h-5 w-5" />}
          label="Tracked revenue"
          value={formatCurrency(data.metrics.totalRevenueKobo)}
          hint="Confirmed payment value"
        />
        <MetricTile
          icon={<UsersRound className="h-5 w-5" />}
          label="Clients"
          value={data.metrics.totalClients}
          hint="Clients in your workspace"
        />
        <MetricTile
          icon={<BriefcaseBusiness className="h-5 w-5" />}
          label="Active services"
          value={data.metrics.activeServicesCount}
          hint="Services clients can book"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <Card
          variant="elevated"
          header={<p className="text-lg font-semibold text-[var(--color-text)]">Quick actions</p>}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link key={action.to} to={action.to} className="group">
                <div className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] px-4 py-3 transition duration-200 group-hover:border-[var(--color-border)] group-hover:bg-[var(--color-surface-raised)] group-active:scale-[0.98]">
                  <p className="font-semibold text-[var(--color-text)]">{action.title}</p>
                  <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-text)]" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card
          variant="default"
          header={<p className="text-lg font-semibold text-[var(--color-text)]">System status</p>}
        >
          <div className="space-y-3">
            <div className="rounded-2xl bg-[var(--color-surface-overlay)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[var(--color-text)]">Booking flow</p>
                <Badge variant="success" withDot>
                  ready
                </Badge>
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--color-surface-overlay)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[var(--color-text)]">Admin controls</p>
                <Badge variant="success" withDot>
                  ready
                </Badge>
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--color-surface-overlay)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[var(--color-text)]">Paystack</p>
                <Badge variant={data.setup.paystackConfigured ? "success" : "warning"} withDot>
                  {data.setup.paystackConfigured ? "connected" : "later"}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <Card
          variant="default"
          header={
            <div className="space-y-1">
              <p className="text-lg font-semibold text-[var(--color-text)]">Recent activity</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                The newest bookings stay close, so you can scan them without extra clicks
              </p>
            </div>
          }
        >
          <div className="space-y-3">
            {latestBookings.length ? (
              latestBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] px-4 py-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar name={booking.clientName} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--color-text)]">{booking.clientName}</p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          {booking.serviceName}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                          {formatBookingSchedule(booking)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">{booking.bookingKind}</Badge>
                      <Badge
                        variant={
                          booking.status === "confirmed"
                            ? "success"
                            : booking.status === "pending" || booking.status === "held"
                              ? "warning"
                              : booking.status === "cancelled"
                                ? "danger"
                                : "default"
                        }
                      >
                        {booking.status}
                      </Badge>
                      <Badge variant="default">{formatCurrency(booking.totalAmountKobo)}</Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<CalendarClock className="h-5 w-5" />}
                heading="No bookings yet"
                subtext="Once clients start booking, their latest activity will appear here and give you a simple place to start"
              />
            )}
          </div>
        </Card>

        <Card
          variant="default"
          header={
            <div className="space-y-1">
              <p className="text-lg font-semibold text-[var(--color-text)]">Service momentum</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                See which services are pulling the most demand right now
              </p>
            </div>
          }
        >
          <div className="space-y-4">
            {topServices.length ? (
              topServices.map((service, index) => {
                const strongestCount = Math.max(topServices[0]?.bookingsCount ?? 1, 1);

                return (
                  <div key={service.serviceId} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--color-text)]">
                          {service.serviceName}
                        </p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {service.pendingCount} pending, {service.heldCount} held
                        </p>
                      </div>
                      <Badge variant={index === 0 ? "success" : "info"}>
                        {service.bookingsCount} booked
                      </Badge>
                    </div>
                    <div className="h-2.5 rounded-full bg-[var(--color-surface-overlay)]">
                      <div
                        className={[
                          "h-2.5 rounded-full bg-[var(--color-primary)] transition-all duration-300",
                          getMomentumWidthClass(service.bookingsCount, strongestCount),
                        ].join(" ")}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm text-[var(--color-text-muted)]">
                      <span className="capitalize">{service.bookingKind}</span>
                      <span>{formatCurrency(service.estimatedValueKobo)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={<HeartHandshake className="h-5 w-5" />}
                heading="Service momentum will show up here"
                subtext="As new bookings come in, this panel will help you spot which services are gaining traction first"
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
