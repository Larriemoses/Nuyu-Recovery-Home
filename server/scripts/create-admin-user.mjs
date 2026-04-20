import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";

config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env.");
  process.exit(1);
}

const argumentsMap = new Map();

for (let index = 2; index < process.argv.length; index += 1) {
  const current = process.argv[index];

  if (!current.startsWith("--")) {
    continue;
  }

  const key = current.slice(2);
  const value = process.argv[index + 1];

  if (!value || value.startsWith("--")) {
    argumentsMap.set(key, "true");
    continue;
  }

  argumentsMap.set(key, value);
  index += 1;
}

const email = String(argumentsMap.get("email") ?? "").trim().toLowerCase();
const password = String(argumentsMap.get("password") ?? "");
const fullName = String(argumentsMap.get("name") ?? "Nuyu Admin").trim();

if (!email || !password) {
  console.error(
    "Usage: npm run admin:create --workspace server -- --email admin@example.com --password your-password --name \"Admin Name\"",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findExistingUserByEmail(targetEmail) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const existingUser = data.users.find(
      (user) => user.email?.toLowerCase() === targetEmail,
    );

    if (existingUser) {
      return existingUser;
    }

    if (!data.users.length || data.users.length < 200) {
      return null;
    }

    page += 1;
  }
}

try {
  const existingUser = await findExistingUserByEmail(email);

  let userId = existingUser?.id;

  if (!existingUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error || !data.user) {
      throw error ?? new Error("Supabase did not return the new admin user.");
    }

    userId = data.user.id;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(existingUser.user_metadata ?? {}),
        full_name: fullName,
      },
    });

    if (error) {
      throw error;
    }
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    role: "admin",
  });

  if (profileError) {
    throw profileError;
  }

  console.log(`Admin access is ready for ${email}.`);
  console.log("Admin login URL: https://nuyurecovery.vercel.app/#/admin/login");
} catch (error) {
  console.error("Unable to create or promote the admin user.");
  console.error(error);
  process.exit(1);
}
