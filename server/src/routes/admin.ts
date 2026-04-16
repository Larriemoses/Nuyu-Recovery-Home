import { Router } from "express";
import { readAdminUser, requireAdmin } from "../middleware/require-admin.js";
import { adminPortalService } from "../services/admin-portal-service.js";

export const adminRouter = Router();

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
