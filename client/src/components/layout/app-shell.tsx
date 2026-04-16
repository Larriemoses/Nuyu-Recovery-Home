import { Link, NavLink, Outlet } from "react-router-dom";
import { BrandMark } from "./brand-mark";

const navigation = [
  { to: "/", label: "Home" },
  { to: "/booking", label: "Booking" },
];

export function AppShell() {
  return (
    <div className="dot-grid min-h-screen">
      <header className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <Link to="/" className="inline-flex">
          <BrandMark
            size="sm"
            subtitle="Private recovery stays, body treatments, and calm post-op support"
          />
        </Link>

        <nav className="glass-card flex items-center gap-2 rounded-full p-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-[var(--nuyu-primary)] text-[var(--nuyu-cream)] shadow-[0_12px_28px_rgba(35,72,38,0.16)]"
                    : "text-[var(--nuyu-muted)] hover:bg-white/70",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
