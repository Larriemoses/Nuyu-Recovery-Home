import { useEffect, useMemo, useRef, useState } from "react";
import { SectionCard } from "../../../components/ui/section-card";
import { CarouselControlButton } from "../../../components/ui/carousel-control-button";
import { useServiceCatalog } from "../../../hooks/use-service-catalog";
import { apiRequest } from "../../../lib/api/client";
import type {
  AvailabilityResponse,
  ReserveSlotResponse,
} from "../../../types/booking";
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

function formatDateTime(value?: string) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateOnly(value?: string) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getBookingKindLabel(kind?: string) {
  if (kind === "stay") {
    return "Recovery stay";
  }

  if (kind === "package") {
    return "Treatment package";
  }

  return "Wellness session";
}

function getServiceDetailLabel(service?: {
  bookingKind: string;
  durationMinutes?: number;
  sessionsCount?: number;
  minStayDays?: number;
  maxStayDays?: number;
}) {
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

function getServicePricing(service?: {
  bookingKind: string;
  basePriceKobo: number;
  packages?: Array<{ packagePriceKobo: number }>;
}) {
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
  const [previewServiceSlug, setPreviewServiceSlug] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingDate, setBookingDate] = useState(getDefaultBookingDate);
  const [checkInDate, setCheckInDate] = useState(getDefaultBookingDate);
  const [checkOutDate, setCheckOutDate] = useState(getDefaultCheckoutDate);
  const [availabilityState, setAvailabilityState] = useState<{
    isLoading: boolean;
    errorMessage?: string;
    data?: AvailabilityResponse;
    selectedSlotStartsAt?: string;
  }>({
    isLoading: false,
  });
  const [requestState, setRequestState] = useState<{
    status: "idle" | "submitting" | "success" | "error";
    message?: string;
    result?: ReserveSlotResponse;
  }>({ status: "idle" });
  const serviceCarouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!services.length) {
      return;
    }

    if (!selectedServiceSlug || !services.some((item) => item.slug === selectedServiceSlug)) {
      setSelectedServiceSlug(services[0].slug);
    }
  }, [selectedServiceSlug, services]);

  const selectedService = useMemo(
    () => services.find((service) => service.slug === selectedServiceSlug) ?? services[0],
    [selectedServiceSlug, services],
  );
  const previewService = useMemo(
    () =>
      services.find((service) => service.slug === previewServiceSlug) ??
      selectedService,
    [previewServiceSlug, selectedService, services],
  );

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
        const result = await apiRequest<AvailabilityResponse>(
          `/bookings/availability?serviceId=${selectedService.id}&date=${bookingDate}`,
        );

        setAvailabilityState({
          isLoading: false,
          data: result,
          selectedSlotStartsAt: result.slots[0]?.startsAt,
        });
      } catch (error) {
        setAvailabilityState({
          isLoading: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : "Unable to load slot availability.",
        });
      }
    }

    void loadAvailability();
  }, [bookingDate, selectedService?.bookingKind, selectedService?.id]);

  const selectedPackage = selectedService?.packages?.find(
    (item) => item.id === selectedPackageId,
  );
  const selectedSlot = availabilityState.data?.slots.find(
    (slot) => slot.startsAt === availabilityState.selectedSlotStartsAt,
  );

  const estimatedAmountKobo =
    selectedService?.bookingKind === "package" && selectedPackage
      ? selectedPackage.packagePriceKobo
      : selectedService?.basePriceKobo ?? 0;
  const isStayBooking = selectedService?.bookingKind === "stay";
  const previewServiceMedia = getServiceMedia(previewService?.slug);
  const previewServiceDetail = getServiceDetailLabel(previewService);
  const previewServicePricing = getServicePricing(previewService);

  function scrollServices(direction: "left" | "right") {
    if (!serviceCarouselRef.current) {
      return;
    }

    const distance = Math.min(360, serviceCarouselRef.current.clientWidth * 0.9);

    serviceCarouselRef.current.scrollBy({
      left: direction === "right" ? distance : -distance,
      behavior: "smooth",
    });
  }

  async function handleReserveSlot(event: React.FormEvent<HTMLFormElement>) {
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
      const payload =
        selectedService.bookingKind === "stay"
          ? {
              mode: "stay" as const,
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
              mode: "timed" as const,
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

      const result = await apiRequest<ReserveSlotResponse>("/bookings/reserve", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setRequestState({
        status: "success",
        result,
        message: result.message,
      });
    } catch (error) {
      setRequestState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while creating the booking.",
      });
    }
  }

  return (
    <div className="space-y-4">
      <section className="public-panel rounded-[1.7rem] p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
              Booking Studio
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--nuyu-ink)] sm:text-4xl">
              Choose a service, fill the form, and save the booking request.
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--nuyu-muted)] sm:text-lg">
              This page is focused on the booking itself, so the service list stays simple
              and the booking form stays the main thing on screen.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="public-subtle-panel rounded-[1.25rem] p-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-muted)]">
                Selected service
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--nuyu-ink)]">
                {selectedService?.name ?? "Choose a service"}
              </p>
            </div>
            <div className="public-subtle-panel rounded-[1.25rem] p-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-muted)]">
                Current estimate
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--nuyu-ink)]">
                {formatCurrency(estimatedAmountKobo)}
              </p>
            </div>
            <div className="public-subtle-panel rounded-[1.25rem] p-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-muted)]">
                Service list
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--nuyu-muted)]">
                {source === "supabase"
                  ? "Using the live service list."
                  : "Using the starter service list for now."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionCard
        eyebrow="Choose Your Service"
        title="Choose a service first"
        description="Browse the service list below, then open the one you want and continue straight to the booking form."
      >
        {isLoading ? (
          <div className="public-panel rounded-[1.5rem] p-5 text-base leading-7 text-[var(--nuyu-muted)]">
            Loading services...
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-4 rounded-[1.6rem] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-4 text-base leading-7 text-[var(--nuyu-muted)]">
            {errorMessage}
          </div>
        ) : null}

        <div className="relative">
          <div className="absolute left-1 top-1/2 z-10 -translate-y-1/2">
            <CarouselControlButton direction="left" onClick={() => scrollServices("left")} />
          </div>
          <div className="absolute right-1 top-1/2 z-10 -translate-y-1/2">
            <CarouselControlButton direction="right" onClick={() => scrollServices("right")} />
          </div>

          <div ref={serviceCarouselRef} className="nuyu-carousel px-1">
            {services.map((service, index) => {
              const serviceMedia = getServiceMedia(service.slug);
              const serviceDetail = getServiceDetailLabel(service);
              const servicePricing = getServicePricing(service);

              return (
                <article
                  key={service.slug}
                    className={[
                      "nuyu-carousel-card group nuyu-hover-lift nuyu-reveal flex h-full flex-col overflow-hidden rounded-[1.45rem] border p-3.5 transition",
                      service.slug === selectedServiceSlug
                        ? "border-[var(--color-primary)] bg-[color-mix(in_oklab,var(--color-primary)_8%,white)] shadow-[0_20px_46px_rgba(35,72,38,0.08)]"
                        : "border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]",
                    ].join(" ")}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="relative overflow-hidden rounded-[1.15rem]">
                    <img
                      src={serviceMedia.imageUrl}
                      alt={serviceMedia.alt}
                      loading="lazy"
                      decoding="async"
                      className="nuyu-image aspect-[4/3] w-full object-cover"
                    />
                  </div>

                  <div className="mt-3 flex flex-1 flex-col">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                      {getBookingKindLabel(service.bookingKind)}
                    </p>
                    <h3 className="mt-1.5 text-base font-semibold leading-6 tracking-[-0.02em] text-[var(--nuyu-ink)] sm:text-lg">
                      {service.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--nuyu-muted)]">
                      {service.summary}
                    </p>

                    <div className="mt-3 grid gap-2">
                      <div className="public-subtle-panel rounded-[1rem] px-3 py-2 text-sm text-[var(--nuyu-muted)]">
                        <span className="font-semibold text-[var(--nuyu-ink)]">
                          {servicePricing.secondaryAmount
                            ? servicePricing.secondaryLabel
                            : servicePricing.primaryLabel}
                          :
                        </span>{" "}
                        {formatCurrency(
                          servicePricing.secondaryAmount ?? servicePricing.primaryAmount,
                        )}
                      </div>
                      <div className="public-subtle-panel rounded-[1rem] px-3 py-2 text-sm text-[var(--nuyu-muted)]">
                        <span className="font-semibold text-[var(--nuyu-ink)]">
                          {serviceDetail.label}:
                        </span>{" "}
                        {serviceDetail.value}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={[
                        "mt-3 w-full rounded-full border px-4 py-2.5 text-sm font-semibold transition sm:text-base",
                        service.slug === selectedServiceSlug
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                          : "border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white",
                      ].join(" ")}
                      onClick={() => setPreviewServiceSlug(service.slug)}
                    >
                      {service.slug === selectedServiceSlug
                        ? "View selected service"
                        : "View details"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[1.32fr_0.68fr] xl:items-start">
        <SectionCard
          eyebrow="Your Details"
          title={
            isStayBooking
              ? "Tell us about your stay request"
              : "Tell us about your booking"
          }
          description="Fill in the details below and save your request in a few simple steps."
        >
          <form id="booking-form" className="grid gap-4 sm:gap-5" onSubmit={handleReserveSlot}>
            <div className="public-subtle-panel rounded-[1.45rem] p-5 sm:p-6">
              <p className="text-base font-semibold text-[var(--nuyu-ink)]">Contact details</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="flex flex-col gap-2 text-base text-[var(--nuyu-muted)]">
                  Full name
                  <input
                    className="public-form-control rounded-2xl px-4 py-3.5 text-base"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Client full name"
                    required
                  />
                </label>

                <label className="flex flex-col gap-2 text-base text-[var(--nuyu-muted)]">
                  Email
                  <input
                    className="public-form-control rounded-2xl px-4 py-3.5 text-base"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="client@example.com"
                    required
                  />
                </label>

                <label className="flex flex-col gap-2 text-base text-[var(--nuyu-muted)]">
                  Phone
                  <input
                    className="public-form-control rounded-2xl px-4 py-3.5 text-base"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+234..."
                    required
                  />
                </label>

                {selectedService?.packages?.length ? (
                  <label className="flex flex-col gap-2 text-base text-[var(--nuyu-muted)]">
                    Package option
                    <select
                      className="public-form-control rounded-2xl px-4 py-3.5 text-base"
                      value={selectedPackageId}
                      onChange={(event) => setSelectedPackageId(event.target.value)}
                    >
                      {selectedService.packages.map((item) => (
                        <option key={item.id ?? item.label} value={item.id}>
                          {item.label} - {formatCurrency(item.packagePriceKobo)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            </div>

            <div className="public-subtle-panel rounded-[1.45rem] p-5 sm:p-6">
              <p className="text-base font-semibold text-[var(--nuyu-ink)]">Schedule</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {isStayBooking ? (
                  <>
                    <label className="flex flex-col gap-2 text-base text-[var(--nuyu-muted)]">
                      Check-in date
                      <input
                        className="public-form-control rounded-2xl px-4 py-3.5 text-base"
                        type="date"
                        value={checkInDate}
                        onChange={(event) => setCheckInDate(event.target.value)}
                        required
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-base text-[var(--nuyu-muted)]">
                      Check-out date
                      <input
                        className="public-form-control rounded-2xl px-4 py-3.5 text-base"
                        type="date"
                        value={checkOutDate}
                        onChange={(event) => setCheckOutDate(event.target.value)}
                        required
                      />
                    </label>
                  </>
                ) : (
                  <label className="flex flex-col gap-2 text-base text-[var(--nuyu-muted)]">
                    Booking date
                    <input
                      className="public-form-control rounded-2xl px-4 py-3.5 text-base"
                      type="date"
                      value={bookingDate}
                      onChange={(event) => setBookingDate(event.target.value)}
                      required
                    />
                  </label>
                )}
              </div>
            </div>

            <label className="flex flex-col gap-2 text-base text-[var(--nuyu-muted)]">
              Notes or preferences
              <textarea
                className="public-form-control min-h-28 rounded-2xl px-4 py-3.5 text-base"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Anything you want the team to know before payment or confirmation..."
              />
            </label>

            {!isStayBooking ? (
              <div className="public-panel rounded-[1.45rem] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[var(--nuyu-ink)]">
                      Available time slots
                    </p>
                    <p className="mt-1 text-base leading-7 text-[var(--nuyu-muted)]">
                      {availabilityState.data?.date
                        ? `Showing available slots for ${formatDateOnly(
                            availabilityState.data.date,
                          )}`
                        : "Choose a date to load available times."}
                    </p>
                  </div>
                  {availabilityState.isLoading ? (
                    <p className="text-base text-[var(--nuyu-muted)]">Loading slots...</p>
                  ) : null}
                </div>

                {availabilityState.errorMessage ? (
                  <p className="mt-4 text-base leading-7 text-[var(--nuyu-muted)]">
                    {availabilityState.errorMessage}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  {availabilityState.data?.slots.length ? (
                    availabilityState.data.slots.map((slot) => (
                      <button
                        key={slot.startsAt}
                        type="button"
                        className={[
                          "rounded-full px-5 py-3 text-base font-medium transition",
                          availabilityState.selectedSlotStartsAt === slot.startsAt
                            ? "bg-[var(--color-primary)] text-white"
                            : "border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] text-[var(--nuyu-muted)] hover:bg-[var(--color-surface-overlay)]",
                        ].join(" ")}
                        onClick={() =>
                          setAvailabilityState((current) => ({
                            ...current,
                            selectedSlotStartsAt: slot.startsAt,
                          }))
                        }
                      >
                        {slot.label}
                      </button>
                    ))
                  ) : (
                    <p className="text-base leading-7 text-[var(--nuyu-muted)]">
                      No open slots were found for that day yet.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex items-end">
              <button
                type="submit"
                className="rounded-full bg-[var(--color-primary)] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={requestState.status === "submitting"}
              >
                {requestState.status === "submitting"
                  ? "Saving booking..."
                  : isStayBooking
                    ? "Save stay request"
                    : "Save booking request"}
              </button>
            </div>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            eyebrow="Your Summary"
            title="Quick booking summary"
            description="This side panel stays simple so the form remains the main focus."
          >
            <div className="space-y-4 text-base leading-7 text-[var(--nuyu-muted)]">
              <div className="public-panel rounded-[1.45rem] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--nuyu-gold)]">
                  {getBookingKindLabel(selectedService?.bookingKind)}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--nuyu-ink)]">
                  {selectedService?.name ?? "Choose a service"}
                </p>
                <p className="mt-3">
                  {isStayBooking
                    ? `${formatDateOnly(checkInDate)} to ${formatDateOnly(checkOutDate)}`
                    : selectedSlot
                      ? `${selectedSlot.label} on ${formatDateOnly(bookingDate)}`
                      : "Choose an available slot to preview the schedule."}
                </p>
                <p className="mt-3 text-2xl font-semibold text-[var(--nuyu-ink)]">
                  {formatCurrency(estimatedAmountKobo)}
                </p>
                <p className="mt-2">
                  {selectedService?.bookingKind === "package" && selectedPackage
                    ? `Package selected: ${selectedPackage.label}`
                    : isStayBooking
                      ? "This estimate reflects the selected stay request."
                      : "This estimate reflects the selected booking request."}
                </p>
              </div>

              <div className="public-panel rounded-[1.6rem] p-5">
                <p className="text-base font-semibold text-[var(--nuyu-ink)]">
                  What happens next
                </p>
                <div className="mt-4 grid gap-3">
                  {flowSteps.map((step, index) => (
                    <div
                      key={step}
                      className="public-subtle-panel rounded-[1.2rem] px-4 py-3 text-base leading-7 text-[var(--nuyu-muted)]"
                    >
                      <span className="font-semibold text-[var(--nuyu-ink)]">
                        {index + 1}.
                      </span>{" "}
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Saved Request"
            title="Your latest booking update"
            description="This area updates after you save the request."
          >
            <div className="space-y-4 text-base leading-7 text-[var(--nuyu-muted)]">
              {requestState.status !== "idle" ? (
                <div className="public-panel rounded-[1.75rem] p-5">
                  {requestState.status === "success" && requestState.result ? (
                    <>
                      <p className="font-semibold text-[var(--nuyu-ink)]">
                        Your booking request has been saved
                      </p>
                      <p className="mt-3">
                        Reference: <strong>{requestState.result.bookingId}</strong>
                      </p>
                      {requestState.result.holdId ? (
                        <p className="mt-2">
                          Hold reference: <strong>{requestState.result.holdId}</strong>
                        </p>
                      ) : null}
                      {requestState.result.expiresAt ? (
                        <p className="mt-2">
                          Hold expires:{" "}
                          <strong>{formatDateTime(requestState.result.expiresAt)}</strong>
                        </p>
                      ) : null}
                      {requestState.result.nextStep ? (
                        <p className="mt-3">{requestState.result.nextStep}</p>
                      ) : null}
                      <button
                        type="button"
                        className="mt-4 rounded-full bg-[var(--color-primary)] px-5 py-3.5 text-base font-semibold text-white opacity-90"
                      >
                        Continue to payment later
                      </button>
                    </>
                  ) : null}

                  {requestState.message ? <p className="mt-3">{requestState.message}</p> : null}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-5">
                  Save your request and the latest booking update will appear here.
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      {previewServiceSlug ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(18,29,20,0.5)] p-3 sm:items-center sm:p-6"
          onClick={() => setPreviewServiceSlug(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Service details"
            className="public-panel w-full max-w-4xl rounded-[1.8rem] p-4 sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border-subtle)]">
                <img
                  src={previewServiceMedia.imageUrl}
                  alt={previewServiceMedia.alt}
                  className="aspect-[5/4] w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--nuyu-gold)]">
                      {getBookingKindLabel(previewService?.bookingKind)}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--nuyu-ink)]">
                      {previewService?.name}
                    </h3>
                  </div>

                  <button
                    type="button"
                    className="rounded-full border border-[var(--nuyu-line)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-semibold text-[var(--nuyu-muted)]"
                    onClick={() => setPreviewServiceSlug(null)}
                  >
                    Close
                  </button>
                </div>

                <p className="mt-4 text-base leading-7 text-[var(--nuyu-muted)]">
                  {previewService?.summary}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="public-subtle-panel rounded-[1.2rem] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-muted)]">
                      {previewServicePricing.primaryLabel}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--nuyu-ink)]">
                      {formatCurrency(previewServicePricing.primaryAmount)}
                    </p>
                  </div>
                  <div className="public-subtle-panel rounded-[1.2rem] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-muted)]">
                      {previewServicePricing.secondaryLabel ?? previewServiceDetail.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--nuyu-ink)]">
                      {previewServicePricing.secondaryAmount
                        ? formatCurrency(previewServicePricing.secondaryAmount)
                        : previewServiceDetail.value}
                    </p>
                  </div>
                  <div className="public-subtle-panel rounded-[1.2rem] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-muted)]">
                      Good to know
                    </p>
                    <p className="mt-2 text-base leading-7 text-[var(--nuyu-muted)]">
                      {previewService?.packages?.length
                        ? `${previewService.packages.length} package options available`
                        : "You can book this option directly from the form below."}
                    </p>
                  </div>
                </div>

                {previewService?.packages?.length ? (
                  <div className="mt-4 rounded-[1.2rem] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-4 text-base leading-7 text-[var(--nuyu-muted)]">
                    <span className="font-semibold text-[var(--nuyu-ink)]">
                      Package options:
                    </span>{" "}
                    {previewService.packages.map((item) => item.label).join(", ")}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-base font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
                    onClick={() => {
                      if (previewService?.slug) {
                        setSelectedServiceSlug(previewService.slug);
                      }
                      setPreviewServiceSlug(null);
                      document.getElementById("booking-form")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                  >
                    Use this service
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-6 py-3 text-base font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-surface-overlay)]"
                    onClick={() => setPreviewServiceSlug(null)}
                  >
                    Keep browsing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
