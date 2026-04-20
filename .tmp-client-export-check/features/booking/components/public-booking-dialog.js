import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Modal, Textarea } from "../../../components/ui";
import { useServiceCatalog } from "../../../hooks/use-service-catalog";
import { apiRequest } from "../../../lib/api/client";
import { formatCurrency } from "../../../utils/currency";
function getDefaultBookingDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
}
function getDefaultCheckoutDate() {
    const future = new Date();
    future.setDate(future.getDate() + 6);
    return future.toISOString().slice(0, 10);
}
function formatDateOnly(value) {
    if (!value) {
        return "Choose a date";
    }
    return new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
    }).format(new Date(value));
}
function formatDateTime(value) {
    if (!value) {
        return "Not scheduled";
    }
    return new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}
function getServiceDetail(service) {
    if (!service) {
        return "Choose a service";
    }
    if (service.bookingKind === "stay" && service.minStayDays && service.maxStayDays) {
        return `${service.minStayDays}-${service.maxStayDays} day stay`;
    }
    if (service.bookingKind === "package" && service.sessionsCount) {
        return `${service.sessionsCount} sessions`;
    }
    return `${service.durationMinutes ?? 60} mins`;
}
function getBookingKindLabel(kind) {
    if (kind === "stay") {
        return "Recovery stay";
    }
    if (kind === "package") {
        return "Treatment package";
    }
    return "Wellness session";
}
function getPrimaryAmount(service) {
    if (!service) {
        return 0;
    }
    if (service.bookingKind === "package" && service.packages?.length) {
        return service.packages[0].packagePriceKobo;
    }
    return service.basePriceKobo;
}
export function PublicBookingDialog({ open, onClose, initialServiceSlug, }) {
    const { services, source, isLoading, errorMessage } = useServiceCatalog();
    const [selectedServiceSlug, setSelectedServiceSlug] = useState("");
    const [selectedPackageId, setSelectedPackageId] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [notes, setNotes] = useState("");
    const [bookingDate, setBookingDate] = useState(getDefaultBookingDate);
    const [checkInDate, setCheckInDate] = useState(getDefaultBookingDate);
    const [checkOutDate, setCheckOutDate] = useState(getDefaultCheckoutDate);
    const [availabilityState, setAvailabilityState] = useState({
        isLoading: false,
    });
    const [requestState, setRequestState] = useState({ status: "idle" });
    useEffect(() => {
        if (!open || !services.length) {
            return;
        }
        const preferredSlug = initialServiceSlug && services.some((item) => item.slug === initialServiceSlug)
            ? initialServiceSlug
            : services[0].slug;
        setSelectedServiceSlug(preferredSlug);
    }, [initialServiceSlug, open, services]);
    const selectedService = useMemo(() => services.find((service) => service.slug === selectedServiceSlug) ?? services[0], [selectedServiceSlug, services]);
    useEffect(() => {
        if (!selectedService?.packages?.length) {
            setSelectedPackageId("");
            return;
        }
        if (!selectedPackageId ||
            !selectedService.packages.some((item) => item.id === selectedPackageId)) {
            setSelectedPackageId(selectedService.packages[0].id ?? "");
        }
    }, [selectedPackageId, selectedService]);
    useEffect(() => {
        async function loadAvailability() {
            if (!open || !selectedService?.id || selectedService.bookingKind === "stay") {
                setAvailabilityState({
                    isLoading: false,
                });
                return;
            }
            setAvailabilityState((current) => ({
                ...current,
                isLoading: true,
                errorMessage: undefined,
            }));
            try {
                const result = await apiRequest(`/bookings/availability?serviceId=${selectedService.id}&date=${bookingDate}`);
                setAvailabilityState({
                    isLoading: false,
                    data: result,
                    selectedSlotStartsAt: result.slots[0]?.startsAt,
                });
            }
            catch (error) {
                setAvailabilityState({
                    isLoading: false,
                    errorMessage: error instanceof Error
                        ? error.message
                        : "Unable to load slot availability.",
                });
            }
        }
        void loadAvailability();
    }, [bookingDate, open, selectedService?.bookingKind, selectedService?.id]);
    const selectedPackage = selectedService?.packages?.find((item) => item.id === selectedPackageId);
    const selectedSlot = availabilityState.data?.slots.find((slot) => slot.startsAt === availabilityState.selectedSlotStartsAt);
    const isStayBooking = selectedService?.bookingKind === "stay";
    const estimatedAmountKobo = selectedService?.bookingKind === "package" && selectedPackage
        ? selectedPackage.packagePriceKobo
        : selectedService?.basePriceKobo ?? 0;
    async function handleReserveSlot(event) {
        event.preventDefault();
        if (!selectedService?.id) {
            setRequestState({
                status: "error",
                message: "The live booking service is not ready yet. Please try again shortly.",
            });
            return;
        }
        setRequestState({ status: "submitting" });
        try {
            const payload = selectedService.bookingKind === "stay"
                ? {
                    mode: "stay",
                    serviceId: selectedService.id,
                    checkInDate,
                    checkOutDate,
                    quantity: 1,
                    client: {
                        fullName,
                        email,
                        phone,
                        notes,
                    },
                }
                : {
                    mode: "timed",
                    serviceId: selectedService.id,
                    startsAt: selectedSlot?.startsAt,
                    endsAt: selectedSlot?.endsAt,
                    packageId: selectedPackageId || undefined,
                    quantity: 1,
                    client: {
                        fullName,
                        email,
                        phone,
                        notes,
                    },
                };
            if (payload.mode === "timed" && (!payload.startsAt || !payload.endsAt)) {
                throw new Error("Please choose one available time before continuing.");
            }
            const result = await apiRequest("/bookings/reserve", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            setRequestState({
                status: "success",
                result,
                message: result.message,
            });
        }
        catch (error) {
            setRequestState({
                status: "error",
                message: error instanceof Error
                    ? error.message
                    : "Something went wrong while saving the booking request.",
            });
        }
    }
    return (_jsx(Modal, { open: open, onClose: onClose, title: requestState.status === "success" ? "Booking saved" : "Book a service", description: requestState.status === "success"
            ? "Your request is saved. Payment opens here once Paystack is connected."
            : "Choose a service, enter your details, and save your request.", panelClassName: "max-w-2xl", footer: requestState.status === "success" ? (_jsx(Button, { onClick: onClose, fullWidth: true, size: "lg", children: "Close" })) : (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs leading-5 text-[var(--color-text-muted)]", children: "Payment opens here after this step once Paystack is connected." }), _jsx(Button, { type: "submit", form: "public-booking-form", loading: requestState.status === "submitting", disabled: !selectedService?.id, disabledReason: "Live booking needs the synced service list before a request can be saved.", fullWidth: true, size: "lg", children: isStayBooking ? "Save stay request" : "Save booking request" })] })), children: requestState.status === "success" && requestState.result ? (_jsxs("div", { className: "space-y-4", children: [_jsx(Card, { header: _jsx("div", { children: _jsx("p", { className: "text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]", children: "Saved booking" }) }), children: _jsxs("div", { className: "space-y-3 text-sm text-[var(--color-text-muted)]", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("span", { children: "Service" }), _jsx("span", { className: "font-medium text-[var(--color-text)]", children: selectedService?.name ?? requestState.result.serviceName ?? "Selected service" })] }), _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("span", { children: "Reference" }), _jsx("span", { className: "font-medium text-[var(--color-text)]", children: requestState.result.bookingId })] }), _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("span", { children: "Amount" }), _jsx("span", { className: "font-medium text-[var(--color-text)]", children: formatCurrency(requestState.result.amountKobo ?? estimatedAmountKobo) })] }), requestState.result.expiresAt ? (_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("span", { children: "Hold expires" }), _jsx("span", { className: "font-medium text-[var(--color-text)]", children: formatDateTime(requestState.result.expiresAt) })] })) : null] }) }), _jsx(Card, { variant: "flat", children: _jsx("p", { className: "text-sm leading-6 text-[var(--color-text-muted)]", children: requestState.result.nextStep ??
                            "The request is saved. Payment will be connected in the next step." }) })] })) : (_jsxs("form", { id: "public-booking-form", className: "grid gap-4", onSubmit: handleReserveSlot, children: [errorMessage ? (_jsx(Card, { variant: "flat", children: _jsx("p", { className: "text-sm leading-6 text-[var(--color-text-muted)]", children: errorMessage }) })) : null, requestState.status === "error" && requestState.message ? (_jsx(Card, { variant: "flat", children: _jsx("p", { className: "text-sm leading-6 text-[var(--color-danger)]", children: requestState.message }) })) : null, _jsx(Card, { header: _jsx("div", { children: _jsx("p", { className: "text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]", children: "Service" }) }), children: isLoading ? (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "h-11 rounded-xl bg-[var(--color-surface-overlay)]" }), _jsxs("div", { className: "grid gap-2 sm:grid-cols-3", children: [_jsx("div", { className: "h-16 rounded-xl bg-[var(--color-surface-overlay)]" }), _jsx("div", { className: "h-16 rounded-xl bg-[var(--color-surface-overlay)]" }), _jsx("div", { className: "h-16 rounded-xl bg-[var(--color-surface-overlay)]" })] })] })) : (_jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex flex-col gap-2 text-sm text-[var(--color-text-muted)]", children: [_jsx("span", { className: "font-medium text-[var(--color-text)]", children: "Choose service" }), _jsx("select", { className: "public-form-control rounded-xl px-3 py-2.5 text-sm", value: selectedServiceSlug, onChange: (event) => setSelectedServiceSlug(event.target.value), children: services.map((service) => (_jsx("option", { value: service.slug, children: service.name }, service.slug))) })] }), _jsxs("div", { className: "grid gap-2 sm:grid-cols-3", children: [_jsxs(Card, { variant: "flat", className: "rounded-xl", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]", children: "Type" }), _jsx("p", { className: "mt-2 text-sm font-medium text-[var(--color-text)]", children: getBookingKindLabel(selectedService?.bookingKind) })] }), _jsxs(Card, { variant: "flat", className: "rounded-xl", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]", children: "Detail" }), _jsx("p", { className: "mt-2 text-sm font-medium text-[var(--color-text)]", children: getServiceDetail(selectedService) })] }), _jsxs(Card, { variant: "flat", className: "rounded-xl", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]", children: "Estimate" }), _jsx("p", { className: "mt-2 text-sm font-medium text-[var(--color-text)]", children: formatCurrency(selectedService?.bookingKind === "package" && selectedPackage
                                                    ? selectedPackage.packagePriceKobo
                                                    : getPrimaryAmount(selectedService)) })] })] }), selectedService ? (_jsx(Card, { variant: "flat", className: "rounded-xl", children: _jsx("p", { className: "text-sm leading-6 text-[var(--color-text-muted)]", children: selectedService.summary }) })) : null, selectedService?.packages?.length ? (_jsxs("label", { className: "flex flex-col gap-2 text-sm text-[var(--color-text-muted)]", children: [_jsx("span", { className: "font-medium text-[var(--color-text)]", children: "Package option" }), _jsx("select", { className: "public-form-control rounded-xl px-3 py-2.5 text-sm", value: selectedPackageId, onChange: (event) => setSelectedPackageId(event.target.value), children: selectedService.packages.map((item) => (_jsxs("option", { value: item.id, children: [item.label, " - ", formatCurrency(item.packagePriceKobo)] }, item.id ?? item.label))) })] })) : null] })) }), _jsx(Card, { header: _jsx("div", { children: _jsx("p", { className: "text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]", children: "Your details" }) }), children: _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsx(Input, { label: "Full name", value: fullName, onChange: (event) => setFullName(event.target.value), placeholder: "Client full name", required: true }), _jsx(Input, { label: "Email", type: "email", value: email, onChange: (event) => setEmail(event.target.value), placeholder: "client@example.com", required: true }), _jsx(Input, { label: "Phone", value: phone, onChange: (event) => setPhone(event.target.value), placeholder: "+234...", required: true })] }) }), _jsx(Card, { header: _jsx("div", { children: _jsx("p", { className: "text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]", children: "Schedule" }) }), children: _jsx("div", { className: "space-y-4", children: isStayBooking ? (_jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsx(Input, { label: "Check-in date", type: "date", value: checkInDate, onChange: (event) => setCheckInDate(event.target.value), required: true }), _jsx(Input, { label: "Check-out date", type: "date", value: checkOutDate, onChange: (event) => setCheckOutDate(event.target.value), required: true })] })) : (_jsxs(_Fragment, { children: [_jsx(Input, { label: "Booking date", type: "date", value: bookingDate, onChange: (event) => setBookingDate(event.target.value), required: true }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("p", { className: "text-sm font-medium text-[var(--color-text)]", children: "Available time" }), availabilityState.isLoading ? (_jsx("span", { className: "text-xs text-[var(--color-text-muted)]", children: "Loading time..." })) : null] }), availabilityState.errorMessage ? (_jsx("p", { className: "text-sm leading-6 text-[var(--color-danger)]", children: availabilityState.errorMessage })) : null, _jsx("div", { className: "flex flex-wrap gap-2", children: availabilityState.data?.slots.length ? (availabilityState.data.slots.map((slot) => (_jsx("button", { type: "button", className: [
                                                    "rounded-full px-3 py-2 text-sm font-medium transition",
                                                    availabilityState.selectedSlotStartsAt === slot.startsAt
                                                        ? "bg-[var(--color-primary)] text-white"
                                                        : "border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]",
                                                ].join(" "), onClick: () => setAvailabilityState((current) => ({
                                                    ...current,
                                                    selectedSlotStartsAt: slot.startsAt,
                                                })), children: slot.label }, slot.startsAt)))) : (_jsx("p", { className: "text-sm leading-6 text-[var(--color-text-muted)]", children: "No open slots yet for this day." })) })] })] })) }) }), _jsx(Textarea, { label: "Notes", value: notes, onChange: (event) => setNotes(event.target.value), placeholder: "Anything the team should know before confirmation" }), _jsx(Card, { variant: "flat", children: _jsxs("div", { className: "space-y-2 text-sm text-[var(--color-text-muted)]", children: [_jsx("p", { className: "font-medium text-[var(--color-text)]", children: "Current booking summary" }), _jsxs("p", { children: [selectedService?.name ?? "Choose a service", " \u2022", " ", formatCurrency(estimatedAmountKobo), " \u2022", " ", isStayBooking
                                        ? `${formatDateOnly(checkInDate)} to ${formatDateOnly(checkOutDate)}`
                                        : selectedSlot
                                            ? `${selectedSlot.label} on ${formatDateOnly(bookingDate)}`
                                            : formatDateOnly(bookingDate)] }), _jsx("p", { children: source === "supabase"
                                    ? "Live services are connected."
                                    : "Starter services are showing while live sync finishes." })] }) })] })) }));
}
