import { env } from "../config/env.js";
import { supabaseAdmin } from "../lib/supabase/admin-client.js";
import { HttpError } from "../lib/http-error.js";

type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  booking_kind: "appointment" | "package" | "stay";
  is_active: boolean;
  base_price_kobo: number;
  duration_minutes: number | null;
  min_stay_days: number | null;
  max_stay_days: number | null;
  sort_order: number;
  service_packages:
    | Array<{
        id: string;
        label: string;
        sessions_count: number;
        package_price_kobo: number;
      }>
    | null;
  availability_windows:
    | Array<{
        id: string;
        weekday: number;
        start_time: string;
        end_time: string;
        slot_length_minutes: number;
        capacity: number;
      }>
    | null;
};

type BookingRow = {
  id: string;
  service_id: string;
  client_id: string;
  booking_kind: "appointment" | "package" | "stay";
  status: "pending" | "held" | "confirmed" | "cancelled" | "completed";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  total_amount_kobo: number;
  quantity: number;
  paystack_reference: string | null;
  slot_starts_at: string | null;
  slot_ends_at: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type HoldRow = {
  id: string;
  service_id: string;
  booking_id: string | null;
  client_email: string;
  starts_at: string;
  ends_at: string;
  expires_at: string;
  status: "active" | "released" | "converted" | "expired";
  created_at: string;
};

type BlockedSlotRow = {
  id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
};

type ManualAvailabilitySlotRow = {
  id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
};

type ClientRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  notes: string | null;
  created_at: string;
};

type PaymentRow = {
  id: string;
  booking_id: string;
  provider: string;
  provider_reference: string;
  amount_kobo: number;
  status: "pending" | "paid" | "failed" | "refunded";
  verified_at: string | null;
  created_at: string;
};

type CreateAvailabilityWindowInput = {
  serviceId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotLengthMinutes: number;
  capacity: number;
};

type CreateBlockedSlotInput = {
  serviceId: string;
  startsAt: string;
  endsAt: string;
  reason?: string;
};

type CreateManualAvailabilitySlotInput = {
  serviceId: string;
  startsAt: string;
  endsAt: string;
};

type PortalRows = {
  serviceRows: ServiceRow[];
  bookingRows: BookingRow[];
  holdRows: HoldRow[];
  blockedSlotRows: BlockedSlotRow[];
  manualAvailabilitySlotRows: ManualAvailabilitySlotRow[];
  clientRows: ClientRow[];
  paymentRows: PaymentRow[];
};

type AdminReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

const bookingKinds = ["appointment", "package", "stay"] as const;
const bookingStatuses = [
  "pending",
  "held",
  "confirmed",
  "cancelled",
  "completed",
] as const;

function requireSupabase() {
  if (!supabaseAdmin) {
    throw new HttpError(503, "Supabase admin access is not configured.");
  }

  return supabaseAdmin;
}

function isMissingRelationError(error?: { code?: string } | null) {
  return error?.code === "PGRST205";
}

function sumValues<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((sum, item) => sum + getValue(item), 0);
}

function sumBookingAmounts(items: BookingRow[]) {
  return sumValues(items, (item) => item.total_amount_kobo);
}

function sumPaymentAmounts(items: PaymentRow[]) {
  return sumValues(items, (item) => item.amount_kobo);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function getStartOfWeek(date: Date) {
  const start = startOfDay(date);
  const weekday = start.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  return addDays(start, offset);
}

function formatDateOnly(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(date);
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseAnchorDate(value?: string) {
  if (!value) {
    return startOfDay(new Date());
  }

  const [year, month, day] = value.split("-").map((part) => Number(part));

  if (!year || !month || !day) {
    throw new HttpError(400, "Anchor date must use the YYYY-MM-DD format.");
  }

  const parsedDate = new Date(year, month - 1, day);

  if (formatDateInput(parsedDate) !== value) {
    throw new HttpError(400, "Anchor date must be a real calendar date.");
  }

  return parsedDate;
}

function normalizeTimeInput(value: string) {
  const trimmed = value.trim();

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    throw new HttpError(400, "Time values must use the HH:MM or HH:MM:SS format.");
  }

  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

function getTimeValue(value: string) {
  const [hours, minutes, seconds] = value.split(":").map((item) => Number(item));
  return hours * 3600 + minutes * 60 + seconds;
}

function getLagosDateKey(value: Date) {
  return new Date(value.getTime() + 60 * 60_000).toISOString().slice(0, 10);
}

function isWithinRange(
  value: string | null | undefined,
  startsAt: Date,
  endsAtExclusive: Date,
) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return false;
  }

  return date >= startsAt && date < endsAtExclusive;
}

