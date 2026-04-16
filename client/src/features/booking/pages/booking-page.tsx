import { useEffect, useMemo, useState } from "react";
import { SectionCard } from "../../../components/ui/section-card";
import { useServiceCatalog } from "../../../hooks/use-service-catalog";
import { apiRequest } from "../../../lib/api/client";
import type {
  AvailabilityResponse,
  ReserveSlotResponse,
} from "../../../types/booking";
import { formatCurrency } from "../../../utils/currency";

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

export function BookingPage() {
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
    <div className="space-y-8">
      <SectionCard
        eyebrow="Booking Journey"
        title="A real booking flow up to the payment handoff"
        description="The form now creates live pre-payment booking records in Supabase. Timed services create 10-minute holds, while recovery-home stays create a saved stay request ready for the payment step."
      >
        <div className="grid gap-4 md:grid-cols-5">
          {flowSteps.map((step, index) => (
            <div
              key={step}
              className="rounded-[1.5rem] bg-white/75 p-4 text-sm leading-6 text-[var(--nuyu-muted)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--nuyu-gold)]">
                Step {index + 1}
              </p>
              <p className="mt-3">{step}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        eyebrow={source === "supabase" ? "Live Services" : "Fallback Services"}
        title="Service catalog"
        description={
          source === "supabase"
            ? "These services are being loaded from your connected Supabase project."
            : "The page is still showing the local starter catalog. Once Supabase responds with live data, that will take over automatically."
        }
      >
        {isLoading ? (
          <div className="rounded-[1.5rem] bg-white/75 p-5 text-sm text-[var(--nuyu-muted)]">
            Loading service catalog...
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-4 rounded-[1.5rem] border border-[rgba(47,93,50,0.12)] bg-[rgba(255,255,255,0.74)] p-4 text-sm leading-6 text-[var(--nuyu-muted)]">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.slug}
              className={[
                "rounded-[1.5rem] border p-5 transition",
                service.slug === selectedServiceSlug
                  ? "border-[var(--nuyu-primary)] bg-[rgba(47,93,50,0.04)] shadow-[0_18px_40px_rgba(35,72,38,0.08)]"
                  : "border-white/70 bg-white/75",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--nuyu-gold)]">
                    {service.bookingKind}
                  </p>
                  <h3 className="display-font mt-2 text-xl font-semibold text-[var(--nuyu-ink)]">
                    {service.name}
                  </h3>
                </div>
                <p className="rounded-full bg-[var(--nuyu-sand)] px-3 py-2 text-sm font-semibold text-[var(--nuyu-ink)]">
                  {formatCurrency(service.basePriceKobo)}
                </p>
              </div>

              <p className="mt-4 text-sm leading-6 text-[var(--nuyu-muted)]">
                {service.summary}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[var(--nuyu-muted)]">
                {service.durationMinutes ? (
                  <span className="rounded-full bg-[var(--nuyu-cream)] px-3 py-2">
                    {service.durationMinutes} mins
                  </span>
                ) : null}
                {service.minStayDays ? (
                  <span className="rounded-full bg-[var(--nuyu-cream)] px-3 py-2">
                    {service.minStayDays}-{service.maxStayDays} day stay
                  </span>
                ) : null}
                {service.sessionsCount ? (
                  <span className="rounded-full bg-[var(--nuyu-cream)] px-3 py-2">
                    {service.sessionsCount} sessions
                  </span>
                ) : null}
                {service.packages?.map((item) => (
                  <span
                    key={`${service.slug}-${item.label}`}
                    className="rounded-full bg-[var(--nuyu-cream)] px-3 py-2"
                  >
                    {item.label} {formatCurrency(item.packagePriceKobo)}
                  </span>
                ))}
              </div>

              <button
                type="button"
                className={[
                  "mt-5 rounded-full border px-4 py-2 text-sm font-semibold transition",
                  service.slug === selectedServiceSlug
                    ? "border-[var(--nuyu-primary)] bg-[var(--nuyu-primary)] text-[var(--nuyu-cream)]"
                    : "border-[var(--nuyu-primary)] text-[var(--nuyu-primary)] hover:bg-[var(--nuyu-primary)] hover:text-[var(--nuyu-cream)]",
                ].join(" ")}
                onClick={() => setSelectedServiceSlug(service.slug)}
              >
                {service.slug === selectedServiceSlug ? "Selected" : "Choose service"}
              </button>
            </article>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          eyebrow="Booking Form"
          title={
            selectedService?.bookingKind === "stay"
              ? "Create a stay request up to payment"
              : "Reserve a live time slot"
          }
          description="The booking is saved before payment so you can test the full pre-payment experience first."
        >
          <form className="grid gap-4" onSubmit={handleReserveSlot}>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
                Full name
                <input
                  className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Client full name"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
                Email
                <input
                  className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="client@example.com"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
                Phone
                <input
                  className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+234..."
                  required
                />
              </label>

              {selectedService?.packages?.length ? (
                <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
                  Package option
                  <select
                    className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-[var(--nuyu-ink)]"
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

              {selectedService?.bookingKind === "stay" ? (
                <>
                  <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
                    Check-in date
                    <input
                      className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                      type="date"
                      value={checkInDate}
                      onChange={(event) => setCheckInDate(event.target.value)}
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
                    Check-out date
                    <input
                      className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                      type="date"
                      value={checkOutDate}
                      onChange={(event) => setCheckOutDate(event.target.value)}
                      required
                    />
                  </label>
                </>
              ) : (
                <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
                  Booking date
                  <input
                    className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                    type="date"
                    value={bookingDate}
                    onChange={(event) => setBookingDate(event.target.value)}
                    required
                  />
                </label>
              )}
            </div>

            <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
              Notes for admin
              <textarea
                className="min-h-28 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Anything the team should know before payment or confirmation..."
              />
            </label>

            {selectedService?.bookingKind !== "stay" ? (
              <div className="rounded-[1.5rem] bg-[rgba(255,255,255,0.74)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--nuyu-ink)]">
                      Available slots
                    </p>
                    <p className="mt-1 text-sm text-[var(--nuyu-muted)]">
                      {availabilityState.data?.date
                        ? `Showing live availability for ${formatDateOnly(
                            availabilityState.data.date,
                          )}`
                        : "Choose a date to load availability."}
                    </p>
                  </div>
                  {availabilityState.isLoading ? (
                    <p className="text-sm text-[var(--nuyu-muted)]">Loading slots...</p>
                  ) : null}
                </div>

                {availabilityState.errorMessage ? (
                  <p className="mt-4 text-sm text-[var(--nuyu-muted)]">
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
                          "rounded-full px-4 py-2 text-sm font-medium transition",
                          availabilityState.selectedSlotStartsAt === slot.startsAt
                            ? "bg-[var(--nuyu-primary)] text-[var(--nuyu-cream)]"
                            : "bg-white text-[var(--nuyu-muted)] hover:bg-[var(--nuyu-cream)]",
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
                    <p className="text-sm text-[var(--nuyu-muted)]">
                      No open slots were found for that day yet.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex items-end">
              <button
                type="submit"
                className="rounded-full bg-[var(--nuyu-primary)] px-6 py-3 text-sm font-semibold text-[var(--nuyu-cream)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={requestState.status === "submitting"}
              >
                {requestState.status === "submitting"
                  ? "Saving booking..."
                  : selectedService?.bookingKind === "stay"
                    ? "Save stay request"
                    : "Reserve booking and continue"}
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          eyebrow="Pre-Payment Summary"
          title="Everything ready before Paystack"
          description="This panel reflects the selected service and the saved booking result so you can test the whole lead-up to payment."
        >
          <div className="space-y-4 text-sm text-[var(--nuyu-muted)]">
            <div className="rounded-[1.5rem] bg-white/75 p-5">
              <p className="font-semibold text-[var(--nuyu-ink)]">
                {selectedService?.name ?? "Choose a service"}
              </p>
              <p className="mt-2">
                {selectedService?.bookingKind === "stay"
                  ? `${formatDateOnly(checkInDate)} to ${formatDateOnly(checkOutDate)}`
                  : selectedSlot
                    ? `${selectedSlot.label} on ${formatDateOnly(bookingDate)}`
                    : "Choose an available slot to preview the booking schedule."}
              </p>
              <p className="mt-3 text-lg font-semibold text-[var(--nuyu-ink)]">
                {formatCurrency(estimatedAmountKobo)}
              </p>
              <p className="mt-2">
                {selectedService?.bookingKind === "package" && selectedPackage
                  ? `Selected package: ${selectedPackage.label}`
                  : selectedService?.bookingKind === "stay"
                    ? "Estimated stay amount saved with the draft booking."
                    : "Base service amount saved with the booking draft."}
              </p>
            </div>

            {requestState.status !== "idle" ? (
              <div className="rounded-[1.5rem] border border-white/70 bg-white/75 p-5">
                {requestState.status === "success" && requestState.result ? (
                  <>
                    <p className="font-semibold text-[var(--nuyu-ink)]">
                      Booking saved successfully
                    </p>
                    <p className="mt-3">
                      Booking ID: <strong>{requestState.result.bookingId}</strong>
                    </p>
                    {requestState.result.holdId ? (
                      <p className="mt-2">
                        Hold ID: <strong>{requestState.result.holdId}</strong>
                      </p>
                    ) : null}
                    {requestState.result.expiresAt ? (
                      <p className="mt-2">
                        Hold expires: <strong>{formatDateTime(requestState.result.expiresAt)}</strong>
                      </p>
                    ) : null}
                    {requestState.result.nextStep ? (
                      <p className="mt-3">{requestState.result.nextStep}</p>
                    ) : null}
                    <button
                      type="button"
                      className="mt-4 rounded-full bg-[var(--nuyu-primary-deep)] px-5 py-3 text-sm font-semibold text-[var(--nuyu-cream)] opacity-85"
                    >
                      Continue to payment (next integration)
                    </button>
                  </>
                ) : null}

                {requestState.message ? <p className="mt-3">{requestState.message}</p> : null}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-[rgba(42,31,27,0.18)] bg-[rgba(255,255,255,0.56)] p-5">
                Save a booking draft and this panel will show the exact handoff point to payment.
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
