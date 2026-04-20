import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAdminUser } from "../_shared/admin-auth.ts";
import {
  adminPortalService,
  type AdminReportPeriod,
} from "../_shared/admin-portal-service.ts";
import { bookingService, type ReserveBookingInput } from "../_shared/booking-service.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { HttpError } from "../_shared/http-error.ts";
import { handleError, jsonResponse, parseJsonBody } from "../_shared/http.ts";
import { verifyPayment } from "../_shared/payment-service.ts";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getRouteSegments(request: Request) {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  const functionIndex = parts.indexOf("app-api");

  return functionIndex >= 0 ? parts.slice(functionIndex + 1) : parts;
}

function ensureUuid(value: unknown, message: string) {
  if (typeof value !== "string" || !uuidPattern.test(value)) {
    throw new HttpError(400, message);
  }

  return value;
}

function ensureString(value: unknown, message: string, minLength = 1) {
  if (typeof value !== "string" || value.trim().length < minLength) {
    throw new HttpError(400, message);
  }

  return value.trim();
}

function ensureInteger(
  value: unknown,
  message: string,
  options?: { min?: number; max?: number },
) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new HttpError(400, message);
  }

  if (typeof options?.min === "number" && value < options.min) {
    throw new HttpError(400, message);
  }

  if (typeof options?.max === "number" && value > options.max) {
    throw new HttpError(400, message);
  }

  return value;
}

function ensureOptionalString(value: unknown, maxLength: number) {
  if (value == null || value === "") {
    return undefined;
  }

  if (typeof value !== "string" || value.length > maxLength) {
    throw new HttpError(400, `Text fields must be ${maxLength} characters or fewer.`);
  }

  return value;
}

function parseReserveBookingInput(payload: unknown): ReserveBookingInput {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "A booking request body is required.");
  }

  const input = payload as Record<string, unknown>;
  const client = input.client as Record<string, unknown> | undefined;

  if (!client || typeof client !== "object") {
    throw new HttpError(400, "Client details are required.");
  }

  const parsedClient = {
    fullName: ensureString(client.fullName, "Full name is required.", 2),
    email: ensureString(client.email, "A valid email is required.", 3),
    phone: ensureString(client.phone, "Phone number is required.", 7),
    notes: ensureOptionalString(client.notes, 500),
  };

  const quantity =
    typeof input.quantity === "number"
      ? ensureInteger(input.quantity, "Quantity must be at least 1.", { min: 1 })
      : 1;

  if (input.mode === "stay") {
    return {
      mode: "stay",
      serviceId: ensureUuid(input.serviceId, "A valid service is required."),
      checkInDate: ensureString(input.checkInDate, "Check-in date is required.", 10),
      checkOutDate: ensureString(input.checkOutDate, "Check-out date is required.", 10),
      client: parsedClient,
      quantity,
    };
  }

  if (input.mode === "timed") {
    return {
      mode: "timed",
      serviceId: ensureUuid(input.serviceId, "A valid service is required."),
      startsAt: ensureString(input.startsAt, "Start time is required.", 10),
      endsAt: ensureString(input.endsAt, "End time is required.", 10),
      packageId:
        typeof input.packageId === "string" && input.packageId.trim()
          ? input.packageId
          : undefined,
      client: parsedClient,
      quantity,
    };
  }

  throw new HttpError(400, "Booking mode must be either timed or stay.");
}

