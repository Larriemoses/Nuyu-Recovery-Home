import { Router } from "express";
import { z } from "zod";
import { bookingService } from "../services/booking-service.js";

const bookingClientSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  notes: z.string().max(500).optional(),
});

const reserveSlotSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("timed"),
    serviceId: z.string().uuid(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    packageId: z.string().uuid().optional(),
    client: bookingClientSchema,
    quantity: z.number().int().min(1).default(1),
  }),
  z.object({
    mode: z.literal("stay"),
    serviceId: z.string().uuid(),
    checkInDate: z.string().date(),
    checkOutDate: z.string().date(),
    client: bookingClientSchema,
    quantity: z.number().int().min(1).default(1),
  }),
]);

const availabilityQuerySchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string().date(),
});

export const bookingsRouter = Router();

bookingsRouter.get("/flow", (_req, res) => {
  res.json(bookingService.getBookingBlueprint());
});

bookingsRouter.get("/availability", async (req, res, next) => {
  try {
    const query = availabilityQuerySchema.parse(req.query);
    const result = await bookingService.getAvailability(query);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

bookingsRouter.post("/reserve", async (req, res, next) => {
  try {
    const payload = reserveSlotSchema.parse(req.body);
    const result = await bookingService.reserveSlot(payload);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
