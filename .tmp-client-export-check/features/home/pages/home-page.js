import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Card } from "../../../components/ui";
import { SectionCard } from "../../../components/ui/section-card";
import { CarouselControlButton } from "../../../components/ui/carousel-control-button";
import { useServiceCatalog } from "../../../hooks/use-service-catalog";
import { formatCurrency } from "../../../utils/currency";
import { PublicBookingDialog } from "../../booking/components/public-booking-dialog";
import { getServiceMedia, homeShowcaseMedia, } from "../../services/data/service-media";
const trustPoints = [
    "Private recovery support",
    "Simple booking flow",
    "Clear service pricing",
];
const bookingSteps = [
    {
        label: "Choose",
        detail: "Pick the service that fits your recovery or wellness plan.",
    },
    {
        label: "Select",
        detail: "Choose the date, time, or stay range inside the booking dialog.",
    },
    {
        label: "Save",
        detail: "Save the request first. Payment opens here when Paystack is connected.",
    },
];
function getServiceMeta(service) {
    if (service.bookingKind === "stay" && service.minStayDays && service.maxStayDays) {
        return `${service.minStayDays}-${service.maxStayDays} day stay`;
    }
    if (service.bookingKind === "package" && service.sessionsCount) {
        return `${service.sessionsCount} sessions`;
    }
    return `${service.durationMinutes ?? 60} mins`;
}
function getServicePrice(service) {
    if (service.bookingKind === "package" && service.packages?.length) {
        return service.packages[0].packagePriceKobo;
    }
    return service.basePriceKobo;
}
export function HomePage() {
    const { services, source, isLoading, errorMessage } = useServiceCatalog();
    const servicesRef = useRef(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const bookingModalOpen = searchParams.get("book") === "1";
    const selectedServiceSlug = searchParams.get("service");
    function scrollServices(direction) {
        const container = servicesRef.current;
        if (!container) {
            return;
        }
        const distance = Math.min(360, container.clientWidth * 0.9);
        container.scrollBy({
            left: direction === "right" ? distance : -distance,
            behavior: "smooth",
        });
    }
    function openBookingDialog(serviceSlug) {
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.set("book", "1");
        if (serviceSlug) {
            nextSearchParams.set("service", serviceSlug);
        }
        else {
            nextSearchParams.delete("service");
        }
        setSearchParams(nextSearchParams, { replace: true });
    }
    function closeBookingDialog() {
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.delete("book");
        nextSearchParams.delete("service");
        setSearchParams(nextSearchParams, { replace: true });
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-4", children: [_jsx("section", { className: "public-panel overflow-hidden rounded-[1.7rem] p-4 sm:p-5", children: _jsxs("div", { className: "grid gap-4 lg:grid-cols-[1.06fr_0.94fr] lg:items-stretch", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "public-subtle-panel rounded-[1.5rem] p-4 sm:p-5", children: [_jsx("p", { className: "text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--nuyu-gold)]", children: "Private Recovery Home" }), _jsx("h1", { className: "mt-3 max-w-3xl text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--nuyu-ink)] sm:text-[2.6rem]", children: "Recovery stays and wellness treatments in one calm booking flow." }), _jsx("p", { className: "mt-3 max-w-2xl text-sm leading-6 text-[var(--nuyu-muted)] sm:text-base", children: "Everything stays here on one page. Review the services, then open the booking dialog when you are ready." }), _jsx("div", { className: "mt-5", children: _jsx(Button, { size: "lg", onClick: () => openBookingDialog(), className: "min-w-[11rem]", children: "Book now" }) })] }), _jsx("div", { className: "grid gap-2 sm:grid-cols-3", children: trustPoints.map((point) => (_jsx(Card, { variant: "flat", className: "rounded-xl", children: _jsx("p", { className: "text-sm font-medium text-[var(--color-text)]", children: point }) }, point))) })] }), _jsxs("article", { className: "group public-panel relative overflow-hidden rounded-[1.5rem]", children: [_jsx("img", { src: homeShowcaseMedia.imageUrl, alt: homeShowcaseMedia.alt, className: "nuyu-image h-full min-h-[16rem] w-full object-cover", fetchPriority: "high" }), _jsx("div", { className: "absolute inset-0 bg-[linear-gradient(180deg,rgba(17,31,18,0.08),rgba(17,31,18,0.68))]" }), _jsxs("div", { className: "absolute inset-x-0 bottom-0 space-y-3 p-5 text-[var(--nuyu-cream)]", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.22em] text-[var(--nuyu-gold-soft)]", children: homeShowcaseMedia.eyebrow }), _jsx("p", { className: "text-lg font-medium leading-7 sm:text-xl", children: "Calm support, clear options, and one direct place to book." })] })] })] }) }), _jsxs(SectionCard, { eyebrow: "Services", title: "Choose your service", description: "Browse the services below. Tap any service to open the booking dialog with it selected.", footer: _jsxs("div", { className: "flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]", children: [_jsx("span", { className: "public-pill rounded-full px-3 py-2", children: source === "supabase"
                                        ? "Live service list connected"
                                        : "Starter service list showing" }), _jsx("span", { children: "Swipe on mobile or use the arrows." })] }), children: [errorMessage ? (_jsx(Card, { variant: "flat", className: "mb-4 rounded-xl", children: _jsx("p", { className: "text-sm leading-6 text-[var(--color-text-muted)]", children: errorMessage }) })) : null, isLoading ? (_jsx("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3", children: Array.from({ length: 3 }).map((_, index) => (_jsxs("div", { className: "rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-3", children: [_jsx("div", { className: "aspect-[4/3] rounded-xl bg-[var(--color-surface)]" }), _jsx("div", { className: "mt-3 h-4 rounded bg-[var(--color-surface)]" }), _jsx("div", { className: "mt-2 h-4 w-2/3 rounded bg-[var(--color-surface)]" })] }, index))) })) : (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute left-1 top-1/2 z-10 -translate-y-1/2", children: _jsx(CarouselControlButton, { direction: "left", onClick: () => scrollServices("left") }) }), _jsx("div", { className: "absolute right-1 top-1/2 z-10 -translate-y-1/2", children: _jsx(CarouselControlButton, { direction: "right", onClick: () => scrollServices("right") }) }), _jsx("div", { ref: servicesRef, className: "nuyu-carousel px-1", children: services.map((service, index) => {
                                            const media = getServiceMedia(service.slug);
                                            return (_jsxs("button", { type: "button", className: "nuyu-carousel-card group nuyu-hover-lift nuyu-reveal public-panel overflow-hidden rounded-[1.45rem] p-3 text-left", style: { animationDelay: `${index * 70}ms` }, onClick: () => openBookingDialog(service.slug), children: [_jsx("div", { className: "overflow-hidden rounded-[1.1rem]", children: _jsx("img", { src: media.imageUrl, alt: media.alt, loading: "lazy", decoding: "async", className: "nuyu-image aspect-[4/3] w-full object-cover" }) }), _jsxs("div", { className: "mt-3 space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--nuyu-gold)]", children: service.bookingKind === "stay"
                                                                            ? "Recovery stay"
                                                                            : service.bookingKind === "package"
                                                                                ? "Treatment package"
                                                                                : "Wellness session" }), _jsx("h3", { className: "mt-2 text-base font-medium leading-6 text-[var(--nuyu-ink)]", children: service.name }), _jsx("p", { className: "mt-2 text-sm leading-6 text-[var(--nuyu-muted)]", children: service.summary })] }), _jsxs("div", { className: "flex flex-wrap gap-2 text-sm text-[var(--nuyu-muted)]", children: [_jsxs("span", { className: "public-pill rounded-full px-3 py-1.5", children: ["From ", formatCurrency(getServicePrice(service))] }), _jsx("span", { className: "public-pill rounded-full px-3 py-1.5", children: getServiceMeta(service) })] })] })] }, service.slug));
                                        }) })] }))] }), _jsx(SectionCard, { eyebrow: "Booking", title: "How booking works", description: "A short, direct flow from service selection to saved request.", children: _jsx("div", { className: "grid gap-3 md:grid-cols-3", children: bookingSteps.map((step) => (_jsxs(Card, { variant: "flat", className: "rounded-xl", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]", children: step.label }), _jsx("p", { className: "mt-2 text-sm leading-6 text-[var(--color-text)]", children: step.detail })] }, step.label))) }) })] }), _jsx(PublicBookingDialog, { open: bookingModalOpen, onClose: closeBookingDialog, initialServiceSlug: selectedServiceSlug })] }));
}