function createReportWindow(period: AdminReportPeriod, anchorDateInput?: string) {
  const anchorDate = startOfDay(parseAnchorDate(anchorDateInput));

  switch (period) {
    case "daily": {
      const startsAt = anchorDate;
      const endsAtExclusive = addDays(startsAt, 1);

      return {
        anchorDate: formatDateInput(anchorDate),
        startsAt,
        endsAtExclusive,
        label: `Daily report for ${formatDateOnly(startsAt)}`,
      };
    }
    case "weekly": {
      const startsAt = getStartOfWeek(anchorDate);
      const endsAtExclusive = addDays(startsAt, 7);
      const inclusiveEnd = addDays(endsAtExclusive, -1);

      return {
        anchorDate: formatDateInput(anchorDate),
        startsAt,
        endsAtExclusive,
        label: `Weekly report from ${formatDateOnly(startsAt)} to ${formatDateOnly(
          inclusiveEnd,
        )}`,
      };
    }
    case "monthly": {
      const startsAt = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
      const endsAtExclusive = addMonths(startsAt, 1);
      const inclusiveEnd = addDays(endsAtExclusive, -1);

      return {
        anchorDate: formatDateInput(anchorDate),
        startsAt,
        endsAtExclusive,
        label: `Monthly report for ${startsAt.toLocaleString("en-NG", {
          month: "long",
          year: "numeric",
        })} (${formatDateOnly(startsAt)} to ${formatDateOnly(inclusiveEnd)})`,
      };
    }
    case "yearly": {
      const startsAt = new Date(anchorDate.getFullYear(), 0, 1);
      const endsAtExclusive = addYears(startsAt, 1);
      const inclusiveEnd = addDays(endsAtExclusive, -1);

      return {
        anchorDate: formatDateInput(anchorDate),
        startsAt,
        endsAtExclusive,
        label: `Yearly report for ${startsAt.getFullYear()} (${formatDateOnly(
          startsAt,
        )} to ${formatDateOnly(inclusiveEnd)})`,
      };
    }
  }
}

export class AdminPortalService {
  private async loadPortalRows(): Promise<PortalRows> {
    const client = requireSupabase();

    const [
      { data: services, error: servicesError },
      { data: bookings, error: bookingsError },
      { data: holds, error: holdsError },
      { data: blockedSlots, error: blockedSlotsError },
      { data: manualAvailabilitySlots, error: manualAvailabilitySlotsError },
      { data: clients, error: clientsError },
      { data: payments, error: paymentsError },
    ] = await Promise.all([
      client
        .from("services")
        .select(
          "id, slug, name, summary, booking_kind, is_active, base_price_kobo, duration_minutes, min_stay_days, max_stay_days, sort_order, service_packages ( id, label, sessions_count, package_price_kobo ), availability_windows ( id, weekday, start_time, end_time, slot_length_minutes, capacity )",
        )
        .order("sort_order", { ascending: true }),
      client
        .from("bookings")
        .select(
          "id, service_id, client_id, booking_kind, status, payment_status, total_amount_kobo, quantity, paystack_reference, slot_starts_at, slot_ends_at, check_in_date, check_out_date, metadata, created_at",
        )
        .order("created_at", { ascending: false }),
      client
        .from("slot_holds")
        .select("id, service_id, booking_id, client_email, starts_at, ends_at, expires_at, status, created_at")
        .order("expires_at", { ascending: true }),
      client
        .from("blocked_slots")
        .select("id, service_id, starts_at, ends_at, reason, created_at")
        .order("starts_at", { ascending: true }),
      client
        .from("manual_availability_slots")
        .select("id, service_id, starts_at, ends_at, created_at")
        .order("starts_at", { ascending: true }),
      client
        .from("clients")
        .select("id, full_name, email, phone, notes, created_at")
        .order("created_at", { ascending: false }),
      client
        .from("payments")
        .select("id, booking_id, provider, provider_reference, amount_kobo, status, verified_at, created_at")
        .order("created_at", { ascending: false }),
    ]);

    const queryError =
      servicesError ??
      bookingsError ??
      holdsError ??
      blockedSlotsError ??
      (isMissingRelationError(manualAvailabilitySlotsError)
        ? null
        : manualAvailabilitySlotsError) ??
      clientsError ??
      paymentsError;

    if (queryError) {
      throw new HttpError(
        500,
        "Unable to load the admin dashboard data.",
        queryError.message,
      );
    }

    return {
      serviceRows: (services ?? []) as ServiceRow[],
      bookingRows: (bookings ?? []) as BookingRow[],
      holdRows: (holds ?? []) as HoldRow[],
      blockedSlotRows: (blockedSlots ?? []) as BlockedSlotRow[],
      manualAvailabilitySlotRows: isMissingRelationError(manualAvailabilitySlotsError)
        ? []
        : ((manualAvailabilitySlots ?? []) as ManualAvailabilitySlotRow[]),
      clientRows: (clients ?? []) as ClientRow[],
      paymentRows: (payments ?? []) as PaymentRow[],
    };
  }