function parseReportPeriod(value: string | null): AdminReportPeriod {
  if (
    value === "daily" ||
    value === "weekly" ||
    value === "monthly" ||
    value === "yearly"
  ) {
    return value;
  }

  return "monthly";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const segments = getRouteSegments(request);
    const route = segments.join("/");
    const url = new URL(request.url);

    if (request.method === "GET" && route === "health") {
      return jsonResponse({
        name: "nuyu-supabase-api",
        status: "ok",
        env: {
          supabaseConfigured: Boolean(
            Deno.env.get("SUPABASE_URL") && Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
          ),
          paystackConfigured: Boolean(Deno.env.get("PAYSTACK_SECRET_KEY")),
          emailConfigured: Boolean(Deno.env.get("RESEND_API_KEY")),
        },
      });
    }

    if (request.method === "GET" && route === "bookings/flow") {
      return jsonResponse(bookingService.getBookingBlueprint());
    }

    if (request.method === "GET" && route === "bookings/availability") {
      const serviceId = ensureUuid(
        url.searchParams.get("serviceId"),
        "A valid serviceId query value is required.",
      );
      const date = ensureString(
        url.searchParams.get("date"),
        "A valid date query value is required.",
        10,
      );

      return jsonResponse(await bookingService.getAvailability({ serviceId, date }));
    }

    if (request.method === "POST" && route === "bookings/reserve") {
      const payload = parseReserveBookingInput(await parseJsonBody(request));
      return jsonResponse(await bookingService.reserveSlot(payload), 201);
    }

    if (request.method === "POST" && route === "payments/verify") {
      const payload = (await parseJsonBody<Record<string, unknown>>(request)) ?? {};
      const reference = ensureString(
        payload.reference,
        "A Paystack reference is required.",
        6,
      );

      return jsonResponse(verifyPayment(reference));
    }

    if (request.method === "GET" && route === "admin/session") {
      const user = await requireAdminUser(request);
      return jsonResponse({ user });
    }

    if (request.method === "GET" && route === "admin/dashboard") {
      await requireAdminUser(request);
      return jsonResponse(await adminPortalService.getDashboardData());
    }

    if (request.method === "POST" && route === "admin/availability-windows") {
      await requireAdminUser(request);
      const payload = (await parseJsonBody<Record<string, unknown>>(request)) ?? {};

      return jsonResponse(
        await adminPortalService.createAvailabilityWindow({
          serviceId: ensureUuid(payload.serviceId, "A valid service is required."),
          weekday: ensureInteger(payload.weekday, "Weekday must be between 0 and 6.", {
            min: 0,
            max: 6,
          }),
          startTime: ensureString(payload.startTime, "Start time is required.", 5),
          endTime: ensureString(payload.endTime, "End time is required.", 5),
          slotLengthMinutes: ensureInteger(
            payload.slotLengthMinutes,
            "Slot length must be between 15 and 480 minutes.",
            { min: 15, max: 480 },
          ),
          capacity: ensureInteger(payload.capacity, "Capacity must be between 1 and 20.", {
            min: 1,
            max: 20,
          }),
        }),
        201,
      );
    }

    if (
      request.method === "DELETE" &&
      segments[0] === "admin" &&
      segments[1] === "availability-windows" &&
      segments[2]
    ) {
      await requireAdminUser(request);
      return jsonResponse(
        await adminPortalService.deleteAvailabilityWindow(
          ensureUuid(segments[2], "A valid availability window id is required."),
        ),
      );
    }

    if (request.method === "POST" && route === "admin/manual-slots") {
      await requireAdminUser(request);
      const payload = (await parseJsonBody<Record<string, unknown>>(request)) ?? {};

      return jsonResponse(
        await adminPortalService.createManualAvailabilitySlot({
          serviceId: ensureUuid(payload.serviceId, "A valid service is required."),
          startsAt: ensureString(payload.startsAt, "Start time is required.", 10),
          endsAt: ensureString(payload.endsAt, "End time is required.", 10),
        }),
        201,
      );
    }

    if (
      request.method === "DELETE" &&
      segments[0] === "admin" &&
      segments[1] === "manual-slots" &&
      segments[2]
    ) {
      await requireAdminUser(request);
      return jsonResponse(
        await adminPortalService.deleteManualAvailabilitySlot(
          ensureUuid(segments[2], "A valid manual slot id is required."),
        ),
      );
    }

    if (request.method === "POST" && route === "admin/blocked-slots") {
      await requireAdminUser(request);
      const payload = (await parseJsonBody<Record<string, unknown>>(request)) ?? {};

      return jsonResponse(
        await adminPortalService.createBlockedSlot({
          serviceId: ensureUuid(payload.serviceId, "A valid service is required."),
          startsAt: ensureString(payload.startsAt, "Start time is required.", 10),
          endsAt: ensureString(payload.endsAt, "End time is required.", 10),
          reason: ensureOptionalString(payload.reason, 200),
        }),
        201,
      );
    }

    if (
      request.method === "DELETE" &&
      segments[0] === "admin" &&
      segments[1] === "blocked-slots" &&
      segments[2]
    ) {
      await requireAdminUser(request);
      return jsonResponse(
        await adminPortalService.deleteBlockedSlot(
          ensureUuid(segments[2], "A valid blocked slot id is required."),
        ),
      );
    }

    if (request.method === "GET" && route === "reports/overview") {
      await requireAdminUser(request);
      const data = await adminPortalService.getDashboardData();

      return jsonResponse({
        setup: data.setup,
        metrics: {
          servicesCount: data.metrics.servicesCount,
          activeServicesCount: data.metrics.activeServicesCount,
          totalBookings: data.metrics.totalBookings,
          pendingBookings: data.metrics.pendingBookings,
          heldBookings: data.metrics.heldBookings,
          activeHolds: data.metrics.activeHolds,
          totalRevenueKobo: data.metrics.totalRevenueKobo,
        },
        recentBookings: data.recentBookings,
        activeHolds: data.activeHolds,
        servicePerformance: data.servicePerformance,
      });
    }

    if (request.method === "GET" && route === "reports/summary") {
      await requireAdminUser(request);
      const period = parseReportPeriod(url.searchParams.get("period"));
      const anchorDate = url.searchParams.get("anchorDate") ?? undefined;

      return jsonResponse(await adminPortalService.getReportData(period, anchorDate));
    }

    throw new HttpError(404, "That API route could not be found.");
  } catch (error) {
    return handleError(error);
  }
});
