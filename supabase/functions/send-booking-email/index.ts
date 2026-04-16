import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

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

  if (!payload?.email || !payload?.bookingId) {
    return Response.json(
      { message: "email and bookingId are required." },
      { status: 400, headers: corsHeaders },
    );
  }

  return Response.json(
    {
      queued: false,
      message:
        "Email dispatch is scaffolded. Connect this function to Resend or Postmark once your transactional template is ready.",
    },
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
});