  async getDashboardData() {
    const {
      serviceRows,
      bookingRows,
      holdRows,
      blockedSlotRows,
      manualAvailabilitySlotRows,
      clientRows,
      paymentRows,
    } = await this.loadPortalRows();

    const servicesById = new Map(serviceRows.map((item) => [item.id, item]));
    const clientsById = new Map(clientRows.map((item) => [item.id, item]));
    const bookingsByClientId = new Map<string, BookingRow[]>();

    for (const booking of bookingRows) {
      const current = bookingsByClientId.get(booking.client_id) ?? [];
      current.push(booking);
      bookingsByClientId.set(booking.client_id, current);
    }

    const paidOrConfirmedBookings = bookingRows.filter(
      (item) => item.payment_status === "paid" || item.status === "confirmed",
    );
    const activeHoldRows = holdRows.filter((item) => item.status === "active");

    const servicePerformance = serviceRows
      .map((service) => {
        const relatedBookings = bookingRows.filter((item) => item.service_id === service.id);
        const relatedHolds = activeHoldRows.filter((item) => item.service_id === service.id);

        return {
          serviceId: service.id,
          serviceName: service.name,
          bookingKind: service.booking_kind,
          bookingsCount: relatedBookings.length,
          heldCount: relatedBookings.filter((item) => item.status === "held").length,
          pendingCount: relatedBookings.filter((item) => item.status === "pending").length,
          estimatedValueKobo: sumBookingAmounts(relatedBookings),
          activeHoldsCount: relatedHolds.length,
        };
      })
      .sort((left, right) => right.bookingsCount - left.bookingsCount);

    return {
      setup: {
        supabaseConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
        paystackConfigured: Boolean(env.PAYSTACK_SECRET_KEY),
        emailConfigured: Boolean(env.RESEND_API_KEY),
      },
      metrics: {
        servicesCount: serviceRows.length,
        activeServicesCount: serviceRows.filter((item) => item.is_active).length,
        totalBookings: bookingRows.length,
        pendingBookings: bookingRows.filter((item) => item.status === "pending").length,
        heldBookings: bookingRows.filter((item) => item.status === "held").length,
        confirmedBookings: bookingRows.filter((item) => item.status === "confirmed").length,
        activeHolds: activeHoldRows.length,
        totalRevenueKobo: sumBookingAmounts(paidOrConfirmedBookings),
        totalClients: clientRows.length,
        stayRequests: bookingRows.filter((item) => item.booking_kind === "stay").length,
      },
      recentBookings: bookingRows.slice(0, 8).map((booking) => ({
        id: booking.id,
        serviceName: servicesById.get(booking.service_id)?.name ?? "Unknown service",
        clientName: clientsById.get(booking.client_id)?.full_name ?? "Unknown client",
        clientEmail: clientsById.get(booking.client_id)?.email ?? null,
        bookingKind: booking.booking_kind,
        status: booking.status,
        paymentStatus: booking.payment_status,
        totalAmountKobo: booking.total_amount_kobo,
        slotStartsAt: booking.slot_starts_at,
        slotEndsAt: booking.slot_ends_at,
        checkInDate: booking.check_in_date,
        checkOutDate: booking.check_out_date,
        createdAt: booking.created_at,
      })),
      activeHolds: activeHoldRows.slice(0, 8).map((hold) => ({
        id: hold.id,
        bookingId: hold.booking_id,
        serviceName: servicesById.get(hold.service_id)?.name ?? "Unknown service",
        clientEmail: hold.client_email,
        startsAt: hold.starts_at,
        endsAt: hold.ends_at,
        expiresAt: hold.expires_at,
      })),
      servicePerformance: servicePerformance.slice(0, 6),
      bookings: bookingRows.map((booking) => ({
        id: booking.id,
        serviceId: booking.service_id,
        serviceName: servicesById.get(booking.service_id)?.name ?? "Unknown service",
        clientId: booking.client_id,
        clientName: clientsById.get(booking.client_id)?.full_name ?? "Unknown client",
        clientEmail: clientsById.get(booking.client_id)?.email ?? null,
        clientPhone: clientsById.get(booking.client_id)?.phone ?? null,
        bookingKind: booking.booking_kind,
        status: booking.status,
        paymentStatus: booking.payment_status,
        totalAmountKobo: booking.total_amount_kobo,
        quantity: booking.quantity,
        paystackReference: booking.paystack_reference,
        slotStartsAt: booking.slot_starts_at,
        slotEndsAt: booking.slot_ends_at,
        checkInDate: booking.check_in_date,
        checkOutDate: booking.check_out_date,
        notes:
          typeof booking.metadata?.notes === "string" ? booking.metadata.notes : null,
        createdAt: booking.created_at,
      })),
      services: serviceRows.map((service) => {
        const relatedBookings = bookingRows.filter((item) => item.service_id === service.id);
        const nextBlockedSlot = blockedSlotRows.find((item) => item.service_id === service.id);

        return {
          id: service.id,
          slug: service.slug,
          name: service.name,
          summary: service.summary,
          bookingKind: service.booking_kind,
          isActive: service.is_active,
          basePriceKobo: service.base_price_kobo,
          durationMinutes: service.duration_minutes,
          minStayDays: service.min_stay_days,
          maxStayDays: service.max_stay_days,
          packages: service.service_packages ?? [],
          availabilityWindows: service.availability_windows ?? [],
          bookingsCount: relatedBookings.length,
          heldCount: relatedBookings.filter((item) => item.status === "held").length,
          pendingCount: relatedBookings.filter((item) => item.status === "pending").length,
          confirmedCount: relatedBookings.filter((item) => item.status === "confirmed").length,
          nextBlockedSlot: nextBlockedSlot
            ? {
                startsAt: nextBlockedSlot.starts_at,
                endsAt: nextBlockedSlot.ends_at,
                reason: nextBlockedSlot.reason,
              }
            : null,
        };
      }),
      clients: clientRows.map((item) => {
        const clientBookings = bookingsByClientId.get(item.id) ?? [];
        const lastBooking = clientBookings[0];

        return {
          id: item.id,
          fullName: item.full_name,
          email: item.email,
          phone: item.phone,
          notes: item.notes,
          createdAt: item.created_at,
          totalBookings: clientBookings.length,
          heldBookings: clientBookings.filter((booking) => booking.status === "held").length,
          pendingBookings: clientBookings.filter((booking) => booking.status === "pending").length,
          totalQuotedKobo: sumBookingAmounts(clientBookings),
          totalPaidKobo: sumBookingAmounts(
            clientBookings.filter(
              (booking) =>
                booking.payment_status === "paid" || booking.status === "confirmed",
            ),
          ),
          latestBookingAt: lastBooking?.created_at ?? null,
          latestServiceName: lastBooking
            ? servicesById.get(lastBooking.service_id)?.name ?? "Unknown service"
            : null,
        };
      }),
      operations: {
        blockedSlots: blockedSlotRows.map((item) => ({
          id: item.id,
          serviceId: item.service_id,
          serviceName: servicesById.get(item.service_id)?.name ?? "Unknown service",
          startsAt: item.starts_at,
          endsAt: item.ends_at,
          reason: item.reason,
          createdAt: item.created_at,
        })),
        manualAvailabilitySlots: manualAvailabilitySlotRows.map((item) => ({
          id: item.id,
          serviceId: item.service_id,
          serviceName: servicesById.get(item.service_id)?.name ?? "Unknown service",
          startsAt: item.starts_at,
          endsAt: item.ends_at,
          createdAt: item.created_at,
        })),
        availabilityWindows: serviceRows.flatMap((service) =>
          (service.availability_windows ?? []).map((window) => ({
            id: window.id,
            serviceId: service.id,
            serviceName: service.name,
            weekday: window.weekday,
            startTime: window.start_time,
            endTime: window.end_time,
            slotLengthMinutes: window.slot_length_minutes,
            capacity: window.capacity,
          })),
        ),
        activeHolds: activeHoldRows.map((item) => ({
          id: item.id,
          serviceId: item.service_id,
          serviceName: servicesById.get(item.service_id)?.name ?? "Unknown service",
          clientEmail: item.client_email,
          startsAt: item.starts_at,
          endsAt: item.ends_at,
          expiresAt: item.expires_at,
          bookingId: item.booking_id,
        })),
        payments: paymentRows.map((item) => ({
          id: item.id,
          bookingId: item.booking_id,
          provider: item.provider,
          reference: item.provider_reference,
          amountKobo: item.amount_kobo,
          status: item.status,
          verifiedAt: item.verified_at,
          createdAt: item.created_at,
        })),
        paymentSummary: {
          totalRecords: paymentRows.length,
          pendingCount: paymentRows.filter((item) => item.status === "pending").length,
          paidCount: paymentRows.filter((item) => item.status === "paid").length,
          failedCount: paymentRows.filter((item) => item.status === "failed").length,
          refundedCount: paymentRows.filter((item) => item.status === "refunded").length,
          verifiedAmountKobo: sumPaymentAmounts(
            paymentRows.filter((item) => item.status === "paid"),
          ),
        },
        bookingStatusSummary: [
          "pending",
          "held",
          "confirmed",
          "cancelled",
          "completed",
        ].map((status) => ({
          status,
          count: bookingRows.filter((item) => item.status === status).length,
        })),
      },
    };
  }

