import { Link, Outlet } from "react-router-dom";
import { PublicFooter } from "./public-footer";

export function AppShell() {
  return (
    <div className="nuyu-page-shell">
      <header className="nuyu-page-header px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link to="/" className="inline-flex">
            <div className="flex items-center gap-3">
              <img
                src="/nuyu-logo.jpeg"
                alt="Nuyu Recovery Home logo"
                className="h-12 w-12 rounded-2xl border border-[var(--color-border-subtle)] object-cover shadow-[0_14px_28px_rgba(17,24,19,0.08)]"
              />
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-gold)]">
                  Nuyu Recovery Home
                </p>
              </div>
            </div>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
}
