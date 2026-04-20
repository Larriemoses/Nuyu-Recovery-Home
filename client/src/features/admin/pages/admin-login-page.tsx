import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Input } from "../../../components/ui";
import { useAdminAuth } from "../context/admin-auth-provider";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    clearError,
    errorMessage,
    hasSupabase,
    isAdmin,
    signIn,
  } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string>();

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [isAdmin, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    setFormMessage(undefined);
    setIsSubmitting(true);

    const result = await signIn({ email, password });

    if (!result.ok) {
      setFormMessage(result.message ?? "Unable to sign in to the admin portal.");
    }

    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-10 lg:flex lg:items-center lg:justify-center">
      <section className="public-panel mx-auto w-full max-w-sm rounded-[1.9rem] p-5 sm:p-6">
        <div className="flex flex-col items-center text-center">
          <img
            src="/nuyu-logo.jpeg"
            alt="Nuyu Recovery Home logo"
            className="h-14 w-14 rounded-2xl border border-[var(--color-border-subtle)] object-cover"
          />
          <h1 className="display-font mt-4 text-[1.55rem] font-semibold leading-tight text-[var(--nuyu-ink)] sm:text-[1.75rem]">
            Nuyu Recovery Home
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--nuyu-muted)]">Admin login</p>
        </div>

        {!hasSupabase ? (
          <div className="mt-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-4 text-sm leading-6 text-[var(--nuyu-muted)]">
            Supabase auth is not configured in the client yet, so the login portal cannot open.
          </div>
        ) : null}

        {location.state && typeof location.state === "object" && "from" in location.state ? (
          <div className="mt-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-4 text-sm leading-6 text-[var(--nuyu-muted)]">
            Sign in to continue.
          </div>
        ) : null}

        {errorMessage || formMessage ? (
          <div className="mt-5 rounded-2xl border border-[color-mix(in_oklab,var(--color-danger)_28%,white)] bg-[color-mix(in_oklab,var(--color-danger)_10%,white)] p-4 text-sm leading-6 text-[var(--nuyu-muted)]">
            {formMessage ?? errorMessage}
          </div>
        ) : null}

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <Input
            label="Admin email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@nuyurecoveryhome.com"
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!hasSupabase}
            disabledReason="Supabase auth needs to be configured before admins can sign in."
            className="mt-2"
            fullWidth
          >
            {isSubmitting ? "Signing in..." : "Enter admin portal"}
          </Button>
        </form>
      </section>
    </div>
  );
}