  async createAvailabilityWindow(input: CreateAvailabilityWindowInput) {
    const client = requireSupabase();

    const service = await this.fetchServiceForAdmin(input.serviceId);

    if (service.booking_kind === "stay") {
      throw new HttpError(
        400,
        "Recovery-home stay services do not use timed availability windows.",
      );
    }

    const startTime = normalizeTimeInput(input.startTime);
    const endTime = normalizeTimeInput(input.endTime);

    if (getTimeValue(startTime) >= getTimeValue(endTime)) {
      throw new HttpError(400, "The end time must be later than the start time.");
    }

    const windowLengthMinutes =
      (getTimeValue(endTime) - getTimeValue(startTime)) / 60;

    if (input.slotLengthMinutes > windowLengthMinutes) {
      throw new HttpError(
        400,
        "The slot length must fit inside the available time window.",
      );
    }

    const { data: existingWindows, error: existingWindowsError } = await client
      .from("availability_windows")
      .select("id, start_time, end_time")
      .eq("service_id", input.serviceId)
      .eq("weekday", input.weekday);

    if (existingWindowsError) {
      throw new HttpError(
        500,
        "Unable to validate the existing availability windows.",
        existingWindowsError.message,
      );
    }

    const overlapsExistingWindow = (existingWindows ?? []).some((window) => {
      const existingStart = getTimeValue(window.start_time);
      const existingEnd = getTimeValue(window.end_time);
      const nextStart = getTimeValue(startTime);
      const nextEnd = getTimeValue(endTime);

      return nextStart < existingEnd && nextEnd > existingStart;
    });

    if (overlapsExistingWindow) {
      throw new HttpError(
        409,
        "This time range overlaps an existing availability window for the same day.",
      );
    }

    const { data: createdWindow, error: createWindowError } = await client
      .from("availability_windows")
      .insert({
        service_id: input.serviceId,
        weekday: input.weekday,
        start_time: startTime,
        end_time: endTime,
        slot_length_minutes: input.slotLengthMinutes,
        capacity: input.capacity,
      })
      .select(
        "id, service_id, weekday, start_time, end_time, slot_length_minutes, capacity",
      )
      .single();

    if (createWindowError || !createdWindow) {
      throw new HttpError(
        500,
        "Unable to create the new availability window.",
        createWindowError?.message,
      );
    }

    return {
      message: `Added a new availability window for ${service.name}.`,
      window: {
        id: createdWindow.id,
        serviceId: createdWindow.service_id,
        serviceName: service.name,
        weekday: createdWindow.weekday,
        startTime: createdWindow.start_time,
        endTime: createdWindow.end_time,
        slotLengthMinutes: createdWindow.slot_length_minutes,
        capacity: createdWindow.capacity,
      },
    };
  }

