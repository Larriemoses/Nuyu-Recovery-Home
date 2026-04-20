import { useState } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../../utils/currency";
import { AdminAvailabilityManager } from "../components/admin-availability-manager";
import { AdminBlockedSlotManager } from "../components/admin-blocked-slot-manager";
import { AdminEmptyState } from "../components/admin-empty-state";
import { AdminManualSlotManager } from "../components/admin-manual-slot-manager";
import { AdminStatusPill } from "../components/admin-status-pill";
import { AdminMetricCard, AdminPanel } from "../components/admin-ui";
import { useAdminPortal } from "../context/admin-portal-provider";
import { formatDateTime } from "../utils/admin-format";

function getHoldUrgency(expiresAt: string) {
  const millisecondsUntilExpiry = new Date(expiresAt).getTime() - Date.now();

  if (millisecondsUntilExpiry <= 0) {
    return {
      label: "Expired",
      tone: "rose" as const,
      textClassName: "text-[var(--color-danger)]",
    };
  }

  if (millisecondsUntilExpiry <= 2 * 60 * 60 * 1000) {
    return {
      label: "Expiring soon",
      tone: "gold" as const,
      textClassName: "text-[var(--color-warning)]",
    };
  }

  return {
    label: "",
    tone: "ink" as const,
    textClassName: "text-[var(--nuyu-muted)]",
  };
}

export function AdminOperationsPage() {
  const [showScheduleHelp, setShowScheduleHelp] = useState(false);
  const { data, isLoading, errorMessage } = useAdminPortal();

  if (isLoading) {
    return (
      <AdminPanel eyebrow="Operations" title="Loading operations data">
        <div className="rounded-[1.5rem] bg-white/75 p-6 text-sm text-[var(--nuyu-muted)]">
          Loading operations...
        </div>
      </AdminPanel>
    );
  }

  if (errorMessage || !data) {
    return (
      <AdminPanel eyebrow="Operations" title="Operations data could not be loaded">
        <AdminEmptyState
          title="Operations data is unavailable"
          description={errorMessage ?? "No operations data was returned."}
        />
      </AdminPanel>
    );
  }

  const activeHolds = data.operations.activeHolds.slice(0, 4);
  const paymentSummary = data.operations.paymentSummary;
  const reportPeriods = ["Daily", "Weekly", "Monthly", "Yearly"];

  return (
    <div className="space-y-4">
      <AdminPanel
        eyebrow="Operations"
        title="Schedule control"
      >
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(14rem,1fr))]">
          <AdminMetricCard
            label="Weekly windows"
            value={data.operations.availabilityWindows.length}
            helper="Recurring rules"
            accent="primary"
          />
          <AdminMetricCard
            label="One-off times"
            value={data.operations.manualAvailabilitySlots.length}
            helper="Extra open slots"
            accent="gold"
          />
          <AdminMetricCard
            label="Blocked times"
            value={data.operations.blockedSlots.length}
            helper="Removed periods"
          />
          <AdminMetricCard
            label="Active holds"
            value={data.operations.activeHolds.length}
            helper="Pending reservations"
          />
        </div>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            className="w-fit text-sm font-medium text-[var(--color-primary)] transition hover:opacity-80"
            onClick={() => setShowScheduleHelp((current) => !current)}
          >
            How does scheduling work?
          </button>
          {showScheduleHelp ? (
            <div className="admin-quiet-card rounded-[1.35rem] p-4 text-sm leading-7 text-[var(--nuyu-muted)]">
              Weekly windows create the normal timetable. One-off times add a specific open slot
              clients can book. Blocked times remove a period immediately, and active holds show
              the reservations still waiting for the next step.
            </div>
          ) : null}
          <div className="admin-quiet-card rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-[var(--nuyu-ink)]">Reports</p>
              <Link
                to="/admin/reports"
                className="rounded-full bg-white/85 px-3 py-2 text-sm font-semibold text-[var(--nuyu-primary)] transition hover:bg-white"
              >
                Open reports
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {reportPeriods.map((period) => (
                <span
                  key={period}
                  className="rounded-full bg-white/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--nuyu-muted)]"
                >
                  {period}
                </span>
              ))}
            </div>
          </div>
        </div>
      </AdminPanel>

      <AdminManualSlotManager />

      <AdminAvailabilityManager />

      <div className="space-y-4">
        <AdminBlockedSlotManager />

        <AdminPanel
          eyebrow="Temporary Reservations"
          title="Live holds and payment status"
          description="This keeps the admin team aware of time-sensitive bookings and payment progress at a glance."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="admin-quiet-card rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]">
              <p className="font-semibold text-[var(--nuyu-ink)]">Verified value</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--nuyu-ink)]">
                {formatCurrency(paymentSummary.verifiedAmountKobo)}
              </p>
              <p className="mt-2 leading-6">
                {data.setup.paystackConfigured
                  ? "Paid records are being tracked."
                  : "Payment is still in the final integration stage."}
              </p>
            </div>

            <div className="admin-quiet-card rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]">
              <p className="font-semibold text-[var(--nuyu-ink)]">Payment records</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <AdminStatusPill label={`${paymentSummary.paidCount} paid`} tone="green" />
                <AdminStatusPill
                  label={`${paymentSummary.pendingCount} pending`}
                  tone="gold"
                />
                <AdminStatusPill
                  label={`${paymentSummary.failedCount} failed`}
                  tone="ink"
                />
              </div>
              <p className="mt-3 leading-6">
                {paymentSummary.totalRecords} payment records have been tracked so far.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {activeHolds.length ? (
              activeHolds.map((hold) => (
                <article
                  key={hold.id}
                  className="admin-list-row rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]"
                >
                  {(() => {
                    const urgency = getHoldUrgency(hold.expiresAt);

                    return (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[var(--nuyu-ink)]">{hold.serviceName}</p>
                            <p className="mt-1">{hold.clientEmail}</p>
                            <p className="mt-2">
                              {formatDateTime(hold.startsAt)} to {formatDateTime(hold.endsAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <AdminStatusPill label="Live hold" tone="gold" />
                            {urgency.label ? (
                              <AdminStatusPill label={urgency.label} tone={urgency.tone} />
                            ) : null}
                          </div>
                        </div>
                        <p className={["mt-3 text-xs uppercase tracking-[0.16em]", urgency.textClassName].join(" ")}>
                          Expires {formatDateTime(hold.expiresAt)}
                        </p>
                      </>
                    );
                  })()}
                </article>
              ))
            ) : (
              <AdminEmptyState
                title="No active holds right now"
                description="Once someone starts a timed booking flow, the hold will appear here until payment or expiry."
              />
            )}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
