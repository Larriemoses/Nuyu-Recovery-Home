import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../lib/api/client";
import { AdminEmptyState } from "./admin-empty-state";
import { useAdminAuth } from "../context/admin-auth-provider";
import { useAdminPortal } from "../context/admin-portal-provider";
import { formatDateTime } from "../utils/admin-format";
import { AdminPanel } from "./admin-ui";
function formatDateInput(date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function getTomorrowDateInput() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateInput(tomorrow);
}
function toLagosIso(date, time) {
    return new Date(`${date}T${time}:00+01:00`).toISOString();
}
export function AdminManualSlotManager() {
    const { accessToken } = useAdminAuth();
    const { data, refresh } = useAdminPortal();
    const [serviceId, setServiceId] = useState("");
    const [date, setDate] = useState(getTomorrowDateInput);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");
    const [state, setState] = useState({ status: "idle" });
    const timedServices = useMemo(() => data?.services.filter((service) => service.bookingKind !== "stay") ?? [], [data]);
    useEffect(() => {
        if (!timedServices.length) {
            setServiceId("");
            return;
        }
        if (!serviceId || !timedServices.some((service) => service.id === serviceId)) {
            setServiceId(timedServices[0].id);
        }
    }, [serviceId, timedServices]);
    if (!data) {
        return null;
    }
    const selectedService = timedServices.find((service) => service.id === serviceId);
    const manualSlots = data.operations.manualAvailabilitySlots
        .filter((slot) => slot.serviceId === serviceId)
        .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
        .slice(0, 8);
    async function handleSubmit(event) {
        event.preventDefault();
        if (!accessToken || !serviceId) {
            setState({
                status: "error",
                message: "Admin access is required before one-off times can be posted.",
            });
            return;
        }
        setState({
            status: "submitting",
            message: "Posting the one-off available time...",
        });
        try {
            const result = await apiRequest("/admin/manual-slots", {
                method: "POST",
                accessToken,
                body: JSON.stringify({
                    serviceId,
                    startsAt: toLagosIso(date, startTime),
                    endsAt: toLagosIso(date, endTime),
                }),
            });
            setState({
                status: "success",
                message: result.message,
            });
            await refresh();
        }
        catch (error) {
            setState({
                status: "error",
                message: error instanceof Error
                    ? error.message
                    : "Unable to post the one-off available time.",
            });
        }
    }
    async function handleRemove(slotId) {
        if (!accessToken) {
            setState({
                status: "error",
                message: "Admin access is required before one-off times can be updated.",
            });
            return;
        }
        setState({
            status: "submitting",
            message: "Removing the one-off available time...",
        });
        try {
            const result = await apiRequest(`/admin/manual-slots/${slotId}`, {
                method: "DELETE",
                accessToken,
            });
            setState({
                status: "success",
                message: result.message,
            });
            await refresh();
        }
        catch (error) {
            setState({
                status: "error",
                message: error instanceof Error
                    ? error.message
                    : "Unable to remove the one-off available time.",
            });
        }
    }
    return (_jsxs("div", { className: "grid gap-5 xl:grid-cols-[1.02fr_0.98fr]", children: [_jsx(AdminPanel, { eyebrow: "One-Off Availability", title: "Post a specific open time", description: "Use this when you want clients to see one exact time, even if it is outside the normal weekly schedule.", children: _jsxs("form", { className: "grid gap-4", onSubmit: handleSubmit, children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]", children: ["Service", _jsx("select", { className: "rounded-2xl border border-[rgba(47,93,50,0.08)] bg-white px-4 py-3 text-sm text-[var(--nuyu-ink)]", value: serviceId, onChange: (event) => setServiceId(event.target.value), children: timedServices.map((service) => (_jsx("option", { value: service.id, children: service.name }, service.id))) })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]", children: ["Date", _jsx("input", { type: "date", className: "rounded-2xl border border-[rgba(47,93,50,0.08)] bg-white px-4 py-3 text-sm text-[var(--nuyu-ink)]", value: date, onChange: (event) => setDate(event.target.value), required: true })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]", children: ["Start time", _jsx("input", { type: "time", className: "rounded-2xl border border-[rgba(47,93,50,0.08)] bg-white px-4 py-3 text-sm text-[var(--nuyu-ink)]", value: startTime, onChange: (event) => setStartTime(event.target.value), required: true })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]", children: ["End time", _jsx("input", { type: "time", className: "rounded-2xl border border-[rgba(47,93,50,0.08)] bg-white px-4 py-3 text-sm text-[var(--nuyu-ink)]", value: endTime, onChange: (event) => setEndTime(event.target.value), required: true })] })] }), state.message ? (_jsx("div", { className: [
                                "rounded-[1.25rem] px-4 py-3 text-sm",
                                state.status === "error"
                                    ? "bg-[rgba(190,92,63,0.12)] text-[var(--nuyu-ink)]"
                                    : "bg-[rgba(47,93,50,0.08)] text-[var(--nuyu-ink)]",
                            ].join(" "), children: state.message })) : null, _jsx("div", { className: "rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4 text-sm text-[var(--nuyu-muted)]", children: "Clients will only see this exact time if it is still open. This makes it easy to add special appointments without changing the full weekly schedule." }), _jsx("div", { className: "flex flex-wrap gap-3", children: _jsx("button", { type: "submit", disabled: state.status === "submitting", className: "rounded-full bg-[var(--nuyu-primary)] px-5 py-3 text-sm font-semibold text-[var(--nuyu-cream)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60", children: state.status === "submitting"
                                    ? "Posting available time..."
                                    : "Post available time" }) })] }) }), _jsx(AdminPanel, { eyebrow: "Posted Times", title: selectedService ? `${selectedService.name} one-off times` : "One-off available times", description: "These are the exact extra times clients can currently choose for this service.", children: _jsx("div", { className: "space-y-3", children: manualSlots.length ? (manualSlots.map((slot) => (_jsx("article", { className: "admin-list-row rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]", children: _jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-[var(--nuyu-ink)]", children: formatDateTime(slot.startsAt) }), _jsxs("p", { className: "mt-1", children: ["Ends ", formatDateTime(slot.endsAt)] })] }), _jsx("button", { type: "button", className: "rounded-full border border-[rgba(190,92,63,0.22)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--nuyu-ink)] transition hover:bg-[rgba(190,92,63,0.08)]", onClick: () => handleRemove(slot.id), children: "Remove" })] }) }, slot.id)))) : (_jsx(AdminEmptyState, { title: "No one-off times have been posted yet", description: "Once the admin posts a specific time here, it will appear for clients in the booking flow." })) }) })] }));
}