  async deleteAvailabilityWindow(windowId: string) {
    const client = requireSupabase();

    const { data: existingWindow, error: existingWindowError } = await client
      .from("availability_windows")
      .select("id, service_id")
      .eq("id", windowId)
      .maybeSingle();

    if (existingWindowError) {
      throw new HttpError(
        500,
        "Unable to load the availability window before deleting it.",
        existingWindowError.message,
      );
    }

    if (!existingWindow) {
      throw new HttpError(404, "That availability window could not be found.");
    }

    const service = await this.fetchServiceForAdmin(existingWindow.service_id);

    const { error: deleteWindowError } = await client
      .from("availability_windows")
      .delete()
      .eq("id", windowId);

    if (deleteWindowError) {
      throw new HttpError(
        500,
        "Unable to delete the availability window.",
        deleteWindowError.message,
      );
    }

    return {
      message: `Removed an availability window from ${service.name}.`,
    };
  }

  async createManualAvailabilitySlot(input: CreateManualAvailabilitySlotInput) {
    const client = requireSupabase();
    const service = await this.fetchServiceForAdmin(input.serviceId);

    if (service.booking_kind === "stay") {
      throw new HttpError(
        400,
        "Recovery-home stay services do not use one-off timed availability slots.",
      );
    }

    const startsAtDate = new Date(input.startsAt);
    const endsAtDate = new Date(input.endsAt);

    if (
      Number.isNaN(startsAtDate.valueOf()) ||
      Number.isNaN(endsAtDate.valueOf())
    ) {
      throw new HttpError(400, "Manual availability times must be valid ISO date-times.");
    }

    if (startsAtDate >= endsAtDate) {
      throw new HttpError(
        400,
        "The one-off available time must end after it starts.",
      );
    }

    if (startsAtDate <= new Date()) {
      throw new HttpError(
        400,
        "Please choose a future time before posting it to clients.",
      );
    }

    if (getLagosDateKey(startsAtDate) !== getLagosDateKey(endsAtDate)) {
      throw new HttpError(
        400,
        "One-off available times must stay within the same day.",
      );
    }

    const startsAtIso = startsAtDate.toISOString();
    const endsAtIso = endsAtDate.toISOString();

    const [
      { data: existingSlots, error: existingSlotsError },
      { data: existingBlocks, error: existingBlocksError },
      { data: conflictingHolds, error: conflictingHoldsError },
      { data: conflictingBookings, error: conflictingBookingsError },
    ] = await Promise.all([
      client
        .from("manual_availability_slots")
        .select("id")
        .eq("service_id", input.serviceId)
        .lt("starts_at", endsAtIso)
        .gt("ends_at", startsAtIso)
        .limit(1),
      client
        .from("blocked_slots")
        .select("id")
        .eq("service_id", input.serviceId)
        .lt("starts_at", endsAtIso)
        .gt("ends_at", startsAtIso)
        .limit(1),
      client
        .from("slot_holds")
        .select("id")
        .eq("service_id", input.serviceId)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .lt("starts_at", endsAtIso)
        .gt("ends_at", startsAtIso)
        .limit(1),
      client
        .from("bookings")
        .select("id")
        .eq("service_id", input.serviceId)
        .in("status", ["held", "confirmed"])
        .lt("slot_starts_at", endsAtIso)
        .gt("slot_ends_at", startsAtIso)
        .limit(1),
    ]);

    const validationError =
      existingSlotsError ??
      existingBlocksError ??
      conflictingHoldsError ??
      conflictingBookingsError;

    if (validationError) {
      throw new HttpError(
        isMissingRelationError(validationError) ? 503 : 500,
        isMissingRelationError(validationError)
          ? "The hosted Supabase project still needs the latest scheduling tables before manual availability can be posted."
          : "Unable to validate the one-off available time.",
        validationError.message,
      );
    }

    if ((existingSlots?.length ?? 0) > 0) {
      throw new HttpError(
        409,
        "This one-off available time overlaps another posted time for the same service.",
      );
    }

    if ((existingBlocks?.length ?? 0) > 0) {
      throw new HttpError(
        409,
        "This time overlaps a blocked period, so it cannot be posted to clients.",
      );
    }

    if ((conflictingHolds?.length ?? 0) > 0 || (conflictingBookings?.length ?? 0) > 0) {
      throw new HttpError(
        409,
        "This time is already reserved, so it cannot be posted as available.",
      );
    }

    const { data: createdSlot, error: createSlotError } = await client
      .from("manual_availability_slots")
      .insert({
        service_id: input.serviceId,
        starts_at: startsAtIso,
        ends_at: endsAtIso,
      })
      .select("id, service_id, starts_at, ends_at, created_at")
      .single();

    if (createSlotError || !createdSlot) {
      throw new HttpError(
        isMissingRelationError(createSlotError) ? 503 : 500,
        isMissingRelationError(createSlotError)
          ? "The hosted Supabase project still needs the latest scheduling tables before manual availability can be posted."
          : "Unable to post the one-off available time.",
        createSlotError?.message,
      );
    }

    return {
      message: `Posted a one-off available time for ${service.name}.`,
      manualAvailabilitySlot: {
        id: createdSlot.id,
        serviceId: createdSlot.service_id,
        serviceName: service.name,
        startsAt: createdSlot.starts_at,
        endsAt: createdSlot.ends_at,
        createdAt: createdSlot.created_at,
      },
    };
  }

