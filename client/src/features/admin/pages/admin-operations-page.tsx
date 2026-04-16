import { SectionCard } from "../../../components/ui/section-card";
import { useAdminPortal } from "../context/admin-portal-provider";
import { AdminEmptyState } from "../components/admin-empty-state";
import { AdminStatusPill } from "../components/admin-status-pill";
import {
  formatDateTime,
  formatTimeOnly,
  weekdayLabels,
} from "../utils/admin-format";
import { formatCurrency } from "../../../utils/currency";

export function AdminOperationsPage() {
  const { data, isLoading, errorMessage } = useAdminPortal();

  if (isLoading) {
    return (
      <SectionCard eyebrow="Operations" title="Loading operations data">
        <div className="rounded-[1.5rem] bg-white/75 p-6 text-sm text-[var(--nuyu-muted)]">
          Loading operations...
        </div>
      </SectionCard>
    );
  }

  if (errorMessage || !data) {
    return (
      <SectionCard eyebrow="Operations" title="Operations data could not be loaded">
        <AdminEmptyState
          title="Operations data is unavailable"
          description={errorMessage ?? "No operations data was returned."}
        />
      </SectionCard>
    );
  }

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Operations"
        title="Operations made easier to understand"
        description="See availability, blocked time, holds, and payment readiness in one clear admin view."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] bg-white/80 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--nuyu-gold)]">
              Availability Windows
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--nuyu-ink)]">
              {data.operations.availabilityWindows.length}
            </p>
            <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
              Active schedule blocks across all services
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/80 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--nuyu-gold)]">
              Blocked Slots
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--nuyu-ink)]">
              {data.operations.blockedSlots.length}
            </p>
            <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
              Manual schedule blocks currently stored
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/80 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--nuyu-gold)]">
              Payment Records
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--nuyu-ink)]">
              {data.operations.paymentSummary.totalRecords}
            </p>
            <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
              {data.setup.paystackConfigured ? "Live payment records are being tracked." : "Paystack is still the final integration stage."}
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/80 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--nuyu-gold)]">
              Verified Value
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--nuyu-ink)]">
              {formatCurrency(data.operations.paymentSummary.verifiedAmountKobo)}
            </p>
            <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
              Amount attached to verified paid payment records
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          eyebrow="Active Holds"
          title="Reservations that are still time-sensitive"
          description="These are the bookings the team may want to watch most closely before payment is added."
        >
          <div className="space-y-3">
            {data.operations.activeHolds.length ? (
              data.operations.activeHolds.map((hold) => (
                <article
                  key={hold.id}
                  className="rounded-[1.5rem] border border-[rgba(47,93,50,0.08)] bg-white/78 p-4 text-sm text-[var(--nuyu-muted)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--nuyu-ink)]">{hold.serviceName}</p>
                      <p className="mt-1">{hold.clientEmail}</p>
                    </div>
                    <AdminStatusPill label="Live hold" tone="gold" />
                  </div>

                  <p className="mt-3">{formatDateTime(hold.startsAt)}</p>
                  <p className="mt-1">Expires {formatDateTime(hold.expiresAt)}</p>
                </article>
              ))
            ) : (
              <AdminEmptyState
                title="No active holds right now"
                description="When a slot is temporarily reserved, it will be visible here."
              />
            )}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Blocked Slots"
          title="Manual time blocks already applied"
          description="These are the dates or times the team has intentionally made unavailable."
        >
          <div className="space-y-3">
            {data.operations.blockedSlots.length ? (
              data.operations.blockedSlots.map((slot) => (
                <article
                  key={slot.id}
                  className="rounded-[1.5rem] border border-[rgba(47,93,50,0.08)] bg-white/78 p-4 text-sm text-[var(--nuyu-muted)]"
                >
                  <p className="font-semibold text-[var(--nuyu-ink)]">{slot.serviceName}</p>
                  <p className="mt-2">{formatDateTime(slot.startsAt)}</p>
                  <p className="mt-1">Until {formatDateTime(slot.endsAt)}</p>
                  <p className="mt-2">{slot.reason || "No reason was recorded."}</p>
                </article>
              ))
            ) : (
              <AdminEmptyState
                title="No blocked slots yet"
                description="When admin schedule blocks are added, they will appear here."
              />
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        eyebrow="Availability"
        title="Configured availability windows by service"
        description="This gives the team a readable schedule map without needing to inspect the database."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {data.operations.availabilityWindows.length ? (
            data.operations.availabilityWindows.map((window) => (
              <article
                key={window.id}
                className="rounded-[1.5rem] bg-white/78 p-4 text-sm text-[var(--nuyu-muted)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-semibold text-[var(--nuyu-ink)]">{window.serviceName}</p>
                  <AdminStatusPill label={weekdayLabels[window.weekday]} tone="green" />
                </div>
                <p className="mt-3">
                  {formatTimeOnly(window.startTime)} - {formatTimeOnly(window.endTime)}
                </p>
                <p className="mt-1">
                  {window.slotLengthMinutes} minute slots - capacity {window.capacity}
                </p>
              </article>
            ))
          ) : (
            <AdminEmptyState
              title="No availability windows are configured"
              description="This section will show schedule coverage once services have live availability added."
            />
          )}
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Payments"
        title="Payment readiness and status tracking"
        description="Paystack is still the final stage, but this section keeps the team ready for how payments will be monitored once it is connected."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] bg-white/78 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
              Pending
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--nuyu-ink)]">
              {data.operations.paymentSummary.pendingCount}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-white/78 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
              Paid
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--nuyu-ink)]">
              {data.operations.paymentSummary.paidCount}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-white/78 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
              Failed
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--nuyu-ink)]">
              {data.operations.paymentSummary.failedCount}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-white/78 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
              Refunded
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--nuyu-ink)]">
              {data.operations.paymentSummary.refundedCount}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {data.operations.bookingStatusSummary.map((item) => (
            <div
              key={item.status}
              className="rounded-full bg-[var(--nuyu-cream)] px-4 py-2 text-sm text-[var(--nuyu-muted)]"
            >
              {item.status}: {item.count}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
