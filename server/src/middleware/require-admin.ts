import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase/admin-client.js";
import { HttpError } from "../lib/http-error.js";

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: "admin";
};

type AdminRequest = Request & {
  adminUser?: AdminUser;
};

export function readAdminUser(request: Request) {
  const adminUser = (request as AdminRequest).adminUser;

  if (!adminUser) {
    throw new HttpError(500, "Admin user details were not attached to the request.");
  }

  return adminUser;
}

export async function requireAdmin(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    if (!supabaseAdmin) {
      throw new HttpError(503, "Supabase admin access is not configured.");
    }

    const authorization = request.header("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      throw new HttpError(401, "Admin authentication is required.");
    }

    const accessToken = authorization.slice("Bearer ".length).trim();

    if (!accessToken) {
      throw new HttpError(401, "Admin authentication is required.");
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !userData.user) {
      throw new HttpError(
        401,
        "Your admin session is invalid or has expired.",
        userError?.message,
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "admin") {
      throw new HttpError(
        403,
        "This account is not authorized to access the admin portal.",
        profileError?.message,
      );
    }

    (request as AdminRequest).adminUser = {
      id: profile.id,
      email: userData.user.email ?? "",
      fullName:
        profile.full_name ||
        String(userData.user.user_metadata.full_name ?? "Nuyu Admin"),
      role: "admin",
    };

    next();
  } catch (error) {
    next(error);
  }
}