  async deleteManualAvailabilitySlot(slotId: string) {
    const client = requireSupabase();

    const { data: existingSlot, error: existingSlotError } = await client
      .from("manual_availability_slots")
      .select("id, service_id")
      .eq("id", slotId)
      .maybeSingle();

    if (existingSlotError) {
      throw new HttpError(
        isMissingRelationError(existingSlotError) ? 503 : 500,
        isMissingRelationError(existingSlotError)
          ? "The hosted Supabase project still needs the latest scheduling tables before manual availability can be removed."
          : "Unable to load the one-off available time before deleting it.",
        existingSlotError.message,
      );
    }

    if (!existingSlot) {
      throw new HttpError(404, "That one-off available time could not be found.");
    }

    const service = await this.fetchServiceForAdmin(existingSlot.service_id);

    const { error: deleteSlotError } = await client
      .from("manual_availability_slots")
      .delete()
      .eq("id", slotId);

    if (deleteSlotError) {
      throw new HttpError(
        isMissingRelationError(deleteSlotError) ? 503 : 500,
        isMissingRelationError(deleteSlotError)
          ? "The hosted Supabase project still needs the latest scheduling tables before manual availability can be removed."
          : "Unable to delete the one-off available time.",
        deleteSlotError.message,
      );
    }

    return {
      message: `Removed a one-off available time from ${service.name}.`,
    };
  }

