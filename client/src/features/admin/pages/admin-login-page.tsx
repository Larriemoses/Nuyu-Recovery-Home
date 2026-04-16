import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BrandMark } from "../../../components/layout/brand-mark";
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
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="glass-card grid w-full max-w-6xl gap-8 rounded-[2.5rem] p-6 sm:p-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[2rem] bg-[linear-gradient(180deg,rgba(47,93,50,0.94),rgba(35,72,38,0.95))] p-8 text-[var(--nuyu-cream)] sm:p-10">
          <BrandMark
            size="md"
            subtitle="The secure internal portal for bookings, reports, and recovery-stay operations"
            tone="inverse"
          />

          <div className="mt-10 space-y-5 text-sm leading-7 text-[rgba(247,243,232,0.84)]">
            <p>
              This portal is intentionally private. Only staff accounts that have
              been created and marked as admins can open the operations dashboard.
            </p>
            <p>
              Public clients should never see the dashboard link in the site navigation,
              and dashboard requests are protected again on the backend before data is returned.
            </p>
            <div className="rounded-[1.5rem] border border-[rgba(227,199,84,0.18)] bg-[rgba(247,243,232,0.08)] p-5">
              <p className="font-semibold text-[var(--nuyu-gold)]">Admin setup</p>
              <p className="mt-3">
                Provision private credentials with the server bootstrap command, then
                sign in here with that email and password.
              </p>
              <p className="mt-3 font-mono text-xs text-[rgba(247,243,232,0.9)]">
                npm run admin:create -- --email admin@example.com --password your-password --name "Admin Name"
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-[rgba(255,255,255,0.72)] p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--nuyu-gold)]">
            Admin Login
          </p>
          <h1 className="display-font mt-4 text-3xl font-semibold text-[var(--nuyu-ink)]">
            Sign in to the private Nuyu operations dashboard
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--nuyu-muted)]">
            Use the unique credentials that were provisioned for the Nuyu admin team.
          </p>

          {!hasSupabase ? (
            <div className="mt-6 rounded-[1.5rem] border border-[rgba(47,93,50,0.1)] bg-[var(--nuyu-cream)] p-5 text-sm leading-6 text-[var(--nuyu-muted)]">
              Supabase auth is not configured in the client yet, so the login portal
              cannot open.
            </div>
          ) : null}

          {location.state && typeof location.state === "object" && "from" in location.state ? (
            <div className="mt-6 rounded-[1.5rem] border border-[rgba(47,93,50,0.1)] bg-[var(--nuyu-cream)] p-5 text-sm leading-6 text-[var(--nuyu-muted)]">
              Sign in first to continue to the protected admin page.
            </div>
          ) : null}

          {errorMessage || formMessage ? (
            <div className="mt-6 rounded-[1.5rem] border border-[rgba(47,93,50,0.12)] bg-white/85 p-5 text-sm leading-6 text-[var(--nuyu-muted)]">
              {formMessage ?? errorMessage}
            </div>
          ) : null}

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
              Admin email
              <input
                className="rounded-2xl border border-[rgba(47,93,50,0.1)] bg-white/90 px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@nuyu.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
              Password
              <input
                className="rounded-2xl border border-[rgba(47,93,50,0.1)] bg-white/90 px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </label>

            <button
              type="submit"
              className="mt-2 rounded-full bg-[var(--nuyu-primary)] px-6 py-3 text-sm font-semibold text-[var(--nuyu-cream)] transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !hasSupabase}
            >
              {isSubmitting ? "Signing in..." : "Enter admin portal"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
