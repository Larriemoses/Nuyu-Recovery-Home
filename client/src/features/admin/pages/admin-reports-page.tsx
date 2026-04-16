import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import { SectionCard } from "../../../components/ui/section-card";
import { apiRequest } from "../../../lib/api/client";
import type {
  AdminReportPeriod,
  AdminReportResponse,
} from "../../../types/admin";
import { formatCurrency } from "../../../utils/currency";
import { AdminEmptyState } from "../components/admin-empty-state";
import { AdminStatusPill } from "../components/admin-status-pill";
import { useAdminAuth } from "../context/admin-auth-provider";
import {
  buildAdminReportCsv,
  buildAdminReportFilename,
} from "../utils/admin-report-export";
import { formatDateTime } from "../utils/admin-format";

const reportPeriods: Array<{
  value: AdminReportPeriod;
  label: string;
  description: string;
}> = [
  {
    value: "daily",
    label: "Daily",
    description: "See one day at a time.",
  },
  {
    value: "weekly",
    label: "Weekly",
    description: "Review the current week.",
  },
  {
    value: "monthly",
    label: "Monthly",
    description: "Track the full month.",
  },
  {
    value: "yearly",
    label: "Yearly",
    description: "Look at the full year.",
  },
];

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function downloadReport(report: AdminReportResponse) {
  const csv = buildAdminReportCsv(report);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = buildAdminReportFilename(report);
  anchor.click();

  window.URL.revokeObjectURL(url);
}

