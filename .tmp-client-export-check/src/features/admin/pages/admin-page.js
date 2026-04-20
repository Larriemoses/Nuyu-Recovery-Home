import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowRight, BriefcaseBusiness, CalendarClock, CircleDollarSign, Clock3, HeartHandshake, Sparkles, UsersRound, } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, Badge, Card, EmptyState, Feedback, Skeleton, } from "../../../components/ui";
import { formatCurrency } from "../../../utils/currency";
import { useAdminPortal } from "../context/admin-portal-provider";
import { formatBookingSchedule } from "../utils/admin-format";
const quickActions = [
    {
        to: "/admin/bookings",
        title: "Review bookings",
        description: "Open the booking queue and move the next client forward",
    },
    {
        to: "/admin/operations",
        title: "Update availability",
        description: "Adjust open times, special slots, and blocked periods",
    },
    {
        to: "/admin/reports",
        title: "Export reports",
        description: "Download the latest daily, weekly, monthly, or yearly view",
    },
    {
        to: "/admin/services",
        title: "Check services",
        description: "Update pricing, packages, and what clients can currently book",
    },
];
function DashboardSkeleton() {
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-28 w-full" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: [_jsx(Skeleton, { className: "h-36 w-full" }), _jsx(Skeleton, { className: "h-36 w-full" }), _jsx(Skeleton, { className: "h-36 w-full" }), _jsx(Skeleton, { className: "h-36 w-full" })] }), _jsxs("div", { className: "grid gap-4 xl:grid-cols-[1.1fr_0.9fr]", children: [_jsx(Skeleton, { className: "h-72 w-full" }), _jsx(Skeleton, { className: "h-72 w-full" })] })] }));
}
function MetricTile({ icon, label, value, hint }) {
    return (_jsx(Card, { variant: "default", className: "h-full", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-surface-overlay)] text-[var(--color-primary)]", children: icon }), _jsx(Badge, { variant: "info", children: "live" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-[var(--color-text-muted)]", children: label }), _jsx("p", { className: "mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text)]", children: value })] }), _jsx("p", { className: "text-sm leading-6 text-[var(--color-text-muted)]", children: hint })] }) }));
}
function getMomentumWidthClass(bookingsCount, strongestCount) {
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
        return _jsx(DashboardSkeleton, {});
    }
    if (errorMessage || !data) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx(Feedback, { variant: "error", title: "We couldn\u2019t load the dashboard", message: errorMessage ?? "Something interrupted the admin data load, so the overview is empty right now." }), _jsx(EmptyState, { icon: _jsx(Sparkles, { className: "h-5 w-5" }), heading: "Your dashboard isn\u2019t ready yet", subtext: "Refresh the page once the server is back up, and we\u2019ll bring your latest bookings, services, and reports right back." })] }));
    }
    const waitingForReview = data.metrics.pendingBookings + data.metrics.heldBookings;
    const latestBookings = data.recentBookings.slice(0, 4);
    const topServices = data.servicePerformance.slice(0, 4);
    const highestPressureMessage = waitingForReview > 0
        ? `${waitingForReview} booking${waitingForReview === 1 ? "" : "s"} need a closer look today`
        : "Your booking queue looks calm right now";
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Feedback, { variant: waitingForReview > 0 ? "warning" : "success", title: waitingForReview > 0 ? "A few items need your attention" : "You’re in a good place", message: data.setup.paystackConfigured
                    ? `${highestPressureMessage}, and payment tracking is already connected.`
                    : `${highestPressureMessage}. Payments can be added later, so you can keep focusing on bookings, schedules, and reports for now.` }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: [_jsx(MetricTile, { icon: _jsx(Clock3, { className: "h-5 w-5" }), label: "Needs attention", value: waitingForReview, hint: "Pending and held bookings that may need a follow-up" }), _jsx(MetricTile, { icon: _jsx(CircleDollarSign, { className: "h-5 w-5" }), label: "Tracked revenue", value: formatCurrency(data.metrics.totalRevenueKobo), hint: "Paid or confirmed value already visible in the system" }), _jsx(MetricTile, { icon: _jsx(UsersRound, { className: "h-5 w-5" }), label: "Clients", value: data.metrics.totalClients, hint: "People currently stored in your admin workspace" }), _jsx(MetricTile, { icon: _jsx(BriefcaseBusiness, { className: "h-5 w-5" }), label: "Active services", value: data.metrics.activeServicesCount, hint: "Services clients can currently browse and book" })] }), _jsxs("div", { className: "grid gap-4 xl:grid-cols-[1.18fr_0.82fr]", children: [_jsx(Card, { variant: "elevated", header: _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-lg font-semibold text-[var(--color-text)]", children: "What you can do next" }), _jsx("p", { className: "text-sm text-[var(--color-text-muted)]", children: "Keep the next best actions close, so nothing important feels buried" })] }), children: _jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: quickActions.map((action) => (_jsx(Link, { to: action.to, className: "group h-full", children: _jsxs("div", { className: "h-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] px-4 py-4 transition duration-200 group-hover:border-[var(--color-border)] group-hover:bg-[var(--color-surface-raised)] group-active:scale-[0.98]", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("p", { className: "font-semibold text-[var(--color-text)]", children: action.title }), _jsx(ArrowRight, { className: "h-4 w-4 text-[var(--color-text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-text)]" })] }), _jsx("p", { className: "mt-2 text-sm leading-6 text-[var(--color-text-muted)]", children: action.description })] }) }, action.to))) }) }), _jsx(Card, { variant: "default", header: _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-lg font-semibold text-[var(--color-text)]", children: "Operations pulse" }), _jsx("p", { className: "text-sm text-[var(--color-text-muted)]", children: "The quickest health check for the admin side of the business" })] }), children: _jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "rounded-2xl bg-[var(--color-surface-overlay)] px-4 py-4", children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-[var(--color-text)]", children: "Booking flow" }), _jsx("p", { className: "mt-1 text-sm text-[var(--color-text-muted)]", children: "Clients can already browse services and hold time slots" })] }), _jsx(Badge, { variant: "success", withDot: true, children: "ready" })] }) }), _jsx("div", { className: "rounded-2xl bg-[var(--color-surface-overlay)] px-4 py-4", children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-[var(--color-text)]", children: "Admin controls" }), _jsx("p", { className: "mt-1 text-sm text-[var(--color-text-muted)]", children: "You can manage services, clients, schedules, and reports now" })] }), _jsx(Badge, { variant: "success", withDot: true, children: "ready" })] }) }), _jsx("div", { className: "rounded-2xl bg-[var(--color-surface-overlay)] px-4 py-4", children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-[var(--color-text)]", children: "Paystack" }), _jsx("p", { className: "mt-1 text-sm text-[var(--color-text-muted)]", children: "Add payments after the booking and admin flow feel right" })] }), _jsx(Badge, { variant: data.setup.paystackConfigured ? "success" : "warning", withDot: true, children: data.setup.paystackConfigured ? "connected" : "later" })] }) }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-4 py-4", children: [_jsx("p", { className: "text-sm text-[var(--color-text-muted)]", children: "Active holds" }), _jsx("p", { className: "mt-2 text-2xl font-semibold text-[var(--color-text)]", children: data.metrics.activeHolds })] }), _jsxs("div", { className: "rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-4 py-4", children: [_jsx("p", { className: "text-sm text-[var(--color-text-muted)]", children: "Stay requests" }), _jsx("p", { className: "mt-2 text-2xl font-semibold text-[var(--color-text)]", children: data.metrics.stayRequests })] })] })] }) })] }), _jsxs("div", { className: "grid gap-4 xl:grid-cols-[1.12fr_0.88fr]", children: [_jsx(Card, { variant: "default", header: _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-lg font-semibold text-[var(--color-text)]", children: "Recent activity" }), _jsx("p", { className: "text-sm text-[var(--color-text-muted)]", children: "The newest bookings stay close, so you can scan them without extra clicks" })] }), children: _jsx("div", { className: "space-y-3", children: latestBookings.length ? (latestBookings.map((booking) => (_jsx("div", { className: "rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] px-4 py-4", children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [_jsx(Avatar, { name: booking.clientName, size: "md" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "font-semibold text-[var(--color-text)]", children: booking.clientName }), _jsx("p", { className: "mt-1 text-sm text-[var(--color-text-muted)]", children: booking.serviceName }), _jsx("p", { className: "mt-2 text-sm leading-6 text-[var(--color-text-muted)]", children: formatBookingSchedule(booking) })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(Badge, { variant: "info", children: booking.bookingKind }), _jsx(Badge, { variant: booking.status === "confirmed"
                                                        ? "success"
                                                        : booking.status === "pending" || booking.status === "held"
                                                            ? "warning"
                                                            : booking.status === "cancelled"
                                                                ? "danger"
                                                                : "default", children: booking.status }), _jsx(Badge, { variant: "default", children: formatCurrency(booking.totalAmountKobo) })] })] }) }, booking.id)))) : (_jsx(EmptyState, { icon: _jsx(CalendarClock, { className: "h-5 w-5" }), heading: "No bookings yet", subtext: "Once clients start booking, their latest activity will appear here and give you a simple place to start" })) }) }), _jsx(Card, { variant: "default", header: _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-lg font-semibold text-[var(--color-text)]", children: "Service momentum" }), _jsx("p", { className: "text-sm text-[var(--color-text-muted)]", children: "See which services are pulling the most demand right now" })] }), children: _jsx("div", { className: "space-y-4", children: topServices.length ? (topServices.map((service, index) => {
                                const strongestCount = Math.max(topServices[0]?.bookingsCount ?? 1, 1);
                                return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate font-semibold text-[var(--color-text)]", children: service.serviceName }), _jsxs("p", { className: "text-sm text-[var(--color-text-muted)]", children: [service.pendingCount, " pending, ", service.heldCount, " held"] })] }), _jsxs(Badge, { variant: index === 0 ? "success" : "info", children: [service.bookingsCount, " booked"] })] }), _jsx("div", { className: "h-2.5 rounded-full bg-[var(--color-surface-overlay)]", children: _jsx("div", { className: [
                                                    "h-2.5 rounded-full bg-[var(--color-primary)] transition-all duration-300",
                                                    getMomentumWidthClass(service.bookingsCount, strongestCount),
                                                ].join(" ") }) }), _jsxs("div", { className: "flex items-center justify-between gap-3 text-sm text-[var(--color-text-muted)]", children: [_jsx("span", { className: "capitalize", children: service.bookingKind }), _jsx("span", { children: formatCurrency(service.estimatedValueKobo) })] })] }, service.serviceId));
                            })) : (_jsx(EmptyState, { icon: _jsx(HeartHandshake, { className: "h-5 w-5" }), heading: "Service momentum will show up here", subtext: "As new bookings come in, this panel will help you spot which services are gaining traction first" })) }) })] })] }));
}
