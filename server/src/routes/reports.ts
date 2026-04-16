import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/require-admin.js";
import { adminPortalService } from "../services/admin-portal-service.js";

export const reportsRouter = Router();

const reportQuerySchema = z.object({
  period: z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),
  anchorDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

reportsRouter.use(requireAdmin);

reportsRouter.get("/overview", async (_req, res, next) => {
  try {
    const data = await adminPortalService.getDashboardData();

    res.json({
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
  } catch (error) {
    next(error);
  }
});

reportsRouter.get("/summary", async (req, res, next) => {
  try {
    const query = reportQuerySchema.parse(req.query);
    const data = await adminPortalService.getReportData(
      query.period,
      query.anchorDate,
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
});
