import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { SectionCard } from "../../../components/ui/section-card";
import { CarouselControlButton } from "../../../components/ui/carousel-control-button";
import { useServiceCatalog } from "../../../hooks/use-service-catalog";
import { apiRequest } from "../../../lib/api/client";
import { formatCurrency } from "../../../utils/currency";
import { getServiceMedia } from "../../services/data/service-media";
const flowSteps = [
    "Choose a service, package, or recovery-home stay.",
    "Pick a real available slot or stay range.",
    "Create a draft booking and temporary hold.",
    "Review the saved booking details.",
    "Hand off to payment when Paystack is added.",
];
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
function formatDateTime(value) {
    if (!value) {
        return "Not scheduled";
    }
    return new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}
function formatDateOnly(value) {
    if (!value) {
        return "Not set";
    }
    return new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
    }).format(new Date(value));
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
function getServiceDetailLabel(service) {
    if (!service) {
        return {
            label: "Service length",
            value: "Choose a service",
        };
    }
    if (service.bookingKind === "stay" && service.minStayDays && service.maxStayDays) {
        return {
            label: "Stay length",
            value: `${service.minStayDays}-${service.maxStayDays} days`,
        };
    }
    if (service.bookingKind === "package" && service.sessionsCount) {
        return {
            label: "Plan size",
            value: `${service.sessionsCount} sessions`,
        };
    }
    return {
        label: "Session length",
        value: `${service.durationMinutes ?? 60} minutes`,
    };
}
function getServicePricing(service) {
    if (!service) {
        return {
            primaryLabel: "Price from",
            primaryAmount: 0,
        };
    }
    if (service.bookingKind === "package" && service.packages?.length) {
        return {
            primaryLabel: "Single session",
            primaryAmount: service.basePriceKobo,
            secondaryLabel: "Package from",
            secondaryAmount: service.packages[0].packagePriceKobo,
        };
    }
    return {
        primaryLabel: service.bookingKind === "stay" ? "Stay from" : "Price from",
        primaryAmount: service.basePriceKobo,
    };
}
export function BookingPage() {
    const { services, source, isLoading, errorMessage } = useServiceCatalog();
    const [selectedServiceSlug, setSelectedServiceSlug] = useState("");
    const [previewServiceSlug, setPreviewServiceSlug] = useState(null);
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
    const serviceCarouselRef = useRef(null);
    useEffect(() => {
        if (!services.length) {
            return;
        }
        if (!selectedServiceSlug || !services.some((item) => item.slug === selectedServiceSlug)) {
            setSelectedServiceSlug(services[0].slug);
        }
    }, [selectedServiceSlug, services]);
    const selectedService = useMemo(() => services.find((service) => service.slug === selectedServiceSlug) ?? services[0], [selectedServiceSlug, services]);
    const previewService = useMemo(() => services.find((service) => service.slug === previewServiceSlug) ??
        selectedService, [previewServiceSlug, selectedService, services]);
    useEffect(() => {
        if (!selectedService?.packages?.length) {
            setSelectedPackageId("");
            return;
        }
        if (!selectedPackageId || !selectedService.packages.some((item) => item.id === selectedPackageId)) {
            setSelectedPackageId(selectedService.packages[0].id ?? "");
        }
    }, [selectedPackageId, selectedService]);
    useEffect(() => {
        async function loadAvailability() {
            if (!selectedService?.id || selectedService.bookingKind === "stay") {
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
    }, [bookingDate, selectedService?.bookingKind, selectedService?.id]);
    const selectedPackage = selectedService?.packages?.find((item) => item.id === selectedPackageId);
    const selectedSlot = availabilityState.data?.slots.find((slot) => slot.startsAt === availabilityState.selectedSlotStartsAt);
    const estimatedAmountKobo = selectedService?.bookingKind === "package" && selectedPackage
        ? selectedPackage.packagePriceKobo
        : selectedService?.basePriceKobo ?? 0;
    const isStayBooking = selectedService?.bookingKind === "stay";
    const previewServiceMedia = getServiceMedia(previewService?.slug);
    const previewServiceDetail = getServiceDetailLabel(previewService);
    const previewServicePricing = getServicePricing(previewService);
    function scrollServices(direction) {
        if (!serviceCarouselRef.current) {
            return;
        }
        const distance = Math.min(360, serviceCarouselRef.current.clientWidth * 0.9);
        serviceCarouselRef.current.scrollBy({
            left: direction === "right" ? distance : -distance,
            behavior: "smooth",
        });
    }
    async function handleReserveSlot(event) {
        event.preventDefault();
        if (!selectedService?.id) {
            setRequestState({
                status: "error",
                message: "A live service must be available before a booking can be created.",
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
                throw new Error("Please choose one of the available time slots first.");
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
                    : "Something went wrong while creating the booking.",
            });
        }
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("section", { className: "public-panel rounded-[1.7rem] p-4 sm:p-5", children: _jsxs("div", { className: "grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-end", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--nuyu-gold)]", children: "Booking Studio" }), _jsx("h1", { className: "mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--nuyu-ink)] sm:text-4xl", children: "Choose a service, fill the form, and save the booking request." }), _jsx("p", { className: "mt-3 max-w-3xl text-base leading-7 text-[var(--nuyu-muted)] sm:text-lg", children: "This page is focused on the booking itself, so the service list stays simple and the booking form stays the main thing on screen." })] }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-3 lg:grid-cols-1", children: [_jsxs("div", { className: "public-subtle-panel rounded-[1.25rem] p-3.5", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-muted)]", children: "Selected service" }), _jsx("p", { className: "mt-2 text-lg font-semibold text-[var(--nuyu-ink)]", children: selectedService?.name ?? "Choose a service" })] }), _jsxs("div", { className: "public-subtle-panel rounded-[1.25rem] p-3.5", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-muted)]", children: "Current estimate" }), _jsx("p", { className: "mt-2 text-2xl font-semibold text-[var(--nuyu-ink)]", children: formatCurrency(estimatedAmountKobo) })] }), _jsxs("div", { className: "public-subtle-panel rounded-[1.25rem] p-3.5", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-muted)]", children: "Service list" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-[var(--nuyu-muted)]", children: source === "supabase"
                                                ? "Using the live service list."
                                                : "Using the starter service list for now." })] })] })] }) }), _jsxs(SectionCard, { eyebrow: "Choose Your Service", title: "Choose a service first", description: "Browse the service list below, then open the one you want and continue straight to the booking form.", children: [isLoading ? (_jsx("div", { className: "public-panel rounded-[1.5rem] p-5 text-base leading-7 text-[var(--nuyu-muted)]", children: "Loading services..." })) : null, errorMessage ? (_jsx("div", { className: "mb-4 rounded-[1.6rem] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-4 text-base leading-7 text-[var(--nuyu-muted)]", children: errorMessage })) : null, _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute left-1 top-1/2 z-10 -translate-y-1/2", children: _jsx(CarouselControlButton, { direction: "left", onClick: () => scrollServices("left") }) }), _jsx("div", { className: "absolute right-1 top-1/2 z-10 -translate-y-1/2", children: _jsx(CarouselControlButton, { direction: "right", onClick: () => scrollServices("right") }) }), _jsx("div", { ref: serviceCarouselRef, className: "nuyu-carousel px-1", children: services.map((service, index) => {
                                    const serviceMedia = getServiceMedia(service.slug);
                                    const serviceDetail = getServiceDetailLabel(service);
                                    const servicePricing = getServicePricing(service);
                                    return (_jsxs("article", { className: [
                                            "nuyu-carousel-card group nuyu-hover-lift nuyu-reveal flex h-full flex-col overflow-hidden rounded-[1.45rem] border p-3.5 transition",
                                            service.slug === selectedServiceSlug
                                                ? "border-[var(--color-primary)] bg-[color-mix(in_oklab,var(--color-primary)_8%,white)] shadow-[0_20px_46px_rgba(35,72,38,0.08)]"
                                                : "border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]",
                                        ].join(" "), style: { animationDelay: `${index * 80}ms` }, children: [_jsx("div", { className: "relative overflow-hidden rounded-[1.15rem]", children: _jsx("img", { src: serviceMedia.imageUrl, alt: serviceMedia.alt, loading: "lazy", decoding: "async", className: "nuyu-image aspect-[4/3] w-full object-cover" }) }), _jsxs("div", { className: "mt-3 flex flex-1 flex-col", children: [_jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--nuyu-gold)]", children: getBookingKindLabel(service.bookingKind) }), _jsx("h3", { className: "mt-1.5 text-base font-semibold leading-6 tracking-[-0.02em] text-[var(--nuyu-ink)] sm:text-lg", children: service.name }), _jsx("p", { className: "mt-2 text-sm leading-6 text-[var(--nuyu-muted)]", children: service.summary }), _jsxs("div", { className: "mt-3 grid gap-2", children: [_jsxs("div", { className: "public-subtle-panel rounded-[1rem] px-3 py-2 text-sm text-[var(--nuyu-muted)]", children: [_jsxs("span", { className: "font-semibold text-[var(--nuyu-ink)]", children: [servicePricing.secondaryAmount
                                                                                ? servicePricing.secondaryLabel
                                                                                : servicePricing.primaryLabel, ":"] }), " ", formatCurrency(servicePricing.secondaryAmount ?? servicePricing.primaryAmount)] }), _jsxs("div", { className: "public-subtle-panel rounded-[1rem] px-3 py-2 text-sm text-[var(--nuyu-muted)]", children: [_jsxs("span", { className: "font-semibold text-[var(--nuyu-ink)]", children: [serviceDetail.label, ":"] }), " ", serviceDetail.value] })] }), _jsx("button", { type: "button", className: [
                                                            "mt-3 w-full rounded-full border px-4 py-2.5 text-sm font-semibold transition sm:text-base",
                                                            service.slug === selectedServiceSlug
                                                                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                                                                : "border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white",
                                                        ].join(" "), onClick: () => setPreviewServiceSlug(service.slug), children: service.slug === selectedServiceSlug
                                                            ? "View selected service"
                                                            : "View details" })] })] }, service.slug));
                                }) })] })] }), _jsxs("div", { className: "grid gap-4 xl:grid-cols-[1.32fr_0.68fr] xl:items-start", children: [_jsx(SectionCard, { eyebrow: "Your Details", title: isStayBooking
                            ? "Tell us about your stay request"
                            : "Tell us about your booking", description: "Fill in the details below and save your request in a few simple steps.", children: _jsxs("form", { id: "booking-form", className: "grid gap-4 sm:gap-5", onSubmit: handleReserveSlot, children: [_jsxs("div", { className: "public-subtle-panel rounded-[1.45rem] p-5 sm:p-6", children: [_jsx("p", { className: "text-base font-semibold text-[var(--nuyu-ink)]", children: "Contact details" }), _jsxs("div", { className: "mt-4 grid gap-4 lg:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-2 text-base text-[var(--nuyu-muted)]", children: ["Full name", _jsx("input", { className: "public-form-control rounded-2xl px-4 py-3.5 text-base", value: fullName, onChange: (event) => setFullName(event.target.value), placeholder: "Client full name", required: true })] }), _jsxs("label", { className: "flex flex-col gap-2 text-base text-[var(--nuyu-muted)]", children: ["Email", _jsx("input", { className: "public-form-control rounded-2xl px-4 py-3.5 text-base", type: "email", value: email, onChange: (event) => setEmail(event.target.value), placeholder: "client@example.com", required: true })] }), _jsxs("label", { className: "flex flex-col gap-2 text-base text-[var(--nuyu-muted)]", children: ["Phone", _jsx("input", { className: "public-form-control rounded-2xl px-4 py-3.5 text-base", value: phone, onChange: (event) => setPhone(event.target.value), placeholder: "+234...", required: true })] }), selectedService?.packages?.length ? (_jsxs("label", { className: "flex flex-col gap-2 text-base text-[var(--nuyu-muted)]", children: ["Package option", _jsx("select", { className: "public-form-control rounded-2xl px-4 py-3.5 text-base", value: selectedPackageId, onChange: (event) => setSelectedPackageId(event.target.value), children: selectedService.packages.map((item) => (_jsxs("option", { value: item.id, children: [item.label, " - ", formatCurrency(item.packagePriceKobo)] }, item.id ?? item.label))) })] })) : null] })] }), _jsxs("div", { className: "public-subtle-panel rounded-[1.45rem] p-5 sm:p-6", children: [_jsx("p", { className: "text-base font-semibold text-[var(--nuyu-ink)]", children: "Schedule" }), _jsx("div", { className: "mt-4 grid gap-4 lg:grid-cols-2", children: isStayBooking ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex flex-col gap-2 text-base text-[var(--nuyu-muted)]", children: ["Check-in date", _jsx("input", { className: "public-form-control rounded-2xl px-4 py-3.5 text-base", type: "date", value: checkInDate, onChange: (event) => setCheckInDate(event.target.value), required: true })] }), _jsxs("label", { className: "flex flex-col gap-2 text-base text-[var(--nuyu-muted)]", children: ["Check-out date", _jsx("input", { className: "public-form-control rounded-2xl px-4 py-3.5 text-base", type: "date", value: checkOutDate, onChange: (event) => setCheckOutDate(event.target.value), required: true })] })] })) : (_jsxs("label", { className: "flex flex-col gap-2 text-base text-[var(--nuyu-muted)]", children: ["Booking date", _jsx("input", { className: "public-form-control rounded-2xl px-4 py-3.5 text-base", type: "date", value: bookingDate, onChange: (event) => setBookingDate(event.target.value), required: true })] })) })] }), _jsxs("label", { className: "flex flex-col gap-2 text-base text-[var(--nuyu-muted)]", children: ["Notes or preferences", _jsx("textarea", { className: "public-form-control min-h-28 rounded-2xl px-4 py-3.5 text-base", value: notes, onChange: (event) => setNotes(event.target.value), placeholder: "Anything you want the team to know before payment or confirmation..." })] }), !isStayBooking ? (_jsxs("div", { className: "public-panel rounded-[1.45rem] p-5 sm:p-6", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-base font-semibold text-[var(--nuyu-ink)]", children: "Available time slots" }), _jsx("p", { className: "mt-1 text-base leading-7 text-[var(--nuyu-muted)]", children: availabilityState.data?.date
                                                                ? `Showing available slots for ${formatDateOnly(availabilityState.data.date)}`
                                                                : "Choose a date to load available times." })] }), availabilityState.isLoading ? (_jsx("p", { className: "text-base text-[var(--nuyu-muted)]", children: "Loading slots..." })) : null] }), availabilityState.errorMessage ? (_jsx("p", { className: "mt-4 text-base leading-7 text-[var(--nuyu-muted)]", children: availabilityState.errorMessage })) : null, _jsx("div", { className: "mt-4 flex flex-wrap gap-3", children: availabilityState.data?.slots.length ? (availabilityState.data.slots.map((slot) => (_jsx("button", { type: "button", className: [
                                                    "rounded-full px-5 py-3 text-base font-medium transition",
                                                    availabilityState.selectedSlotStartsAt === slot.startsAt
                                                        ? "bg-[var(--color-primary)] text-white"
                                                        : "border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] text-[var(--nuyu-muted)] hover:bg-[var(--color-surface-overlay)]",
                                                ].join(" "), onClick: () => setAvailabilityState((current) => ({
                                                    ...current,
                                                    selectedSlotStartsAt: slot.startsAt,
                                                })), children: slot.label }, slot.startsAt)))) : (_jsx("p", { className: "text-base leading-7 text-[var(--nuyu-muted)]", children: "No open slots were found for that day yet." })) })] })) : null, _jsx("div", { className: "flex items-end", children: _jsx("button", { type: "submit", className: "rounded-full bg-[var(--color-primary)] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60", disabled: requestState.status === "submitting", children: requestState.status === "submitting"
                                            ? "Saving booking..."
                                            : isStayBooking
                                                ? "Save stay request"
                                                : "Save booking request" }) })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsx(SectionCard, { eyebrow: "Your Summary", title: "Quick booking summary", description: "This side panel stays simple so the form remains the main focus.", children: _jsxs("div", { className: "space-y-4 text-base leading-7 text-[var(--nuyu-muted)]", children: [_jsxs("div", { className: "public-panel rounded-[1.45rem] p-5", children: [_jsx("p", { className: "text-sm font-semibold uppercase tracking-[0.22em] text-[var(--nuyu-gold)]", children: getBookingKindLabel(selectedService?.bookingKind) }), _jsx("p", { className: "mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--nuyu-ink)]", children: selectedService?.name ?? "Choose a service" }), _jsx("p", { className: "mt-3", children: isStayBooking
                                                        ? `${formatDateOnly(checkInDate)} to ${formatDateOnly(checkOutDate)}`
                                                        : selectedSlot
                                                            ? `${selectedSlot.label} on ${formatDateOnly(bookingDate)}`
                                                            : "Choose an available slot to preview the schedule." }), _jsx("p", { className: "mt-3 text-2xl font-semibold text-[var(--nuyu-ink)]", children: formatCurrency(estimatedAmountKobo) }), _jsx("p", { className: "mt-2", children: selectedService?.bookingKind === "package" && selectedPackage
                                                        ? `Package selected: ${selectedPackage.label}`
                                                        : isStayBooking
                                                            ? "This estimate reflects the selected stay request."
                                                            : "This estimate reflects the selected booking request." })] }), _jsxs("div", { className: "public-panel rounded-[1.6rem] p-5", children: [_jsx("p", { className: "text-base font-semibold text-[var(--nuyu-ink)]", children: "What happens next" }), _jsx("div", { className: "mt-4 grid gap-3", children: flowSteps.map((step, index) => (_jsxs("div", { className: "public-subtle-panel rounded-[1.2rem] px-4 py-3 text-base leading-7 text-[var(--nuyu-muted)]", children: [_jsxs("span", { className: "font-semibold text-[var(--nuyu-ink)]", children: [index + 1, "."] }), " ", step] }, step))) })] })] }) }), _jsx(SectionCard, { eyebrow: "Saved Request", title: "Your latest booking update", description: "This area updates after you save the request.", children: _jsx("div", { className: "space-y-4 text-base leading-7 text-[var(--nuyu-muted)]", children: requestState.status !== "idle" ? (_jsxs("div", { className: "public-panel rounded-[1.75rem] p-5", children: [requestState.status === "success" && requestState.result ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "font-semibold text-[var(--nuyu-ink)]", children: "Your booking request has been saved" }), _jsxs("p", { className: "mt-3", children: ["Reference: ", _jsx("strong", { children: requestState.result.bookingId })] }), requestState.result.holdId ? (_jsxs("p", { className: "mt-2", children: ["Hold reference: ", _jsx("strong", { children: requestState.result.holdId })] })) : null, requestState.result.expiresAt ? (_jsxs("p", { className: "mt-2", children: ["Hold expires:", " ", _jsx("strong", { children: formatDateTime(requestState.result.expiresAt) })] })) : null, requestState.result.nextStep ? (_jsx("p", { className: "mt-3", children: requestState.result.nextStep })) : null, _jsx("button", { type: "button", className: "mt-4 rounded-full bg-[var(--color-primary)] px-5 py-3.5 text-base font-semibold text-white opacity-90", children: "Continue to payment later" })] })) : null, requestState.message ? _jsx("p", { className: "mt-3", children: requestState.message }) : null] })) : (_jsx("div", { className: "rounded-[1.75rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-5", children: "Save your request and the latest booking update will appear here." })) }) })] })] }), previewServiceSlug ? (_jsx("div", { className: "fixed inset-0 z-50 flex items-end justify-center bg-[rgba(18,29,20,0.5)] p-3 sm:items-center sm:p-6", onClick: () => setPreviewServiceSlug(null), children: _jsx("div", { role: "dialog", "aria-modal": "true", "aria-label": "Service details", className: "public-panel w-full max-w-4xl rounded-[1.8rem] p-4 sm:p-5", onClick: (event) => event.stopPropagation(), children: _jsxs("div", { className: "grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-start", children: [_jsx("div", { className: "overflow-hidden rounded-[1.5rem] border border-[var(--color-border-subtle)]", children: _jsx("img", { src: previewServiceMedia.imageUrl, alt: previewServiceMedia.alt, className: "aspect-[5/4] w-full object-cover", loading: "lazy", decoding: "async" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-[var(--nuyu-gold)]", children: getBookingKindLabel(previewService?.bookingKind) }), _jsx("h3", { className: "mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--nuyu-ink)]", children: previewService?.name })] }), _jsx("button", { type: "button", className: "rounded-full border border-[var(--nuyu-line)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-semibold text-[var(--nuyu-muted)]", onClick: () => setPreviewServiceSlug(null), children: "Close" })] }), _jsx("p", { className: "mt-4 text-base leading-7 text-[var(--nuyu-muted)]", children: previewService?.summary }), _jsxs("div", { className: "mt-4 grid gap-3 sm:grid-cols-3", children: [_jsxs("div", { className: "public-subtle-panel rounded-[1.2rem] p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-muted)]", children: previewServicePricing.primaryLabel }), _jsx("p", { className: "mt-2 text-lg font-semibold text-[var(--nuyu-ink)]", children: formatCurrency(previewServicePricing.primaryAmount) })] }), _jsxs("div", { className: "public-subtle-panel rounded-[1.2rem] p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-muted)]", children: previewServicePricing.secondaryLabel ?? previewServiceDetail.label }), _jsx("p", { className: "mt-2 text-lg font-semibold text-[var(--nuyu-ink)]", children: previewServicePricing.secondaryAmount
                                                            ? formatCurrency(previewServicePricing.secondaryAmount)
                                                            : previewServiceDetail.value })] }), _jsxs("div", { className: "public-subtle-panel rounded-[1.2rem] p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-muted)]", children: "Good to know" }), _jsx("p", { className: "mt-2 text-base leading-7 text-[var(--nuyu-muted)]", children: previewService?.packages?.length
                                                            ? `${previewService.packages.length} package options available`
                                                            : "You can book this option directly from the form below." })] })] }), previewService?.packages?.length ? (_jsxs("div", { className: "mt-4 rounded-[1.2rem] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-4 text-base leading-7 text-[var(--nuyu-muted)]", children: [_jsx("span", { className: "font-semibold text-[var(--nuyu-ink)]", children: "Package options:" }), " ", previewService.packages.map((item) => item.label).join(", ")] })) : null, _jsxs("div", { className: "mt-5 flex flex-wrap gap-3", children: [_jsx("button", { type: "button", className: "rounded-full bg-[var(--color-primary)] px-6 py-3 text-base font-semibold text-white transition hover:bg-[var(--color-primary-hover)]", onClick: () => {
                                                    if (previewService?.slug) {
                                                        setSelectedServiceSlug(previewService.slug);
                                                    }
                                                    setPreviewServiceSlug(null);
                                                    document.getElementById("booking-form")?.scrollIntoView({
                                                        behavior: "smooth",
                                                        block: "start",
                                                    });
                                                }, children: "Use this service" }), _jsx("button", { type: "button", className: "rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-6 py-3 text-base font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-surface-overlay)]", onClick: () => setPreviewServiceSlug(null), children: "Keep browsing" })] })] })] }) }) })) : null] }));
}
