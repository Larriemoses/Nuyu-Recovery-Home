import { supabaseAdmin } from "../lib/supabase/admin-client.js";
import { HttpError } from "../lib/http-error.js";
import type {
  BookingClientInput,
  ReserveBookingInput,
  ReserveStayBookingInput,
  ReserveTimedBookingInput,
} from "../types/api.js";

const HOLD_WINDOW_MINUTES = 10;
const ACTIVE_BOOKING_STATUSES = ["held", "confirmed"] as const;
const LAGOS_OFFSET = "+01:00";

type ServiceRecord = {
  id: string;
  name: string;
  booking_kind: "appointment" | "package" | "stay";
  is_active: boolean;
  base_price_kobo: number;
  duration_minutes: number | null;
  min_stay_days: number | null;
  max_stay_days: number | null;
};

type AvailabilityQuery = {
  serviceId: string;
  date: string;
};

type AvailabilityWindowRow = {
  start_time: string;
  end_time: string;
  slot_length_minutes: number;
};

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function toLagosDateTime(date: string, time: string) {
  return new Date(`${date}T${time}${LAGOS_OFFSET}`);
}

function getWeekday(date: string) {
  return new Date(`${date}T12:00:00${LAGOS_OFFSET}`).getUTCDay();
}

function getDayBounds(date: string) {
  const dayStart = new Date(`${date}T00:00:00${LAGOS_OFFSET}`);
  const dayEnd = new Date(`${date}T23:59:59${LAGOS_OFFSET}`);

  return {
    dayStartIso: dayStart.toISOString(),
    dayEndIso: dayEnd.toISOString(),
  };
}

class BookingService {
  getBookingBlueprint() {
    return {
      bookingKinds: ["appointment", "package", "stay"],
      holdWindowMinutes: HOLD_WINDOW_MINUTES,
      flow: [
        "browse_services",
        "choose_slot",
        "create_hold",
        "pay_with_paystack",
        "verify_payment",
        "confirm_booking",
      ],
    };
  }

  private assertSupabase() {
    if (!supabaseAdmin) {
      throw new HttpError(
        503,
        "Supabase admin access is not configured on the server.",
      );
    }
    return supabaseAdmin;
  }

  private async fetchService(serviceId: string) {
    const client = this.assertSupabase();

    const { data: service, error: serviceError } = await client
      .from("services")
      .select(
        "id, name, booking_kind, is_active, base_price_kobo, duration_minutes, min_stay_days, max_stay_days",
      )
      .eq("id", serviceId)
      .maybeSingle<ServiceRecord>();

    if (serviceError || !service) {
      throw new HttpError(
        serviceError?.code === "PGRST205" ? 503 : 404,
        serviceError?.code === "PGRST205"
          ? "The Supabase database schema has not been applied to the hosted project yet."
          : "The selected service is not available.",
        serviceError?.message,
      );
    }

    if (!service.is_active) {
      throw new HttpError(404, "The selected service is not available.");
    }

    return service;
  }

  private async findOrCreateClient(clientInput: BookingClientInput) {
    const client = this.assertSupabase();

    const { data: existingClient, error: lookupError } = await client
      .from("clients")
      .select("id")
      .eq("email", clientInput.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError && lookupError.code !== "PGRST116") {
      throw new HttpError(500, "Unable to load the client record.", lookupError.message);
    }

    if (existingClient?.id) {
      return existingClient.id;
    }

    const { data: createdClient, error: clientError } = await client
      .from("clients")
      .insert({
        full_name: clientInput.fullName,
        email: clientInput.email,
        phone: clientInput.phone,
        notes: clientInput.notes ?? null,
      })
      .select("id")
      .single();

    if (clientError || !createdClient) {
      throw new HttpError(500, "Unable to create the client record.", clientError?.message);
    }

    return createdClient.id;
  }

