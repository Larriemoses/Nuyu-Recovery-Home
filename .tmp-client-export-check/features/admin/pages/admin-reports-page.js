import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { startTransition, useDeferredValue, useEffect, useState, } from "react";
import { apiRequest } from "../../../lib/api/client";
import { Button } from "../../../components/ui";
import { formatCurrency } from "../../../utils/currency";
import { AdminEmptyState } from "../components/admin-empty-state";
import { AdminStatusPill } from "../components/admin-status-pill";
import { useAdminAuth } from "../context/admin-auth-provider";
import { AdminMetricCard, AdminPanel } from "../components/admin-ui";
import { downloadAdminReportCsv, downloadAdminReportWorkbook, } from "../utils/admin-report-export";
import { formatDateTime } from "../utils/admin-format";
const reportPeriods = [
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
function formatDateInput(date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}
export function AdminReportsPage() {
    const { accessToken } = useAdminAuth();
    const [selectedPeriod, setSelectedPeriod] = useState("monthly");
    const [selectedAnchorDate, setSelectedAnchorDate] = useState(() => formatDateInput(new Date()));
    const [report, setReport] = useState();
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState();
    const [exportState, setExportState] = useState({
        format: null,
    });
    const deferredPeriod = useDeferredValue(selectedPeriod);
    const deferredAnchorDate = useDeferredValue(selectedAnchorDate);
    async function handleExport(format) {
        if (!report) {
            return;
        }
        setExportState({
            format,
            message: format === "xlsx"
                ? "Preparing the styled Excel workbook..."
                : "Preparing the concise CSV export...",
        });
        try {
            if (format === "xlsx") {
                await downloadAdminReportWorkbook(report);
            }
            else {
                downloadAdminReportCsv(report);
            }
            setExportState({
                format: null,
                message: format === "xlsx"
                    ? "The Excel workbook is ready to download."
                    : "The CSV export is ready to download.",
            });
        }
        catch (error) {
            setExportState({
                format: null,
                message: error instanceof Error
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
                const data = await apiRequest(`/reports/summary?period=${deferredPeriod}&anchorDate=${deferredAnchorDate}`, {
                    accessToken,
                });
                if (cancelled) {
                    return;
                }
                startTransition(() => {
                    setReport(data);
                    setIsLoading(false);
                });
            }
            catch (error) {
                if (cancelled) {
                    return;
                }
                startTransition(() => {
                    setReport(undefined);
                    setIsLoading(false);
                    setErrorMessage(error instanceof Error
                        ? error.message
                        : "Unable to load the reports page.");
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
        ? report.bookingTypeSummary.reduce((best, item) => {
            if (!best || item.count > best.count) {
                return item;
            }
            return best;
        }, undefined)
        : undefined;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs(AdminPanel, { eyebrow: "Reports", title: "Reports dashboard", description: "Choose a time period, review the summary, and export either a concise CSV or a styled Excel workbook.", actions: _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { onClick: () => void handleExport("xlsx"), disabled: !report || isLoading, loading: exportState.format === "xlsx", size: "sm", disabledReason: "Wait for the report to finish loading before exporting it.", children: "Export Excel" }), _jsx(Button, { variant: "secondary", onClick: () => void handleExport("csv"), disabled: !report || isLoading, loading: exportState.format === "csv", size: "sm", disabledReason: "Wait for the report to finish loading before exporting it.", children: "Export CSV" })] }), children: [_jsxs("div", { className: "grid gap-3 lg:grid-cols-[1.1fr_0.9fr]", children: [_jsx("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4", children: reportPeriods.map((period) => (_jsxs("button", { type: "button", onClick: () => setSelectedPeriod(period.value), className: [
                                        "rounded-2xl border px-4 py-3 text-left transition",
                                        selectedPeriod === period.value
                                            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                                            : "border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-overlay)]",
                                    ].join(" "), children: [_jsx("p", { className: "text-sm font-semibold", children: period.label }), _jsx("p", { className: [
                                                "mt-1.5 text-[0.76rem] leading-5",
                                                selectedPeriod === period.value
                                                    ? "text-[var(--color-primary-foreground)] opacity-80"
                                                    : "text-[var(--color-text-muted)]",
                                            ].join(" "), children: period.description })] }, period.value))) }), _jsxs("div", { className: "admin-quiet-card rounded-2xl p-4 text-sm text-[var(--color-text-muted)]", children: [_jsxs("label", { className: "block rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-text-muted)]", children: [_jsx("span", { className: "block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-gold)]", children: "Date to use" }), _jsx("input", { type: "date", value: selectedAnchorDate, onChange: (event) => setSelectedAnchorDate(event.target.value), className: "admin-form-control mt-3 rounded-xl bg-transparent px-0 py-0 text-sm font-semibold shadow-none" })] }), _jsx("p", { className: "mt-3 text-[0.84rem] leading-6", children: "Choose a date, then switch between daily, weekly, monthly, and yearly views." })] })] }), _jsxs("div", { className: "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: [_jsx(AdminMetricCard, { label: "Current report", value: report?.range.label ?? "Loading report range", helper: report
                                    ? `Generated ${formatDateTime(report.generatedAt)}`
                                    : "Please wait while the report is prepared.", accent: "primary" }), _jsx(AdminMetricCard, { label: "Most active service", value: busiestService?.serviceName ?? "No service activity yet", helper: busiestService
                                    ? `${busiestService.bookingsCount} bookings in this report period`
                                    : "When bookings are created in this period, the busiest service will appear here.", accent: "gold" }), _jsx(AdminMetricCard, { label: "Strongest type", value: busiestBookingType?.bookingKind ?? "No booking type activity yet", helper: busiestBookingType
                                    ? `${busiestBookingType.count} records in this report period`
                                    : "Once activity comes in, this card will highlight the strongest category." })] }), exportState.message ? (_jsx("div", { className: "mt-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] px-4 py-3 text-sm text-[var(--color-text-muted)]", children: exportState.message })) : null] }), isLoading ? (_jsx(AdminPanel, { eyebrow: "Reports", title: "Loading report data", children: _jsx("div", { className: "rounded-[1.5rem] bg-white/75 p-6 text-sm text-[var(--nuyu-muted)]", children: "Loading report data..." }) })) : null, !isLoading && errorMessage ? (_jsx(AdminPanel, { eyebrow: "Reports", title: "Reports could not be loaded", children: _jsx(AdminEmptyState, { title: "Report data is unavailable", description: errorMessage }) })) : null, !isLoading && !errorMessage && report ? (_jsxs(_Fragment, { children: [_jsx(AdminPanel, { eyebrow: "Summary", title: "What happened in this time period", description: "These numbers are arranged for quick day-to-day admin review.", children: _jsxs("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-5", children: [_jsx(AdminMetricCard, { label: "Bookings", value: report.summary.bookingsCreated, helper: "Booking records created", accent: "primary" }), _jsx(AdminMetricCard, { label: "New clients", value: report.summary.newClients, helper: "New people added", accent: "gold" }), _jsx(AdminMetricCard, { label: "Quoted value", value: formatCurrency(report.summary.quotedValueKobo), helper: "Total value created" }), _jsx(AdminMetricCard, { label: "Paid value", value: formatCurrency(report.summary.paidValueKobo), helper: "Paid or confirmed value" }), _jsx(AdminMetricCard, { label: "Payments", value: report.paymentSummary.totalRecords, helper: "Payment entries in this range" })] }) }), _jsxs("div", { className: "grid gap-4 xl:grid-cols-[0.95fr_1.05fr]", children: [_jsxs(AdminPanel, { eyebrow: "Simple breakdown", title: "What the report is showing", description: "This section keeps the report easy to understand without technical wording.", children: [_jsx("div", { className: "flex flex-wrap gap-2", children: report.statusSummary.map((item) => (_jsxs("div", { className: "rounded-full bg-[var(--nuyu-cream)] px-4 py-2 text-sm text-[var(--nuyu-muted)]", children: [item.status, ": ", item.count] }, item.status))) }), _jsx("div", { className: "mt-5 grid gap-3 md:grid-cols-2", children: report.bookingTypeSummary.map((item) => (_jsxs("article", { className: "admin-list-row rounded-[1.25rem] p-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsx("p", { className: "font-semibold capitalize text-[var(--nuyu-ink)]", children: item.bookingKind }), _jsx(AdminStatusPill, { label: `${item.count} records`, tone: "green" })] }), _jsxs("p", { className: "mt-3 text-sm text-[var(--nuyu-muted)]", children: [formatCurrency(item.quotedValueKobo), " in quoted value"] })] }, item.bookingKind))) }), _jsxs("div", { className: "mt-5 grid gap-3 md:grid-cols-2", children: [_jsxs("div", { className: "admin-quiet-card rounded-[1.25rem] p-4", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--nuyu-ink)]", children: "Stay requests" }), _jsxs("p", { className: "mt-2 text-sm text-[var(--nuyu-muted)]", children: [report.summary.stayRequests, " stay requests were created in this period."] })] }), _jsxs("div", { className: "admin-quiet-card rounded-[1.25rem] p-4", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--nuyu-ink)]", children: "Active holds now" }), _jsxs("p", { className: "mt-2 text-sm text-[var(--nuyu-muted)]", children: [report.summary.activeHoldsNow, " live holds are currently waiting for the payment step."] })] })] })] }), _jsx(AdminPanel, { eyebrow: "Payments", title: "Payment view for this report", description: "This stays ready for Paystack later, while still giving the team a clear picture today.", children: _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsx(AdminMetricCard, { label: "Paid", value: report.paymentSummary.paidCount, helper: "Paid records in this range", accent: "primary" }), _jsx(AdminMetricCard, { label: "Pending", value: report.paymentSummary.pendingCount, helper: "Still waiting", accent: "gold" }), _jsx(AdminMetricCard, { label: "Failed", value: report.paymentSummary.failedCount, helper: "Failed payment records" }), _jsx(AdminMetricCard, { label: "Verified value", value: formatCurrency(report.paymentSummary.verifiedAmountKobo), helper: "Verified paid amount" })] }) })] }), _jsxs("div", { className: "grid gap-4 xl:grid-cols-[0.95fr_1.05fr]", children: [_jsx(AdminPanel, { eyebrow: "Services", title: "Top services in this report", description: "Showing the clearest service highlights first.", children: _jsx("div", { className: "space-y-3", children: topServices.length ? (topServices.map((item) => (_jsxs("article", { className: "admin-list-row rounded-[1.35rem] p-4", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-[var(--nuyu-ink)]", children: item.serviceName }), _jsx("p", { className: "mt-1 text-sm capitalize text-[var(--nuyu-muted)]", children: item.bookingKind })] }), _jsx(AdminStatusPill, { label: `${item.bookingsCount} bookings`, tone: "green" })] }), _jsxs("div", { className: "mt-4 grid gap-3 md:grid-cols-3", children: [_jsxs("div", { className: "admin-quiet-card rounded-[1.2rem] p-4 text-sm text-[var(--nuyu-muted)]", children: ["Quoted value", _jsx("p", { className: "mt-2 font-semibold text-[var(--nuyu-ink)]", children: formatCurrency(item.quotedValueKobo) })] }), _jsxs("div", { className: "admin-quiet-card rounded-[1.2rem] p-4 text-sm text-[var(--nuyu-muted)]", children: ["Paid value", _jsx("p", { className: "mt-2 font-semibold text-[var(--nuyu-ink)]", children: formatCurrency(item.paidValueKobo) })] }), _jsxs("div", { className: "admin-quiet-card rounded-[1.2rem] p-4 text-sm text-[var(--nuyu-muted)]", children: ["Stay requests", _jsx("p", { className: "mt-2 font-semibold text-[var(--nuyu-ink)]", children: item.stayRequests })] })] })] }, item.serviceId)))) : (_jsx(AdminEmptyState, { title: "No service activity in this report period", description: "Once bookings are created inside the selected time range, the service breakdown will appear here." })) }) }), _jsx(AdminPanel, { eyebrow: "Recent activity", title: "Latest activity in this report", description: "Showing the latest items first so this page stays easy to scan.", children: _jsx("div", { className: "space-y-3", children: latestActivity.length ? (latestActivity.map((item) => (_jsxs("article", { className: "admin-list-row rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-[var(--nuyu-ink)]", children: item.clientName }), _jsx("p", { className: "mt-1", children: item.serviceName }), _jsx("p", { className: "mt-1", children: item.clientEmail ?? "No email recorded" })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(AdminStatusPill, { label: item.bookingKind, tone: "green" }), _jsx(AdminStatusPill, { label: item.status, tone: "ink" }), _jsx(AdminStatusPill, { label: item.paymentStatus, tone: "gold" })] })] }), _jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--nuyu-muted)]", children: [_jsx("span", { children: formatCurrency(item.totalAmountKobo) }), _jsx("span", { children: formatDateTime(item.createdAt) })] })] }, item.id)))) : (_jsx(AdminEmptyState, { title: "No booking activity in this report period", description: "Try a different date or time period if you want to review older records." })) }) })] })] })) : null] }));
}