export function AdminReportsPage() {
  const { accessToken } = useAdminAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<AdminReportPeriod>("monthly");
  const [selectedAnchorDate, setSelectedAnchorDate] = useState(() =>
    formatDateInput(new Date()),
  );
  const [report, setReport] = useState<AdminReportResponse>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const deferredPeriod = useDeferredValue(selectedPeriod);
  const deferredAnchorDate = useDeferredValue(selectedAnchorDate);

  useEffect(() => {
    if (!accessToken) {
      startTransition(() => {
        setReport(undefined);
        setIsLoading(false);
        setErrorMessage("Admin access token is missing.");
      });
      return;
    }

    let cancelled = false;

    startTransition(() => {
      setIsLoading(true);
      setErrorMessage(undefined);
    });

    async function loadReport() {
      try {
        const data = await apiRequest<AdminReportResponse>(
          `/reports/summary?period=${deferredPeriod}&anchorDate=${deferredAnchorDate}`,
          {
            accessToken,
          },
        );

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setReport(data);
          setIsLoading(false);
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setReport(undefined);
          setIsLoading(false);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load the reports page.",
          );
        });
      }
    }

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [accessToken, deferredAnchorDate, deferredPeriod]);

  const busiestService = report?.serviceSummary[0];
  const busiestBookingType = report
    ? report.bookingTypeSummary.reduce<
        AdminReportResponse["bookingTypeSummary"][number] | undefined
      >((best, item) => {
        if (!best || item.count > best.count) {
          return item;
        }

        return best;
      }, undefined)
    : undefined;

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Reports"
        title="Simple reports the admin team can view and export"
        description="Choose a report period, pick a reference date, and export a CSV whenever you need to share activity or keep a record."
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {reportPeriods.map((period) => (
              <button
                key={period.value}
                type="button"
                onClick={() => setSelectedPeriod(period.value)}
                className={[
                  "rounded-[1.5rem] border px-4 py-4 text-left transition",
                  selectedPeriod === period.value
                    ? "border-[var(--nuyu-primary)] bg-[rgba(47,93,50,0.1)]"
                    : "border-[rgba(47,93,50,0.08)] bg-white/75 hover:bg-white",
                ].join(" ")}
              >
                <p className="text-sm font-semibold text-[var(--nuyu-ink)]">
                  {period.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--nuyu-muted)]">
                  {period.description}
                </p>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="rounded-[1.5rem] border border-[rgba(47,93,50,0.08)] bg-white/75 px-4 py-3 text-sm text-[var(--nuyu-muted)]">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                Reference date
              </span>
              <input
                type="date"
                value={selectedAnchorDate}
                onChange={(event) => setSelectedAnchorDate(event.target.value)}
                className="mt-3 w-full bg-transparent text-sm font-semibold text-[var(--nuyu-ink)] outline-none"
              />
            </label>

            <button
              type="button"
              onClick={() => report && downloadReport(report)}
              disabled={!report || isLoading}
              className="rounded-full border border-[var(--nuyu-primary)] bg-[var(--nuyu-primary)] px-5 py-3 text-sm font-semibold text-[var(--nuyu-cream)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-[1.5rem] bg-white/78 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
              Current report
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--nuyu-ink)]">
              {report?.range.label ?? "Loading report range"}
            </p>
            <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
              {report
                ? `Generated ${formatDateTime(report.generatedAt)}`
                : "Please wait while the report is prepared."}
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/78 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
              Most active service
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--nuyu-ink)]">
              {busiestService?.serviceName ?? "No service activity yet"}
            </p>
            <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
              {busiestService
                ? `${busiestService.bookingsCount} bookings in this report period`
                : "When bookings are created in this period, the busiest service will appear here."}
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/78 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
              Strongest booking type
            </p>
            <p className="mt-3 text-lg font-semibold capitalize text-[var(--nuyu-ink)]">
              {busiestBookingType?.bookingKind ?? "No booking type activity yet"}
            </p>
            <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
              {busiestBookingType
                ? `${busiestBookingType.count} records in this report period`
                : "Once activity comes in, this card will highlight the strongest category."}
            </p>
          </div>
        </div>
      </SectionCard>

      {isLoading ? (
        <SectionCard eyebrow="Reports" title="Loading report data">
          <div className="rounded-[1.5rem] bg-white/75 p-6 text-sm text-[var(--nuyu-muted)]">
            Loading report data...
          </div>
        </SectionCard>
      ) : null}

      {!isLoading && errorMessage ? (
        <SectionCard eyebrow="Reports" title="Reports could not be loaded">
          <AdminEmptyState
            title="Report data is unavailable"
            description={errorMessage}
          />
        </SectionCard>
      ) : null}

      {!isLoading && !errorMessage && report ? (
        <>
          <SectionCard
            eyebrow="Summary"
            title="What happened in this report period"
            description="These figures are designed to be easy to read for day-to-day admin review."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-[1.5rem] bg-white/78 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                  Bookings
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--nuyu-ink)]">
                  {report.summary.bookingsCreated}
                </p>
                <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
                  Booking records created
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white/78 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                  New clients
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--nuyu-ink)]">
                  {report.summary.newClients}
                </p>
                <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
                  New people added to the system
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white/78 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                  Quoted value
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--nuyu-ink)]">
                  {formatCurrency(report.summary.quotedValueKobo)}
                </p>
                <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
                  Total value of bookings created
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white/78 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                  Paid value
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--nuyu-ink)]">
                  {formatCurrency(report.summary.paidValueKobo)}
                </p>
                <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
                  Paid or confirmed booking value
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white/78 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                  Payment records
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--nuyu-ink)]">
                  {report.paymentSummary.totalRecords}
                </p>
                <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
                  Payment entries in this period
                </p>
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard
              eyebrow="Status"
              title="Booking and payment status at a glance"
              description="Use this section to quickly spot what still needs attention."
            >
              <div className="flex flex-wrap gap-2">
                {report.statusSummary.map((item) => (
                  <div
                    key={item.status}
                    className="rounded-full bg-[var(--nuyu-cream)] px-4 py-2 text-sm text-[var(--nuyu-muted)]"
                  >
                    {item.status}: {item.count}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {report.bookingTypeSummary.map((item) => (
                  <article
                    key={item.bookingKind}
                    className="rounded-[1.5rem] border border-[rgba(47,93,50,0.08)] bg-white/78 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold capitalize text-[var(--nuyu-ink)]">
                        {item.bookingKind}
                      </p>
                      <AdminStatusPill label={`${item.count} records`} tone="green" />
                    </div>
                    <p className="mt-3 text-sm text-[var(--nuyu-muted)]">
                      {formatCurrency(item.quotedValueKobo)} in quoted value
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] bg-[var(--nuyu-cream)] p-4">
                  <p className="text-sm font-semibold text-[var(--nuyu-ink)]">
                    Stay requests
                  </p>
                  <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
                    {report.summary.stayRequests} stay requests were created in this period.
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-[var(--nuyu-cream)] p-4">
                  <p className="text-sm font-semibold text-[var(--nuyu-ink)]">
                    Active holds now
                  </p>
                  <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
                    {report.summary.activeHoldsNow} live holds are currently waiting for the
                    payment step.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Payments"
              title="Payment movement in this report period"
              description="This stays ready for Paystack later, while still giving the team a clear picture today."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] bg-white/78 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                    Paid
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--nuyu-ink)]">
                    {report.paymentSummary.paidCount}
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-white/78 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                    Pending
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--nuyu-ink)]">
                    {report.paymentSummary.pendingCount}
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-white/78 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                    Failed
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--nuyu-ink)]">
                    {report.paymentSummary.failedCount}
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-white/78 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                    Verified value
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--nuyu-ink)]">
                    {formatCurrency(report.paymentSummary.verifiedAmountKobo)}
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard
              eyebrow="Services"
              title="Service performance in this report"
              description="This makes it easier to see where the strongest demand is coming from."
            >
              <div className="space-y-3">
                {report.serviceSummary.length ? (
                  report.serviceSummary.map((item) => (
                    <article
                      key={item.serviceId}
                      className="rounded-[1.5rem] border border-[rgba(47,93,50,0.08)] bg-white/78 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--nuyu-ink)]">
                            {item.serviceName}
                          </p>
                          <p className="mt-1 text-sm capitalize text-[var(--nuyu-muted)]">
                            {item.bookingKind}
                          </p>
                        </div>
                        <AdminStatusPill label={`${item.bookingsCount} bookings`} tone="green" />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4 text-sm text-[var(--nuyu-muted)]">
                          Quoted value
                          <p className="mt-2 font-semibold text-[var(--nuyu-ink)]">
                            {formatCurrency(item.quotedValueKobo)}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4 text-sm text-[var(--nuyu-muted)]">
                          Paid value
                          <p className="mt-2 font-semibold text-[var(--nuyu-ink)]">
                            {formatCurrency(item.paidValueKobo)}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4 text-sm text-[var(--nuyu-muted)]">
                          Stay requests
                          <p className="mt-2 font-semibold text-[var(--nuyu-ink)]">
                            {item.stayRequests}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <AdminEmptyState
                    title="No service activity in this report period"
                    description="Once bookings are created inside the selected time range, the service breakdown will appear here."
                  />
                )}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Recent activity"
              title="Latest booking activity in this report"
              description="This gives the admin team a simple activity log without needing database access."
            >
              <div className="space-y-3">
                {report.recentActivity.length ? (
                  report.recentActivity.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[1.5rem] border border-[rgba(47,93,50,0.08)] bg-white/78 p-4 text-sm text-[var(--nuyu-muted)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--nuyu-ink)]">
                            {item.clientName}
                          </p>
                          <p className="mt-1">{item.serviceName}</p>
                          <p className="mt-1">{item.clientEmail ?? "No email recorded"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <AdminStatusPill label={item.bookingKind} tone="green" />
                          <AdminStatusPill label={item.status} tone="ink" />
                          <AdminStatusPill label={item.paymentStatus} tone="gold" />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--nuyu-muted)]">
                        <span>{formatCurrency(item.totalAmountKobo)}</span>
                        <span>{formatDateTime(item.createdAt)}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <AdminEmptyState
                    title="No booking activity in this report period"
                    description="Try a different date or time period if you want to review older records."
                  />
                )}
              </div>
            </SectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
