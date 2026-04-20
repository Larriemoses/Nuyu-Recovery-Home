import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { HttpError } from "./lib/http-error.js";
import { adminRouter } from "./routes/admin.js";
import { bookingsRouter } from "./routes/bookings.js";
import { healthRouter } from "./routes/health.js";
import { paymentsRouter } from "./routes/payments.js";
import { reportsRouter } from "./routes/reports.js";

function getAllowedOrigins() {
  const configuredOrigins = [
    env.CLIENT_URL,
    ...(env.CLIENT_URLS
      ? env.CLIENT_URLS.split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : []),
  ];

  return new Set(configuredOrigins);
}

function isAllowedDevelopmentOrigin(origin: string) {
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

export function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.has(origin) || isAllowedDevelopmentOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(
          new HttpError(
            403,
            `Origin ${origin} is not allowed to access this server.`,
          ),
        );
      },
    }),
  );
  app.use(express.json());

  app.use("/api/health", healthRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/bookings", bookingsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/reports", reportsRouter);

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed.",
        issues: error.flatten(),
      });
    }

    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        message: error.message,
        details: error.details,
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  });

  return app;
}