  async getAvailability({ serviceId, date }: AvailabilityQuery) {
    const client = this.assertSupabase();
    const service = await this.fetchService(serviceId);

    if (service.booking_kind === "stay") {
      throw new HttpError(
        400,
        "Stay-based services use a date-range intake flow instead of timed slot availability.",
      );
    }

    const weekday = getWeekday(date);
    const { dayStartIso, dayEndIso } = getDayBounds(date);

    const [
      { data: windows, error: windowsError },
      { data: blockedSlots, error: blockedError },
      { data: conflictingHolds, error: holdsError },
      { data: conflictingBookings, error: bookingsError },
    ] = await Promise.all([
      client
        .from("availability_windows")
        .select("start_time, end_time, slot_length_minutes")
        .eq("service_id", serviceId)
        .eq("weekday", weekday)
        .order("start_time", { ascending: true }),
      client
        .from("blocked_slots")
        .select("starts_at, ends_at")
        .eq("service_id", serviceId)
        .lt("starts_at", dayEndIso)
        .gt("ends_at", dayStartIso),
      client
        .from("slot_holds")
        .select("starts_at, ends_at, expires_at")
        .eq("service_id", serviceId)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .lt("starts_at", dayEndIso)
        .gt("ends_at", dayStartIso),
      client
        .from("bookings")
        .select("slot_starts_at, slot_ends_at")
        .eq("service_id", serviceId)
        .in("status", [...ACTIVE_BOOKING_STATUSES])
        .lt("slot_starts_at", dayEndIso)
        .gt("slot_ends_at", dayStartIso),
    ]);

    const queryError =
      windowsError ?? blockedError ?? holdsError ?? bookingsError;

    if (queryError) {
      throw new HttpError(500, "Unable to load availability.", queryError.message);
    }

    const slots =
      (windows as AvailabilityWindowRow[] | null)?.flatMap((window) => {
        const slotsForWindow: Array<{
          startsAt: string;
          endsAt: string;
          label: string;
        }> = [];

        const slotLength = window.slot_length_minutes || service.duration_minutes || 60;
        let cursor = toLagosDateTime(date, window.start_time);
        const windowEnd = toLagosDateTime(date, window.end_time);

        while (cursor.getTime() + slotLength * 60_000 <= windowEnd.getTime()) {
          const slotStart = new Date(cursor);
          const slotEnd = new Date(cursor.getTime() + slotLength * 60_000);

          const overlapsBlocked = (blockedSlots ?? []).some(
            (item) =>
              new Date(item.starts_at).getTime() < slotEnd.getTime() &&
              new Date(item.ends_at).getTime() > slotStart.getTime(),
          );
          const overlapsHold = (conflictingHolds ?? []).some(
            (item) =>
              new Date(item.starts_at).getTime() < slotEnd.getTime() &&
              new Date(item.ends_at).getTime() > slotStart.getTime(),
          );
          const overlapsBooking = (conflictingBookings ?? []).some(
            (item) =>
              new Date(item.slot_starts_at).getTime() < slotEnd.getTime() &&
              new Date(item.slot_ends_at).getTime() > slotStart.getTime(),
          );

          if (!overlapsBlocked && !overlapsHold && !overlapsBooking) {
            slotsForWindow.push({
              startsAt: slotStart.toISOString(),
              endsAt: slotEnd.toISOString(),
              label: `${formatTimeLabel(slotStart)} - ${formatTimeLabel(slotEnd)}`,
            });
          }

          cursor = new Date(cursor.getTime() + slotLength * 60_000);
        }

        return slotsForWindow;
      }) ?? [];

    return {
      serviceId,
      date,
      timezone: "Africa/Lagos",
      slots,
    };
  }

  async reserveSlot(input: ReserveBookingInput) {
    if (input.mode === "stay") {
      return this.reserveStay(input);
    }

    return this.reserveTimedBooking(input);
  }

