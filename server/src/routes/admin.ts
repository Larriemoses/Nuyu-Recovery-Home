import { Router } from "express";
import { z } from "zod";
import { readAdminUser, requireAdmin } from "../middleware/require-admin.js";
import { adminPortalService } from "../services/admin-portal-service.js";

export const adminRouter = Router();

const availabilityWindowSchema = z.object({
  serviceId: z.string().uuid(),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().min(5).max(8),
  endTime: z.string().min(5).max(8),
  slotLengthMinutes: z.number().int().min(15).max(480),
  capacity: z.number().int().min(1).max(20),
});

const blockedSlotSchema = z.object({
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  reason: z.string().max(200).optional(),
});

const manualAvailabilitySlotSchema = z.object({
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

const paramsIdSchema = z.object({
  id: z.string().uuid(),
});

adminRouter.get("/session", requireAdmin, (request, response) => {
  response.json({
    user: readAdminUser(request),
  });
});

adminRouter.get("/dashboard", requireAdmin, async (_request, response, next) => {
  try {
    const data = await adminPortalService.getDashboardData();

    response.json(data);
  } catch (error) {
    next(error);
  }
});

adminRouter.post(
  "/availability-windows",
  requireAdmin,
  async (request, response, next) => {
    try {
      const payload = availabilityWindowSchema.parse(request.body);
      const result = await adminPortalService.createAvailabilityWindow(payload);

      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

adminRouter.delete(
  "/availability-windows/:id",
  requireAdmin,
  async (request, response, next) => {
    try {
      const params = paramsIdSchema.parse(request.params);
      const result = await adminPortalService.deleteAvailabilityWindow(params.id);

      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

adminRouter.post("/manual-slots", requireAdmin, async (request, response, next) => {
  try {
    const payload = manualAvailabilitySlotSchema.parse(request.body);
    const result = await adminPortalService.createManualAvailabilitySlot(payload);

    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.delete(
  "/manual-slots/:id",
  requireAdmin,
  async (request, response, next) => {
    try {
      const params = paramsIdSchema.parse(request.params);
      const result = await adminPortalService.deleteManualAvailabilitySlot(params.id);

      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

adminRouter.post("/blocked-slots", requireAdmin, async (request, response, next) => {
  try {
    const payload = blockedSlotSchema.parse(request.body);
    const result = await adminPortalService.createBlockedSlot(payload);

    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.delete(
  "/blocked-slots/:id",
  requireAdmin,
  async (request, response, next) => {
    try {
      const params = paramsIdSchema.parse(request.params);
      const result = await adminPortalService.deleteBlockedSlot(params.id);

      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);
