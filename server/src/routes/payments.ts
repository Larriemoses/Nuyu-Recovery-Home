import { Router } from "express";
import { z } from "zod";
import { paymentService } from "../services/payment-service.js";

const verifyPaymentSchema = z.object({
  reference: z.string().min(6),
});

export const paymentsRouter = Router();

paymentsRouter.post("/verify", async (req, res, next) => {
  try {
    const payload = verifyPaymentSchema.parse(req.body);
    const result = await paymentService.verifyPayment(payload.reference);

    res.json(result);
  } catch (error) {
    next(error);
  }
});
