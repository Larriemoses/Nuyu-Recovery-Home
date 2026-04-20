import { Fragment, useState, type PropsWithChildren } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCcw,
  Settings2,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button, Tooltip } from "../../../components/ui";
import { cn } from "../../../components/ui/helpers";
import { useAdminAuth } from "../context/admin-auth-provider";
import { useAdminPortal } from "../context/admin-portal-provider";

type NavigationItem = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type NavigationSection = {
  title: string;
  items: NavigationItem[];
};

const navigationSections: NavigationSection[] = [
  {
    title: "Overview",
    items: [
      {
        to: "/admin",
        label: "Dashboard",
        description: "See the story behind today's bookings and follow-ups",
        icon: LayoutDashboard,
      },
      {
        to: "/admin/bookings",
        label: "Bookings",
        description: "Review new requests and move people forward with confidence",
        icon: CalendarDays,
      },
    ],
  },
  {
    title: "Services",
    items: [
      {
        to: "/admin/services",
        label: "Services",
        description: "Keep services, pricing, and packages up to date",
        icon: BriefcaseBusiness,
      },
    ],
  },
  {
    title: "Clients",
    items: [
      {
        to: "/admin/clients",
        label: "Clients",
        description: "Keep every client detail close and easy to scan",
        icon: UsersRound,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        to: "/admin/operations",
        label: "Operations",
        description: "Adjust schedules, holds, blocked times, and availability",
        icon: Settings2,
      },
      {
        to: "/admin/reports",
        label: "Reports",
        description: "Download daily, weekly, monthly, and yearly snapshots",
        icon: FileText,
      },
    ],
  },
];

const navigation: NavigationItem[] = navigationSections.flatMap((section) => section.items);

function AdminBrand({
  compact = false,
  showName = true,
}: {
  compact?: boolean;
  showName?: boolean;
}) {
  return (
    <Link
      to="/"
      className={cn("flex min-w-0 items-center gap-3", !showName && "justify-center")}
    >
      <img
        src="/nuyu-logo.jpeg"
        alt="Nuyu Recovery Home logo"
        className={cn(
          "rounded-2xl border border-[var(--color-border-subtle)] object-cover",
          compact ? "h-10 w-10" : "h-12 w-12",
        )}
      />
      {showName ? (
        <div className="min-w-0">
          <p
            className={cn(
              "truncate font-semibold tracking-[0.04em] text-[var(--nuyu-gold)]",
              compact ? "text-sm" : "text-base",
            )}
          >
            Nuyu
          </p>
        </div>
      ) : null}
    </Link>
  );
}

export function AdminShell({ children }: PropsWithChildren) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAdminAuth();
  const { isLoading, refresh } = useAdminPortal();
  const activePage =
    navigation.find((item) =>
      item.to === "/admin"
        ? location.pathname === "/admin"
        : location.pathname.startsWith(item.to),
    ) ?? navigation[0];
  const isNestedPage = activePage.to !== "/admin";

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside
          className={cn(
            "hidden border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/94 backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col",
            collapsed ? "lg:w-20" : "lg:w-72",
          )}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-5">
            {!collapsed ? (
              <AdminBrand />
            ) : (
              <div className="mx-auto">
                <AdminBrand compact showName={false} />
              </div>
            )}

            <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <Button
                variant="ghost"
                size="sm"
                className={cn("shrink-0", collapsed && "mx-auto")}
                onClick={() => setCollapsed((current) => !current)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </Tooltip>
          </div>

          <nav className="admin-nav-scroll mt-1 flex-1 overflow-y-auto px-3 pb-5">
            <div className="space-y-4">
              {navigationSections.map((section, sectionIndex) => (
                <Fragment key={section.title}>
                  {sectionIndex > 0 ? (
                    <div
                      className={cn(
                        "mx-3 border-t border-[var(--color-border-subtle)]",
                        collapsed && "mx-2",
                      )}
                    />
                  ) : null}

                  <div className="space-y-1.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Tooltip
                          key={item.to}
                          content={collapsed ? item.label.toLowerCase() : item.description}
                          className={collapsed ? "w-full" : undefined}
                        >
                          <NavLink
                            to={item.to}
                            end={item.to === "/admin"}
                            className={({ isActive }) =>
                              cn(
                                "flex min-h-12 items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                                collapsed && "justify-center px-0",
                                isActive
                                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text)]",
                              )
                            }
                          >
                            <Icon className="h-5 w-5 shrink-0 text-current" />
                            {!collapsed ? <span>{item.label}</span> : null}
                          </NavLink>
                        </Tooltip>
                      );
                    })}
                  </div>
                </Fragment>
              ))}
            </div>
          </nav>

          <div className="border-t border-[var(--color-border-subtle)] px-4 py-4">
            <Button
              variant="ghost"
              size="md"
              fullWidth
              leadingIcon={<LogOut className="h-4 w-4" />}
              className={collapsed ? "justify-center px-0" : "justify-start"}
              onClick={handleSignOut}
            >
              {!collapsed ? "Sign out" : null}
            </Button>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/92 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                {isNestedPage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    leadingIcon={<ArrowLeft className="h-4 w-4" />}
                    onClick={() => navigate("/admin")}
                  >
                    Back
                  </Button>
                ) : null}

                <div className="lg:hidden">
                  <AdminBrand compact />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leadingIcon={<RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />}
                  className="hidden sm:inline-flex"
                  onClick={() => void refresh()}
                >
                  {isLoading ? "Refreshing..." : "Refresh"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="sm:hidden"
                  onClick={() => void refresh()}
                  aria-label={isLoading ? "Refreshing data" : "Refresh data"}
                >
                  <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 pb-36 lg:pb-8">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
              <div className="route-fade-enter space-y-4">{children}</div>
            </div>
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/98 px-3 py-3 backdrop-blur lg:hidden">
        <div className="grid grid-cols-3 gap-2">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-[4.35rem] flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 text-[0.72rem] font-medium transition active:scale-[0.98]",
                    isActive
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)]",
                  )
                }
              >
                <Icon className="h-4 w-4 text-current" />
                <span className="text-center leading-tight text-current">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
