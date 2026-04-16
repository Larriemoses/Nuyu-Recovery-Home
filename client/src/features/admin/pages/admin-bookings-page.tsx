import { SectionCard } from "../../../components/ui/section-card";
import { useAdminPortal } from "../context/admin-portal-provider";
import { AdminEmptyState } from "../components/admin-empty-state";
import { AdminStatusPill } from "../components/admin-status-pill";
import { formatBookingSchedule, formatDateTime } from "../utils/admin-format";
import { formatCurrency } from "../../../utils/currency";

export function AdminBookingsPage() {
  const { data, isLoading, errorMessage } = useAdminPortal();

  if (isLoading) {
    return (
      <SectionCard eyebrow="Bookings" title="Loading booking records">
        <div className="rounded-[1.5rem] bg-white/75 p-6 text-sm text-[var(--nuyu-muted)]">
          Loading bookings...
        </div>
      </SectionCard>
    );
  }

  if (errorMessage || !data) {
    return (
      <SectionCard eyebrow="Bookings" title="Bookings could not be loaded">
        <AdminEmptyState
          title="Booking data is unavailable"
          description={errorMessage ?? "No booking data was returned."}
        />
      </SectionCard>
    );
  }

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Bookings"
        title="Every booking in one simple place"
        description="Review appointments, package bookings, and stay requests without needing database access."
      >
        <div className="flex flex-wrap gap-3 text-sm text-[var(--nuyu-muted)]">
          <div className="rounded-full bg-white/80 px-4 py-2">
            {data.metrics.totalBookings} total bookings
          </div>
          <div className="rounded-full bg-white/80 px-4 py-2">
            {data.metrics.pendingBookings} pending
          </div>
          <div className="rounded-full bg-white/80 px-4 py-2">
            {data.metrics.heldBookings} held
          </div>
          <div className="rounded-full bg-white/80 px-4 py-2">
            {data.metrics.confirmedBookings} confirmed
          </div>
          <div className="rounded-full bg-white/80 px-4 py-2">
            {data.metrics.stayRequests} stay requests
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Booking List"
        title="Current booking pipeline"
        description="Each card shows the person, service, schedule, value, and notes added before payment."
      >
        <div className="space-y-4">
          {data.bookings.length ? (
            data.bookings.map((booking) => (
              <article
                key={booking.id}
                className="rounded-[1.75rem] border border-[rgba(47,93,50,0.08)] bg-white/78 p-5 text-sm text-[var(--nuyu-muted)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
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

                <div className="mt-4 grid gap-3 lg:grid-cols-4">
                  <div className="rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                      Schedule
                    </p>
                    <p className="mt-2">{formatBookingSchedule(booking)}</p>
                  </div>

                  <div className="rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                      Value
                    </p>
                    <p className="mt-2">{formatCurrency(booking.totalAmountKobo)}</p>
                    <p className="mt-1">Quantity {booking.quantity}</p>
                  </div>

                  <div className="rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                      Created
                    </p>
                    <p className="mt-2">{formatDateTime(booking.createdAt)}</p>
                    <p className="mt-1">
                      {booking.paystackReference
                        ? `Reference ${booking.paystackReference}`
                        : "No payment reference yet"}
                    </p>
                  </div>

                  <div className="rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                      Notes
                    </p>
                    <p className="mt-2">
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
      </SectionCard>
    </div>
  );
}
