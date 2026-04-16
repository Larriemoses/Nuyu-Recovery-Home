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

  if (!payload?.reference) {
    return Response.json(
      { message: "A Paystack reference is required." },
      { status: 400, headers: corsHeaders },
    );
  }

  return Response.json(
    {
      reference: payload.reference,
      provider: "paystack",
      verified: false,
      message:
        "This Edge Function is scaffolded. Replace this response with a live Paystack verification request and booking confirmation update.",
    },
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
});

