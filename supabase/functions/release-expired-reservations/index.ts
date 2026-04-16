import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("slot_holds")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("expires_at", now)
    .select("id");

  if (error) {
    return Response.json(
      { message: "Unable to expire slot holds.", detail: error.message },
      { status: 500, headers: corsHeaders },
    );
  }

  return Response.json(
    {
      released: data?.length ?? 0,
      executedAt: now,
    },
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
});

