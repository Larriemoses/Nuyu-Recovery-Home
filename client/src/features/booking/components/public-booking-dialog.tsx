import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Modal, Textarea } from "../../../components/ui";
import { useServiceCatalog } from "../../../hooks/use-service-catalog";
import { apiRequest } from "../../../lib/api/client";
import type {
  AvailabilityResponse,
  ReserveSlotResponse,
} from "../../../types/booking";
import { formatCurrency } from "../../../utils/currency";

type PublicBookingDialogProps = {
  open: boolean;
  onClose: () => void;
  initialServiceSlug?: string | null;
};

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

function formatDateOnly(value?: string) {
  if (!value) {
    return "Choose a date";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(new Date(value));
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

function getServiceDetail(service?: {
  bookingKind: string;
  durationMinutes?: number;
  sessionsCount?: number;
  minStayDays?: number;
  maxStayDays?: number;
}) {
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

function getBookingKindLabel(kind?: string) {
  if (kind === "stay") {
    return "Recovery stay";
  }

  if (kind === "package") {
    return "Treatment package";
  }

  return "Wellness session";
}

function getPrimaryAmount(service?: {
  bookingKind: string;
  basePriceKobo: number;
  packages?: Array<{ packagePriceKobo: number }>;
}) {
  if (!service) {
    return 0;
  }

  if (service.bookingKind === "package" && service.packages?.length) {
    return service.packages[0].packagePriceKobo;
  }

  return service.basePriceKobo;
}

export function PublicBookingDialog({
  open,
  onClose,
  initialServiceSlug,
}: PublicBookingDialogProps) {
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
    if (!open || !services.length) {
      return;
    }

    const preferredSlug =
      initialServiceSlug && services.some((item) => item.slug === initialServiceSlug)
        ? initialServiceSlug
        : services[0].slug;

    setSelectedServiceSlug(preferredSlug);
  }, [initialServiceSlug, open, services]);

  const selectedService = useMemo(
    () => services.find((service) => service.slug === selectedServiceSlug) ?? services[0],
    [selectedServiceSlug, services],
  );

  useEffect(() => {
    if (!selectedService?.packages?.length) {
      setSelectedPackageId("");
      return;
    }

    if (
      !selectedPackageId ||
      !selectedService.packages.some((item) => item.id === selectedPackageId)
    ) {
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
  }, [bookingDate, open, selectedService?.bookingKind, selectedService?.id]);

  const selectedPackage = selectedService?.packages?.find(
    (item) => item.id === selectedPackageId,
  );
  const selectedSlot = availabilityState.data?.slots.find(
    (slot) => slot.startsAt === availabilityState.selectedSlotStartsAt,
  );
  const isStayBooking = selectedService?.bookingKind === "stay";
  const estimatedAmountKobo =
    selectedService?.bookingKind === "package" && selectedPackage
      ? selectedPackage.packagePriceKobo
      : selectedService?.basePriceKobo ?? 0;

  async function handleReserveSlot(event: React.FormEvent<HTMLFormElement>) {
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
        throw new Error("Please choose one available time before continuing.");
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
            : "Something went wrong while saving the booking request.",
      });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={requestState.status === "success" ? "Booking saved" : "Book a service"}
      description={
        requestState.status === "success"
          ? "Your request is saved. Payment opens here once Paystack is connected."
          : "Choose a service, enter your details, and save your request."
      }
      panelClassName="max-w-2xl"
      footer={
        requestState.status === "success" ? (
          <Button onClick={onClose} fullWidth size="lg">
            Close
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs leading-5 text-[var(--color-text-muted)]">
              Payment opens here after this step once Paystack is connected.
            </p>
            <Button
              type="submit"
              form="public-booking-form"
              loading={requestState.status === "submitting"}
              disabled={!selectedService?.id}
              disabledReason="Live booking needs the synced service list before a request can be saved."
              fullWidth
              size="lg"
            >
              {isStayBooking ? "Save stay request" : "Save booking request"}
            </Button>
          </div>
        )
      }
    >
      {requestState.status === "success" && requestState.result ? (
        <div className="space-y-4">
          <Card
            header={
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Saved booking
                </p>
              </div>
            }
          >
            <div className="space-y-3 text-sm text-[var(--color-text-muted)]">
              <div className="flex items-center justify-between gap-3">
                <span>Service</span>
                <span className="font-medium text-[var(--color-text)]">
                  {selectedService?.name ?? requestState.result.serviceName ?? "Selected service"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Reference</span>
                <span className="font-medium text-[var(--color-text)]">
                  {requestState.result.bookingId}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Amount</span>
                <span className="font-medium text-[var(--color-text)]">
                  {formatCurrency(requestState.result.amountKobo ?? estimatedAmountKobo)}
                </span>
              </div>
              {requestState.result.expiresAt ? (
                <div className="flex items-center justify-between gap-3">
                  <span>Hold expires</span>
                  <span className="font-medium text-[var(--color-text)]">
                    {formatDateTime(requestState.result.expiresAt)}
                  </span>
                </div>
              ) : null}
            </div>
          </Card>

          <Card variant="flat">
            <p className="text-sm leading-6 text-[var(--color-text-muted)]">
              {requestState.result.nextStep ??
                "The request is saved. Payment will be connected in the next step."}
            </p>
          </Card>
        </div>
      ) : (
        <form id="public-booking-form" className="grid gap-4" onSubmit={handleReserveSlot}>
          {errorMessage ? (
            <Card variant="flat">
              <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                {errorMessage}
              </p>
            </Card>
          ) : null}

          {requestState.status === "error" && requestState.message ? (
            <Card variant="flat">
              <p className="text-sm leading-6 text-[var(--color-danger)]">
                {requestState.message}
              </p>
            </Card>
          ) : null}

          <Card
            header={
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Service
                </p>
              </div>
            }
          >
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-11 rounded-xl bg-[var(--color-surface-overlay)]" />
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="h-16 rounded-xl bg-[var(--color-surface-overlay)]" />
                  <div className="h-16 rounded-xl bg-[var(--color-surface-overlay)]" />
                  <div className="h-16 rounded-xl bg-[var(--color-surface-overlay)]" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex flex-col gap-2 text-sm text-[var(--color-text-muted)]">
                  <span className="font-medium text-[var(--color-text)]">Choose service</span>
                  <select
                    className="public-form-control rounded-xl px-3 py-2.5 text-sm"
                    value={selectedServiceSlug}
                    onChange={(event) => setSelectedServiceSlug(event.target.value)}
                  >
                    {services.map((service) => (
                      <option key={service.slug} value={service.slug}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-2 sm:grid-cols-3">
                  <Card variant="flat" className="rounded-xl">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      Type
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--color-text)]">
                      {getBookingKindLabel(selectedService?.bookingKind)}
                    </p>
                  </Card>
                  <Card variant="flat" className="rounded-xl">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      Detail
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--color-text)]">
                      {getServiceDetail(selectedService)}
                    </p>
                  </Card>
                  <Card variant="flat" className="rounded-xl">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      Estimate
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--color-text)]">
                      {formatCurrency(
                        selectedService?.bookingKind === "package" && selectedPackage
                          ? selectedPackage.packagePriceKobo
                          : getPrimaryAmount(selectedService),
                      )}
                    </p>
                  </Card>
                </div>

                {selectedService ? (
                  <Card variant="flat" className="rounded-xl">
                    <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                      {selectedService.summary}
                    </p>
                  </Card>
                ) : null}

                {selectedService?.packages?.length ? (
                  <label className="flex flex-col gap-2 text-sm text-[var(--color-text-muted)]">
                    <span className="font-medium text-[var(--color-text)]">Package option</span>
                    <select
                      className="public-form-control rounded-xl px-3 py-2.5 text-sm"
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
            )}
          </Card>

          <Card
            header={
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Your details
                </p>
              </div>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Client full name"
                required
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="client@example.com"
                required
              />
              <Input
                label="Phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+234..."
                required
              />
            </div>
          </Card>

          <Card
            header={
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Schedule
                </p>
              </div>
            }
          >
            <div className="space-y-4">
              {isStayBooking ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Check-in date"
                    type="date"
                    value={checkInDate}
                    onChange={(event) => setCheckInDate(event.target.value)}
                    required
                  />
                  <Input
                    label="Check-out date"
                    type="date"
                    value={checkOutDate}
                    onChange={(event) => setCheckOutDate(event.target.value)}
                    required
                  />
                </div>
              ) : (
                <>
                  <Input
                    label="Booking date"
                    type="date"
                    value={bookingDate}
                    onChange={(event) => setBookingDate(event.target.value)}
                    required
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        Available time
                      </p>
                      {availabilityState.isLoading ? (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          Loading time...
                        </span>
                      ) : null}
                    </div>

                    {availabilityState.errorMessage ? (
                      <p className="text-sm leading-6 text-[var(--color-danger)]">
                        {availabilityState.errorMessage}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {availabilityState.data?.slots.length ? (
                        availabilityState.data.slots.map((slot) => (
                          <button
                            key={slot.startsAt}
                            type="button"
                            className={[
                              "rounded-full px-3 py-2 text-sm font-medium transition",
                              availabilityState.selectedSlotStartsAt === slot.startsAt
                                ? "bg-[var(--color-primary)] text-white"
                                : "border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]",
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
                        <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                          No open slots yet for this day.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Textarea
            label="Notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Anything the team should know before confirmation"
          />

          <Card variant="flat">
            <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <p className="font-medium text-[var(--color-text)]">Current booking summary</p>
              <p>
                {selectedService?.name ?? "Choose a service"} •{" "}
                {formatCurrency(estimatedAmountKobo)} •{" "}
                {isStayBooking
                  ? `${formatDateOnly(checkInDate)} to ${formatDateOnly(checkOutDate)}`
                  : selectedSlot
                    ? `${selectedSlot.label} on ${formatDateOnly(bookingDate)}`
                    : formatDateOnly(bookingDate)}
              </p>
              <p>
                {source === "supabase"
                  ? "Live services are connected."
                  : "Starter services are showing while live sync finishes."}
              </p>
            </div>
          </Card>
        </form>
      )}
    </Modal>
  );
}
