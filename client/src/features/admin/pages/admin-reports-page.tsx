import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import { apiRequest } from "../../../lib/api/client";
import { Button } from "../../../components/ui";
import type {
  AdminReportPeriod,
  AdminReportResponse,
} from "../../../types/admin";
import { formatCurrency } from "../../../utils/currency";
import { AdminEmptyState } from "../components/admin-empty-state";
import { AdminStatusPill } from "../components/admin-status-pill";
import { useAdminAuth } from "../context/admin-auth-provider";
import { AdminMetricCard, AdminPanel } from "../components/admin-ui";
import {
  downloadAdminReportCsv,
  downloadAdminReportWorkbook,
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

export function AdminReportsPage() {
  const { accessToken } = useAdminAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<AdminReportPeriod>("monthly");
  const [selectedAnchorDate, setSelectedAnchorDate] = useState(() =>
    formatDateInput(new Date()),
  );
  const [report, setReport] = useState<AdminReportResponse>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [exportState, setExportState] = useState<{
    format: "csv" | "xlsx" | null;
    message?: string;
  }>({
    format: null,
  });
  const deferredPeriod = useDeferredValue(selectedPeriod);
  const deferredAnchorDate = useDeferredValue(selectedAnchorDate);

  async function handleExport(format: "csv" | "xlsx") {
    if (!report) {
      return;
    }

    setExportState({
      format,
      message:
        format === "xlsx"
          ? "Preparing the styled Excel workbook..."
          : "Preparing the concise CSV export...",
    });

    try {
      if (format === "xlsx") {
        await downloadAdminReportWorkbook(report);
      } else {
        downloadAdminReportCsv(report);
      }

      setExportState({
        format: null,
        message:
          format === "xlsx"
            ? "The Excel workbook is ready to download."
            : "The CSV export is ready to download.",
      });
    } catch (error) {
      setExportState({
        format: null,
        message:
          error instanceof Error
            ? error.message
            : "The report export could not be prepared.",
      });
    }
  }

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
  const topServices = report?.serviceSummary.slice(0, 4) ?? [];
  const latestActivity = report?.recentActivity.slice(0, 4) ?? [];
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
    <div className="space-y-4">
      <AdminPanel
        eyebrow="Reports"
        title="Reports dashboard"
        description="Choose a time period, review the summary, and export either a concise CSV or a styled Excel workbook."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void handleExport("xlsx")}
              disabled={!report || isLoading}
              loading={exportState.format === "xlsx"}
              size="sm"
              disabledReason="Wait for the report to finish loading before exporting it."
            >
              Export Excel
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handleExport("csv")}
              disabled={!report || isLoading}
              loading={exportState.format === "csv"}
              size="sm"
              disabledReason="Wait for the report to finish loading before exporting it."
            >
              Export CSV
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {reportPeriods.map((period) => (
              <button
                key={period.value}
                type="button"
                onClick={() => setSelectedPeriod(period.value)}
                className={[
                  "rounded-2xl border px-4 py-3 text-left transition",
                  selectedPeriod === period.value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-overlay)]",
                ].join(" ")}
              >
                <p className="text-sm font-semibold">
                  {period.label}
                </p>
                <p
                  className={[
                    "mt-1.5 text-[0.76rem] leading-5",
                    selectedPeriod === period.value
                      ? "text-[var(--color-primary-foreground)] opacity-80"
                      : "text-[var(--color-text-muted)]",
                  ].join(" ")}
                >
                  {period.description}
                </p>
              </button>
            ))}
          </div>

          <div className="admin-quiet-card rounded-2xl p-4 text-sm text-[var(--color-text-muted)]">
            <label className="block rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-gold)]">
                Date to use
              </span>
              <input
                type="date"
                value={selectedAnchorDate}
                onChange={(event) => setSelectedAnchorDate(event.target.value)}
                className="admin-form-control mt-3 rounded-xl bg-transparent px-0 py-0 text-sm font-semibold shadow-none"
              />
            </label>
            <p className="mt-3 text-[0.84rem] leading-6">
              Choose a date, then switch between daily, weekly, monthly, and yearly views.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AdminMetricCard
            label="Current report"
            value={report?.range.label ?? "Loading report range"}
            helper={
              report
                ? `Generated ${formatDateTime(report.generatedAt)}`
                : "Please wait while the report is prepared."
            }
            accent="primary"
          />
          <AdminMetricCard
            label="Most active service"
            value={busiestService?.serviceName ?? "No service activity yet"}
            helper={
              busiestService
                ? `${busiestService.bookingsCount} bookings in this report period`
                : "When bookings are created in this period, the busiest service will appear here."
            }
            accent="gold"
          />
          <AdminMetricCard
            label="Strongest type"
            value={busiestBookingType?.bookingKind ?? "No booking type activity yet"}
            helper={
              busiestBookingType
                ? `${busiestBookingType.count} records in this report period`
                : "Once activity comes in, this card will highlight the strongest category."
            }
          />
        </div>

        {exportState.message ? (
          <div className="mt-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
            {exportState.message}
          </div>
        ) : null}
      </AdminPanel>

      {isLoading ? (
        <AdminPanel eyebrow="Reports" title="Loading report data">
          <div className="rounded-[1.5rem] bg-white/75 p-6 text-sm text-[var(--nuyu-muted)]">
            Loading report data...
          </div>
        </AdminPanel>
      ) : null}

      {!isLoading && errorMessage ? (
        <AdminPanel eyebrow="Reports" title="Reports could not be loaded">
          <AdminEmptyState
            title="Report data is unavailable"
            description={errorMessage}
          />
        </AdminPanel>
      ) : null}

      {!isLoading && !errorMessage && report ? (
        <>
          <AdminPanel
            eyebrow="Summary"
            title="What happened in this time period"
            description="These numbers are arranged for quick day-to-day admin review."
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <AdminMetricCard
                label="Bookings"
                value={report.summary.bookingsCreated}
                helper="Booking records created"
                accent="primary"
              />
              <AdminMetricCard
                label="New clients"
                value={report.summary.newClients}
                helper="New people added"
                accent="gold"
              />
              <AdminMetricCard
                label="Quoted value"
                value={formatCurrency(report.summary.quotedValueKobo)}
                helper="Total value created"
              />
              <AdminMetricCard
                label="Paid value"
                value={formatCurrency(report.summary.paidValueKobo)}
                helper="Paid or confirmed value"
              />
              <AdminMetricCard
                label="Payments"
                value={report.paymentSummary.totalRecords}
                helper="Payment entries in this range"
              />
            </div>
          </AdminPanel>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <AdminPanel
              eyebrow="Simple breakdown"
              title="What the report is showing"
              description="This section keeps the report easy to understand without technical wording."
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

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {report.bookingTypeSummary.map((item) => (
                  <article
                    key={item.bookingKind}
                    className="admin-list-row rounded-[1.25rem] p-4"
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

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="admin-quiet-card rounded-[1.25rem] p-4">
                  <p className="text-sm font-semibold text-[var(--nuyu-ink)]">
                    Stay requests
                  </p>
                  <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
                    {report.summary.stayRequests} stay requests were created in this period.
                  </p>
                </div>

                <div className="admin-quiet-card rounded-[1.25rem] p-4">
                  <p className="text-sm font-semibold text-[var(--nuyu-ink)]">
                    Active holds now
                  </p>
                  <p className="mt-2 text-sm text-[var(--nuyu-muted)]">
                    {report.summary.activeHoldsNow} live holds are currently waiting for the
                    payment step.
                  </p>
                </div>
              </div>
            </AdminPanel>

            <AdminPanel
              eyebrow="Payments"
              title="Payment view for this report"
              description="This stays ready for Paystack later, while still giving the team a clear picture today."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminMetricCard
                  label="Paid"
                  value={report.paymentSummary.paidCount}
                  helper="Paid records in this range"
                  accent="primary"
                />
                <AdminMetricCard
                  label="Pending"
                  value={report.paymentSummary.pendingCount}
                  helper="Still waiting"
                  accent="gold"
                />
                <AdminMetricCard
                  label="Failed"
                  value={report.paymentSummary.failedCount}
                  helper="Failed payment records"
                />
                <AdminMetricCard
                  label="Verified value"
                  value={formatCurrency(report.paymentSummary.verifiedAmountKobo)}
                  helper="Verified paid amount"
                />
              </div>
            </AdminPanel>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <AdminPanel
              eyebrow="Services"
              title="Top services in this report"
              description="Showing the clearest service highlights first."
            >
              <div className="space-y-3">
                {topServices.length ? (
                  topServices.map((item) => (
                    <article
                      key={item.serviceId}
                      className="admin-list-row rounded-[1.35rem] p-4"
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
                        <div className="admin-quiet-card rounded-[1.2rem] p-4 text-sm text-[var(--nuyu-muted)]">
                          Quoted value
                          <p className="mt-2 font-semibold text-[var(--nuyu-ink)]">
                            {formatCurrency(item.quotedValueKobo)}
                          </p>
                        </div>
                        <div className="admin-quiet-card rounded-[1.2rem] p-4 text-sm text-[var(--nuyu-muted)]">
                          Paid value
                          <p className="mt-2 font-semibold text-[var(--nuyu-ink)]">
                            {formatCurrency(item.paidValueKobo)}
                          </p>
                        </div>
                        <div className="admin-quiet-card rounded-[1.2rem] p-4 text-sm text-[var(--nuyu-muted)]">
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
            </AdminPanel>

            <AdminPanel
              eyebrow="Recent activity"
              title="Latest activity in this report"
              description="Showing the latest items first so this page stays easy to scan."
            >
              <div className="space-y-3">
                {latestActivity.length ? (
                  latestActivity.map((item) => (
                    <article
                      key={item.id}
                      className="admin-list-row rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]"
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
            </AdminPanel>
          </div>
        </>
      ) : null}
    </div>
  );
}