  private async reserveTimedBooking(input: ReserveTimedBookingInput) {
    const client = this.assertSupabase();
    const service = await this.fetchService(input.serviceId);
    const expiresAt = new Date(
      Date.now() + HOLD_WINDOW_MINUTES * 60_000,
    ).toISOString();

    if (service.booking_kind === "stay") {
      throw new HttpError(
        400,
        "Stay-based services need a dedicated check-in/check-out flow and cannot use timed slot reservation.",
      );
    }

    const clientId = await this.findOrCreateClient(input.client);

    let totalAmountKobo = service.base_price_kobo * input.quantity;
    let selectedPackage:
      | { id: string; label: string; package_price_kobo: number }
      | null = null;

    if (service.booking_kind === "package") {
      if (!input.packageId) {
        throw new HttpError(
          400,
          "Please choose one of the package options before reserving this service.",
        );
      }

      const { data: packageRow, error: packageError } = await client
        .from("service_packages")
        .select("id, label, package_price_kobo")
        .eq("id", input.packageId)
        .eq("service_id", input.serviceId)
        .maybeSingle();

      if (packageError || !packageRow) {
        throw new HttpError(
          404,
          "The selected package option could not be found.",
          packageError?.message,
        );
      }

      selectedPackage = packageRow;
      totalAmountKobo = packageRow.package_price_kobo * input.quantity;
    }

    const now = new Date().toISOString();

    const [{ data: conflictingHolds, error: holdsError }, { data: blockedSlots, error: blockedError }, { data: conflictingBookings, error: bookingsError }] =
      await Promise.all([
        client
          .from("slot_holds")
          .select("id")
          .eq("service_id", input.serviceId)
          .eq("status", "active")
          .gt("expires_at", now)
          .lt("starts_at", input.endsAt)
          .gt("ends_at", input.startsAt)
          .limit(1),
        client
          .from("blocked_slots")
          .select("id")
          .eq("service_id", input.serviceId)
          .lt("starts_at", input.endsAt)
          .gt("ends_at", input.startsAt)
          .limit(1),
        client
          .from("bookings")
          .select("id")
          .eq("service_id", input.serviceId)
          .in("status", [...ACTIVE_BOOKING_STATUSES])
          .lt("slot_starts_at", input.endsAt)
          .gt("slot_ends_at", input.startsAt)
          .limit(1),
      ]);

    const queryError = holdsError ?? blockedError ?? bookingsError;

    if (queryError) {
      throw new HttpError(
        queryError.code === "PGRST205" ? 503 : 500,
        queryError.code === "PGRST205"
          ? "The Supabase database schema has not been applied to the hosted project yet."
          : "Unable to validate availability for the selected time slot.",
        queryError.message,
      );
    }

    if ((conflictingHolds?.length ?? 0) > 0) {
      throw new HttpError(409, "That time slot is already being held by another customer.");
    }

    if ((blockedSlots?.length ?? 0) > 0) {
      throw new HttpError(409, "That time slot has been blocked by the admin team.");
    }

    if ((conflictingBookings?.length ?? 0) > 0) {
      throw new HttpError(409, "That time slot has already been booked.");
    }

    const { data: booking, error: bookingError } = await client
      .from("bookings")
      .insert({
        service_id: input.serviceId,
        client_id: clientId,
        booking_kind: service.booking_kind,
        status: "held",
        payment_status: "pending",
        slot_starts_at: input.startsAt,
        slot_ends_at: input.endsAt,
        quantity: input.quantity,
        total_amount_kobo: totalAmountKobo,
        metadata: {
          packageId: selectedPackage?.id,
          packageLabel: selectedPackage?.label,
          holdWindowMinutes: HOLD_WINDOW_MINUTES,
          prePayment: true,
        },
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      throw new HttpError(
        500,
        "Unable to create the booking draft in Supabase.",
        bookingError?.message,
      );
    }

    const { data: hold, error: insertError } = await client
      .from("slot_holds")
      .insert({
        service_id: input.serviceId,
        booking_id: booking.id,
        client_email: input.client.email,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        expires_at: expiresAt,
      })
      .select("id, expires_at")
      .single();

    if (insertError || !hold) {
      throw new HttpError(
        insertError?.code === "PGRST205" ? 503 : 500,
        insertError?.code === "PGRST205"
          ? "The Supabase database schema has not been applied to the hosted project yet."
          : "Unable to create the slot hold in Supabase.",
        insertError?.message,
      );
    }

    return {
      bookingId: booking.id,
      holdId: hold.id,
      expiresAt: hold.expires_at,
      status: "held" as const,
      integrationMode: "supabase-live",
      serviceName: service.name,
      amountKobo: totalAmountKobo,
      mode: "timed" as const,
      nextStep:
        "The booking is now reserved up to the payment step. Paystack can be plugged in next.",
      message: `A 10-minute hold was created for ${service.name}.`,
    };
  }

  private async reserveStay(input: ReserveStayBookingInput) {
    const client = this.assertSupabase();
    const service = await this.fetchService(input.serviceId);

    if (service.booking_kind !== "stay") {
      throw new HttpError(
        400,
        "This service uses a timed-slot flow rather than a stay booking flow.",
      );
    }

    const clientId = await this.findOrCreateClient(input.client);
    const checkIn = new Date(`${input.checkInDate}T00:00:00${LAGOS_OFFSET}`);
    const checkOut = new Date(`${input.checkOutDate}T00:00:00${LAGOS_OFFSET}`);
    const stayDays = Math.round(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (stayDays < (service.min_stay_days ?? 1) || stayDays > (service.max_stay_days ?? 365)) {
      throw new HttpError(
        400,
        `Recovery-home stays must be between ${service.min_stay_days} and ${service.max_stay_days} days.`,
      );
    }

    const estimatedAmountKobo = service.base_price_kobo * input.quantity;

    const { data: booking, error: bookingError } = await client
      .from("bookings")
      .insert({
        service_id: input.serviceId,
        client_id: clientId,
        booking_kind: "stay",
        status: "pending",
        payment_status: "pending",
        check_in_date: input.checkInDate,
        check_out_date: input.checkOutDate,
        quantity: input.quantity,
        total_amount_kobo: estimatedAmountKobo,
        metadata: {
          stayDays,
          notes: input.client.notes ?? null,
          prePayment: true,
        },
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      throw new HttpError(
        500,
        "Unable to create the stay booking draft in Supabase.",
        bookingError?.message,
      );
    }

    return {
      bookingId: booking.id,
      status: "pending" as const,
      integrationMode: "supabase-live",
      serviceName: service.name,
      amountKobo: estimatedAmountKobo,
      mode: "stay" as const,
      nextStep:
        "The stay request is saved and ready for the payment step once Paystack is connected.",
      message: `A pre-payment stay request was created for ${service.name}.`,
    };
  }
}

export const bookingService = new BookingService();
