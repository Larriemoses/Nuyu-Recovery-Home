import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

const HOLD_WINDOW_MINUTES = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return Response.json(
      { message: "Method not allowed." },
      { status: 405, headers: corsHeaders },
    );
  }

  const payload = await req.json().catch(() => null);

  if (
    !payload?.serviceId ||
    !payload?.startsAt ||
    !payload?.endsAt ||
    !payload?.client?.email
  ) {
    return Response.json(
      { message: "Missing required reservation fields." },
      { status: 400, headers: corsHeaders },
    );
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: conflictingHolds, error: holdError } = await supabase
    .from("slot_holds")
    .select("id")
    .eq("service_id", payload.serviceId)
    .eq("status", "active")
    .gt("expires_at", now)
    .lt("starts_at", payload.endsAt)
    .gt("ends_at", payload.startsAt)
    .limit(1);

  if (holdError) {
    return Response.json(
      { message: "Unable to check active slot holds.", detail: holdError.message },
      { status: 500, headers: corsHeaders },
    );
  }

  const { data: conflictingBookings, error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("service_id", payload.serviceId)
    .in("status", ["held", "confirmed"])
    .lt("slot_starts_at", payload.endsAt)
    .gt("slot_ends_at", payload.startsAt)
    .limit(1);

  if (bookingError) {
    return Response.json(
      { message: "Unable to check booking conflicts.", detail: bookingError.message },
      { status: 500, headers: corsHeaders },
    );
  }

  if ((conflictingHolds?.length ?? 0) > 0 || (conflictingBookings?.length ?? 0) > 0) {
    return Response.json(
      { message: "That slot is no longer available." },
      { status: 409, headers: corsHeaders },
    );
  }

  const expiresAt = new Date(
    Date.now() + HOLD_WINDOW_MINUTES * 60_000,
  ).toISOString();

  const { data, error } = await supabase
    .from("slot_holds")
    .insert({
      service_id: payload.serviceId,
      client_email: payload.client.email,
      starts_at: payload.startsAt,
      ends_at: payload.endsAt,
      expires_at: expiresAt,
    })
    .select("id, expires_at")
    .single();

  if (error) {
    return Response.json(
      { message: "Unable to create slot hold.", detail: error.message },
      { status: 500, headers: corsHeaders },
    );
  }

  return Response.json(
    {
      holdId: data.id,
      expiresAt: data.expires_at,
      holdWindowMinutes: HOLD_WINDOW_MINUTES,
    },
    {
      status: 201,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
});

