import { Router } from "express";
import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    name: "nuyu-server",
    status: "ok",
    env: {
      supabaseConfigured: Boolean(
        env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY,
      ),
      paystackConfigured: Boolean(env.PAYSTACK_SECRET_KEY),
      emailConfigured: Boolean(env.RESEND_API_KEY),
    },
  });
});
