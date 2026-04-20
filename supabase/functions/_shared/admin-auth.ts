import { createAdminClient } from "./supabase-admin.ts";
import { HttpError } from "./http-error.ts";

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: "admin";
};

export async function requireAdminUser(request: Request): Promise<AdminUser> {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "Admin authentication is required.");
  }

  const accessToken = authorization.slice("Bearer ".length).trim();

  if (!accessToken) {
    throw new HttpError(401, "Admin authentication is required.");
  }

  const supabase = createAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !userData.user) {
    throw new HttpError(
      401,
      "Your admin session is invalid or has expired.",
      userError?.message,
    );
  }

  const { data: profile, error: profileError } = await supabase
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

  return {
    id: profile.id,
    email: userData.user.email ?? "",
    fullName:
      profile.full_name ||
      String(userData.user.user_metadata.full_name ?? "Nuyu Admin"),
    role: "admin",
  };
}
