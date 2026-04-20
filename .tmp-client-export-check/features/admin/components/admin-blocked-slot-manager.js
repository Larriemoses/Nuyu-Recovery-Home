import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../lib/api/client";
import { Button } from "../../../components/ui";
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
export function AdminBlockedSlotManager() {
    const { accessToken } = useAdminAuth();
    const { data, refresh } = useAdminPortal();
    const [serviceId, setServiceId] = useState("");
    const [date, setDate] = useState(getTomorrowDateInput);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");
    const [reason, setReason] = useState("");
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
    const blockedSlots = data.operations.blockedSlots
        .filter((slot) => slot.serviceId === serviceId)
        .slice(0, 8);
    async function handleSubmit(event) {
        event.preventDefault();
        if (!accessToken || !serviceId) {
            setState({
                status: "error",
                message: "Admin access is required before blocked times can be updated.",
            });
            return;
        }
        setState({
            status: "submitting",
            message: "Saving the blocked time...",
        });
        try {
            const result = await apiRequest("/admin/blocked-slots", {
                method: "POST",
                accessToken,
                body: JSON.stringify({
                    serviceId,
                    startsAt: toLagosIso(date, startTime),
                    endsAt: toLagosIso(date, endTime),
                    reason: reason || undefined,
                }),
            });
            setState({
                status: "success",
                message: result.message,
            });
            setReason("");
            await refresh();
        }
        catch (error) {
            setState({
                status: "error",
                message: error instanceof Error ? error.message : "Unable to save the blocked time.",
            });
        }
    }
    async function handleRemove(blockedSlotId) {
        if (!accessToken) {
            setState({
                status: "error",
                message: "Admin access is required before blocked times can be updated.",
            });
            return;
        }
        setState({
            status: "submitting",
            message: "Removing the blocked time...",
        });
        try {
            const result = await apiRequest(`/admin/blocked-slots/${blockedSlotId}`, {
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
                message: error instanceof Error ? error.message : "Unable to remove the blocked time.",
            });
        }
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(AdminPanel, { eyebrow: "Blocked Times", title: "Block a specific time", description: "Use this when a service should be unavailable for a meeting, break, maintenance, or any one-off change.", children: _jsxs("form", { className: "grid gap-4", onSubmit: handleSubmit, children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]", children: ["Service", _jsx("select", { className: "admin-form-control rounded-2xl px-4 py-3 text-sm", value: serviceId, onChange: (event) => setServiceId(event.target.value), children: timedServices.map((service) => (_jsx("option", { value: service.id, children: service.name }, service.id))) })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]", children: ["Date", _jsx("input", { type: "date", className: "admin-form-control rounded-2xl px-4 py-3 text-sm", value: date, onChange: (event) => setDate(event.target.value), required: true })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]", children: ["Start time", _jsx("input", { type: "time", className: "admin-form-control rounded-2xl px-4 py-3 text-sm", value: startTime, onChange: (event) => setStartTime(event.target.value), required: true })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]", children: ["End time", _jsx("input", { type: "time", className: "admin-form-control rounded-2xl px-4 py-3 text-sm", value: endTime, onChange: (event) => setEndTime(event.target.value), required: true })] })] }), _jsxs("label", { className: "flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]", children: ["Reason", _jsx("textarea", { className: "admin-form-control min-h-24 rounded-2xl px-4 py-3 text-sm", value: reason, onChange: (event) => setReason(event.target.value), placeholder: "For example: Staff meeting, maintenance, or private use" })] }), state.message ? (_jsx("div", { className: [
                                "rounded-[1.25rem] px-4 py-3 text-sm",
                                state.status === "error"
                                    ? "bg-[color-mix(in_oklab,var(--color-danger)_12%,white)] text-[var(--color-text)]"
                                    : "bg-[color-mix(in_oklab,var(--color-primary)_10%,white)] text-[var(--color-text)]",
                            ].join(" "), children: state.message })) : null, _jsx("div", { className: "admin-quiet-card rounded-[1.25rem] p-4 text-sm leading-6 text-[var(--color-text-muted)]", children: "Blocking a time here removes that option from the client booking page." }), _jsx("div", { className: "flex flex-wrap gap-3", children: _jsx(Button, { type: "submit", disabled: state.status === "submitting", children: state.status === "submitting"
                                    ? "Saving blocked time..."
                                    : "Save blocked time" }) })] }) }), _jsx(AdminPanel, { eyebrow: "Current Blocked Times", title: selectedService ? `${selectedService.name} blocked times` : "Current blocked times", description: "These are the latest times this service is not allowed to take bookings.", children: _jsx("div", { className: "space-y-3", children: blockedSlots.length ? (blockedSlots.map((slot) => (_jsxs("article", { className: "admin-list-row rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-[var(--nuyu-ink)]", children: formatDateTime(slot.startsAt) }), _jsxs("p", { className: "mt-1", children: ["Until ", formatDateTime(slot.endsAt)] })] }), _jsx(Button, { type: "button", variant: "danger", size: "sm", onClick: () => handleRemove(slot.id), children: "Remove" })] }), _jsx("p", { className: "mt-3", children: slot.reason || "No reason was recorded." })] }, slot.id)))) : (_jsx(AdminEmptyState, { title: "No blocked times are saved for this service", description: "When a blocked time is added here, it will appear in this list and the booking page will stop offering that time." })) }) })] }));
}
