import { useAdminPortal } from "../context/admin-portal-provider";
import { AdminEmptyState } from "../components/admin-empty-state";
import { AdminStatusPill } from "../components/admin-status-pill";
import { AdminMetricCard, AdminPanel } from "../components/admin-ui";
import {
  formatDateTime,
  weekdayLabels,
} from "../utils/admin-format";
import { formatCurrency } from "../../../utils/currency";

function getOpenDaysSummary(
  windows: Array<{
    weekday: number;
  }>,
) {
  if (!windows.length) {
    return "No days set yet";
  }

  return Array.from(new Set(windows.map((window) => weekdayLabels[window.weekday]))).join(
    ", ",
  );
}

export function AdminServicesPage() {
  const { data, isLoading, errorMessage } = useAdminPortal();

  if (isLoading) {
    return (
      <AdminPanel eyebrow="Services" title="Loading services">
        <div className="rounded-[1.5rem] bg-white/75 p-6 text-sm text-[var(--nuyu-muted)]">
          Loading services...
        </div>
      </AdminPanel>
    );
  }

  if (errorMessage || !data) {
    return (
      <AdminPanel eyebrow="Services" title="Services could not be loaded">
        <AdminEmptyState
          title="Service data is unavailable"
          description={errorMessage ?? "No service data was returned."}
        />
      </AdminPanel>
    );
  }

  return (
    <div className="space-y-4">
      <AdminPanel
        eyebrow="Services"
        title="Service overview"
        description="Services, pricing, and schedule setup are grouped into a compact view that works better across screen sizes."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label="Live services"
            value={data.metrics.activeServicesCount}
            helper="Services currently active"
            accent="primary"
          />
          <AdminMetricCard
            label="Open windows"
            value={data.services.reduce((sum, item) => sum + item.availabilityWindows.length, 0)}
            helper="Availability windows saved"
            accent="gold"
          />
          <AdminMetricCard
            label="Packages"
            value={data.services.reduce((sum, item) => sum + item.packages.length, 0)}
            helper="Package options across services"
          />
          <AdminMetricCard
            label="Stay services"
            value={data.services.filter((service) => service.bookingKind === "stay").length}
            helper="Services using stay requests"
          />
        </div>
      </AdminPanel>

      <AdminPanel
        eyebrow="Service List"
        title="Service setup at a glance"
        description="Each service keeps the most important details together without long stacked cards."
      >
        <div className="grid gap-4">
          {data.services.length ? (
            data.services.map((service) => (
              <article
                key={service.id}
                className="admin-list-row rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--nuyu-ink)]">{service.name}</p>
                    <p className="mt-1 max-w-[52ch]">{service.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminStatusPill
                      label={service.isActive ? "Active" : "Inactive"}
                      tone={service.isActive ? "green" : "rose"}
                    />
                    <AdminStatusPill label={service.bookingKind} tone="ink" />
                    <AdminStatusPill label={formatCurrency(service.basePriceKobo)} tone="gold" />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="admin-quiet-card rounded-[1.2rem] p-3.5">
                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--nuyu-gold)]">
                      Activity
                    </p>
                    <p className="mt-1.5 text-[0.88rem] leading-5">{service.bookingsCount} bookings so far</p>
                    <p className="mt-1 text-[0.84rem] leading-5">
                      {service.pendingCount} pending, {service.heldCount} held, {service.confirmedCount} confirmed
                    </p>
                  </div>

                  <div className="admin-quiet-card rounded-[1.2rem] p-3.5">
                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--nuyu-gold)]">
                      Schedule
                    </p>
                    <p className="mt-1.5 text-[0.88rem] leading-5">{service.availabilityWindows.length} windows set</p>
                    <p className="mt-1 text-[0.84rem] leading-5">{getOpenDaysSummary(service.availabilityWindows)}</p>
                  </div>

                  <div className="admin-quiet-card rounded-[1.2rem] p-3.5 sm:col-span-2 xl:col-span-1">
                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--nuyu-gold)]">
                      Next blocked time
                    </p>
                    <p className="mt-1.5 text-[0.88rem] leading-5">
                      {service.nextBlockedSlot
                        ? formatDateTime(service.nextBlockedSlot.startsAt)
                        : "No blocked time scheduled"}
                    </p>
                    <p className="mt-1 text-[0.84rem] leading-5">
                      {service.nextBlockedSlot?.reason || "No special note added."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {service.durationMinutes ? (
                    <span className="admin-chip rounded-full px-3 py-2">
                      {service.durationMinutes} mins
                    </span>
                  ) : null}
                  {service.minStayDays ? (
                    <span className="admin-chip rounded-full px-3 py-2">
                      {service.minStayDays}-{service.maxStayDays} days
                    </span>
                  ) : null}
                  {service.packages.length ? (
                    service.packages.map((item) => (
                      <span
                        key={item.id}
                        className="admin-chip rounded-full px-3 py-2"
                      >
                        {item.label} - {formatCurrency(item.package_price_kobo)}
                      </span>
                    ))
                  ) : (
                    <span className="admin-chip rounded-full px-3 py-2">
                      No package pricing
                    </span>
                  )}
                </div>
              </article>
            ))
          ) : (
            <AdminEmptyState
              title="No services were found"
              description="Once the service catalog is configured in Supabase, it will appear here."
            />
          )}
        </div>
      </AdminPanel>
    </div>
  );
}