  async createBlockedSlot(input: CreateBlockedSlotInput) {
    const client = requireSupabase();
    const service = await this.fetchServiceForAdmin(input.serviceId);

    if (service.booking_kind === "stay") {
      throw new HttpError(
        400,
        "Recovery-home stay services do not use timed blocked slots in this admin flow yet.",
      );
    }

    const startsAtDate = new Date(input.startsAt);
    const endsAtDate = new Date(input.endsAt);

    if (
      Number.isNaN(startsAtDate.valueOf()) ||
      Number.isNaN(endsAtDate.valueOf())
    ) {
      throw new HttpError(400, "Blocked slot dates must be valid ISO date-times.");
    }

    if (startsAtDate >= endsAtDate) {
      throw new HttpError(
        400,
        "The blocked slot must end after it starts.",
      );
    }

    const { data: existingBlocks, error: existingBlocksError } = await client
      .from("blocked_slots")
      .select("id, starts_at, ends_at")
      .eq("service_id", input.serviceId)
      .lt("starts_at", endsAtDate.toISOString())
      .gt("ends_at", startsAtDate.toISOString());

    if (existingBlocksError) {
      throw new HttpError(
        500,
        "Unable to validate the current blocked slots.",
        existingBlocksError.message,
      );
    }

    if ((existingBlocks?.length ?? 0) > 0) {
      throw new HttpError(
        409,
        "This blocked time overlaps another blocked time for the same service.",
      );
    }

    const { data: createdBlock, error: createBlockError } = await client
      .from("blocked_slots")
      .insert({
        service_id: input.serviceId,
        starts_at: startsAtDate.toISOString(),
        ends_at: endsAtDate.toISOString(),
        reason: input.reason?.trim() || null,
      })
      .select("id, service_id, starts_at, ends_at, reason, created_at")
      .single();

    if (createBlockError || !createdBlock) {
      throw new HttpError(
        500,
        "Unable to create the blocked time.",
        createBlockError?.message,
      );
    }

    return {
      message: `Blocked a time range for ${service.name}.`,
      blockedSlot: {
        id: createdBlock.id,
        serviceId: createdBlock.service_id,
        serviceName: service.name,
        startsAt: createdBlock.starts_at,
        endsAt: createdBlock.ends_at,
        reason: createdBlock.reason,
        createdAt: createdBlock.created_at,
      },
    };
  }

  async deleteBlockedSlot(blockedSlotId: string) {
    const client = requireSupabase();

    const { data: existingBlock, error: existingBlockError } = await client
      .from("blocked_slots")
      .select("id, service_id")
      .eq("id", blockedSlotId)
      .maybeSingle();

    if (existingBlockError) {
      throw new HttpError(
        500,
        "Unable to load the blocked time before deleting it.",
        existingBlockError.message,
      );
    }

    if (!existingBlock) {
      throw new HttpError(404, "That blocked time could not be found.");
    }

    const service = await this.fetchServiceForAdmin(existingBlock.service_id);

    const { error: deleteBlockError } = await client
      .from("blocked_slots")
      .delete()
      .eq("id", blockedSlotId);

    if (deleteBlockError) {
      throw new HttpError(
        500,
        "Unable to delete the blocked time.",
        deleteBlockError.message,
      );
    }

    return {
      message: `Removed a blocked time from ${service.name}.`,
    };
  }

