import { useAdminPortal } from "../context/admin-portal-provider";
import { AdminEmptyState } from "../components/admin-empty-state";
import { AdminStatusPill } from "../components/admin-status-pill";
import { AdminMetricCard, AdminPanel } from "../components/admin-ui";
import { formatBookingSchedule, formatDateTime } from "../utils/admin-format";
import { formatCurrency } from "../../../utils/currency";

export function AdminBookingsPage() {
  const { data, isLoading, errorMessage } = useAdminPortal();

  if (isLoading) {
    return (
      <AdminPanel eyebrow="Bookings" title="Loading booking records">
        <div className="rounded-[1.5rem] bg-white/75 p-6 text-sm text-[var(--nuyu-muted)]">
          Loading bookings...
        </div>
      </AdminPanel>
    );
  }

  if (errorMessage || !data) {
    return (
      <AdminPanel eyebrow="Bookings" title="Bookings could not be loaded">
        <AdminEmptyState
          title="Booking data is unavailable"
          description={errorMessage ?? "No booking data was returned."}
        />
      </AdminPanel>
    );
  }

  const bookingsToReview = data.bookings
    .filter((booking) => booking.status === "pending" || booking.status === "held")
    .slice(0, 4);
  const recentBookings = data.bookings.slice(0, 6);

  return (
    <div className="space-y-4">
      <AdminPanel
        eyebrow="Bookings"
        title="Booking overview"
        description="Important booking numbers stay at the top, with waiting items and recent activity directly below."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label="Total bookings"
            value={data.metrics.totalBookings}
            helper="All booking records saved"
            accent="primary"
          />
          <AdminMetricCard
            label="Waiting"
            value={data.metrics.pendingBookings + data.metrics.heldBookings}
            helper="Pending and held bookings"
            accent="gold"
          />
          <AdminMetricCard
            label="Confirmed"
            value={data.metrics.confirmedBookings}
            helper="Bookings in a safer stage"
          />
          <AdminMetricCard
            label="Stay requests"
            value={data.metrics.stayRequests}
            helper="Recovery-home requests"
          />
        </div>
      </AdminPanel>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <AdminPanel
          eyebrow="Needs Attention"
          title="Bookings to check first"
          description="These are the items most likely to need admin attention right away."
        >
          <div className="space-y-3">
            {bookingsToReview.length ? (
              bookingsToReview.map((booking) => (
                <article
                  key={booking.id}
                  className="admin-list-row rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-[var(--nuyu-ink)]">{booking.clientName}</p>
                      <p className="mt-1">{booking.serviceName}</p>
                      <p className="mt-2">{formatBookingSchedule(booking)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusPill label={booking.status} tone="gold" />
                      <span className="rounded-full bg-[rgba(244,247,242,0.92)] px-3 py-2 font-semibold text-[var(--nuyu-ink)]">
                        {formatCurrency(booking.totalAmountKobo)}
                      </span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <AdminEmptyState
                title="Nothing is waiting right now"
                description="There are no pending or held bookings at the moment."
              />
            )}
          </div>
        </AdminPanel>

        <AdminPanel
          eyebrow="Recent Records"
          title="Latest booking activity"
          description="Recent records are arranged in compact rows so they stay readable on smaller screens."
        >
          <div className="space-y-3">
            {recentBookings.length ? (
              recentBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="admin-list-row rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--nuyu-ink)]">{booking.clientName}</p>
                      <p className="mt-1">{booking.serviceName}</p>
                      <p className="mt-2">
                        {booking.clientEmail ?? "No email"}
                        {booking.clientPhone ? ` - ${booking.clientPhone}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <AdminStatusPill label={booking.bookingKind} tone="green" />
                      <AdminStatusPill label={booking.status} tone="ink" />
                      <AdminStatusPill label={booking.paymentStatus} tone="gold" />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="admin-quiet-card rounded-[1.2rem] p-3">
                      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--nuyu-gold)]">
                        Schedule
                      </p>
                      <p className="mt-1.5 text-[0.88rem] leading-5">{formatBookingSchedule(booking)}</p>
                    </div>
                    <div className="admin-quiet-card rounded-[1.2rem] p-3">
                      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--nuyu-gold)]">
                        Value
                      </p>
                      <p className="mt-1.5 text-[0.88rem] leading-5">{formatCurrency(booking.totalAmountKobo)}</p>
                      <p className="mt-1 text-[0.84rem] leading-5">Quantity {booking.quantity}</p>
                    </div>
                    <div className="admin-quiet-card rounded-[1.2rem] p-3">
                      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--nuyu-gold)]">
                        Saved
                      </p>
                      <p className="mt-1.5 text-[0.88rem] leading-5">{formatDateTime(booking.createdAt)}</p>
                      <p className="mt-1 text-[0.84rem] leading-5">
                        {booking.paystackReference
                          ? `Reference ${booking.paystackReference}`
                          : "No payment reference yet"}
                      </p>
                    </div>
                    <div className="admin-quiet-card rounded-[1.2rem] p-3">
                      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--nuyu-gold)]">
                        Notes
                      </p>
                      <p className="mt-1.5 text-[0.84rem] leading-5">
                        {booking.notes || "No extra notes were added before payment."}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <AdminEmptyState
                title="No bookings have been created yet"
                description="When clients begin using the public booking flow, every appointment and stay request will appear here."
              />
            )}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