  async getReportData(period: AdminReportPeriod, anchorDateInput?: string) {
    const { serviceRows, bookingRows, holdRows, clientRows, paymentRows } =
      await this.loadPortalRows();

    const servicesById = new Map(serviceRows.map((item) => [item.id, item]));
    const clientsById = new Map(clientRows.map((item) => [item.id, item]));
    const activeHoldRows = holdRows.filter((item) => item.status === "active");
    const { anchorDate, startsAt, endsAtExclusive, label } = createReportWindow(
      period,
      anchorDateInput,
    );

    const bookingsInRange = bookingRows.filter((item) =>
      isWithinRange(item.created_at, startsAt, endsAtExclusive),
    );
    const clientsInRange = clientRows.filter((item) =>
      isWithinRange(item.created_at, startsAt, endsAtExclusive),
    );
    const paymentsInRange = paymentRows.filter((item) =>
      isWithinRange(item.created_at, startsAt, endsAtExclusive),
    );

    const paidOrConfirmedBookings = bookingsInRange.filter(
      (item) => item.payment_status === "paid" || item.status === "confirmed",
    );

    const serviceSummary = serviceRows
      .map((service) => {
        const relatedBookings = bookingsInRange.filter((item) => item.service_id === service.id);
        const paidBookings = relatedBookings.filter(
          (item) => item.payment_status === "paid" || item.status === "confirmed",
        );

        return {
          serviceId: service.id,
          serviceName: service.name,
          bookingKind: service.booking_kind,
          bookingsCount: relatedBookings.length,
          stayRequests: relatedBookings.filter((item) => item.booking_kind === "stay").length,
          quotedValueKobo: sumBookingAmounts(relatedBookings),
          paidValueKobo: sumBookingAmounts(paidBookings),
        };
      })
      .filter((item) => item.bookingsCount > 0)
      .sort((left, right) => {
        if (right.bookingsCount !== left.bookingsCount) {
          return right.bookingsCount - left.bookingsCount;
        }

        return right.quotedValueKobo - left.quotedValueKobo;
      });

    return {
      period,
      anchorDate,
      generatedAt: new Date().toISOString(),
      range: {
        label,
        startsAt: startsAt.toISOString(),
        endsAt: endsAtExclusive.toISOString(),
      },
      summary: {
        bookingsCreated: bookingsInRange.length,
        newClients: clientsInRange.length,
        pendingBookings: bookingsInRange.filter((item) => item.status === "pending").length,
        heldBookings: bookingsInRange.filter((item) => item.status === "held").length,
        confirmedBookings: bookingsInRange.filter((item) => item.status === "confirmed").length,
        completedBookings: bookingsInRange.filter((item) => item.status === "completed").length,
        cancelledBookings: bookingsInRange.filter((item) => item.status === "cancelled").length,
        stayRequests: bookingsInRange.filter((item) => item.booking_kind === "stay").length,
        activeHoldsNow: activeHoldRows.length,
        quotedValueKobo: sumBookingAmounts(bookingsInRange),
        paidValueKobo: sumBookingAmounts(paidOrConfirmedBookings),
      },
      bookingTypeSummary: bookingKinds.map((bookingKind) => {
        const items = bookingsInRange.filter((item) => item.booking_kind === bookingKind);

        return {
          bookingKind,
          count: items.length,
          quotedValueKobo: sumBookingAmounts(items),
        };
      }),
      statusSummary: bookingStatuses.map((status) => ({
        status,
        count: bookingsInRange.filter((item) => item.status === status).length,
      })),
      paymentSummary: {
        totalRecords: paymentsInRange.length,
        pendingCount: paymentsInRange.filter((item) => item.status === "pending").length,
        paidCount: paymentsInRange.filter((item) => item.status === "paid").length,
        failedCount: paymentsInRange.filter((item) => item.status === "failed").length,
        refundedCount: paymentsInRange.filter((item) => item.status === "refunded").length,
        verifiedAmountKobo: sumPaymentAmounts(
          paymentsInRange.filter((item) => item.status === "paid"),
        ),
      },
      serviceSummary,
      recentActivity: bookingsInRange.slice(0, 12).map((booking) => ({
        id: booking.id,
        createdAt: booking.created_at,
        serviceName: servicesById.get(booking.service_id)?.name ?? "Unknown service",
        clientName: clientsById.get(booking.client_id)?.full_name ?? "Unknown client",
        clientEmail: clientsById.get(booking.client_id)?.email ?? null,
        bookingKind: booking.booking_kind,
        status: booking.status,
        paymentStatus: booking.payment_status,
        totalAmountKobo: booking.total_amount_kobo,
      })),
      exportBookings: bookingsInRange.map((booking) => ({
        id: booking.id,
        createdAt: booking.created_at,
        serviceName: servicesById.get(booking.service_id)?.name ?? "Unknown service",
        clientName: clientsById.get(booking.client_id)?.full_name ?? "Unknown client",
        clientEmail: clientsById.get(booking.client_id)?.email ?? null,
        appliedOption:
          typeof booking.metadata?.packageLabel === "string"
            ? booking.metadata.packageLabel
            : null,
        bookingKind: booking.booking_kind,
        status: booking.status,
        paymentStatus: booking.payment_status,
        totalAmountKobo: booking.total_amount_kobo,
        paidAmountKobo:
          booking.payment_status === "paid" || booking.status === "confirmed"
            ? booking.total_amount_kobo
            : 0,
        slotStartsAt: booking.slot_starts_at,
        slotEndsAt: booking.slot_ends_at,
        checkInDate: booking.check_in_date,
        checkOutDate: booking.check_out_date,
      })),
    };
  }

  private async fetchServiceForAdmin(serviceId: string) {
    const client = requireSupabase();

    const { data: service, error: serviceError } = await client
      .from("services")
      .select("id, name, booking_kind")
      .eq("id", serviceId)
      .maybeSingle();

    if (serviceError) {
      throw new HttpError(
        500,
        "Unable to load the selected service.",
        serviceError.message,
      );
    }

    if (!service) {
      throw new HttpError(404, "The selected service could not be found.");
    }

    return service;
  }
}

export const adminPortalService = new AdminPortalService();
