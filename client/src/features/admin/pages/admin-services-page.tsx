import { SectionCard } from "../../../components/ui/section-card";
import { useAdminPortal } from "../context/admin-portal-provider";
import { AdminEmptyState } from "../components/admin-empty-state";
import { AdminStatusPill } from "../components/admin-status-pill";
import {
  formatDateTime,
  formatTimeOnly,
  weekdayLabels,
} from "../utils/admin-format";
import { formatCurrency } from "../../../utils/currency";

export function AdminServicesPage() {
  const { data, isLoading, errorMessage } = useAdminPortal();

  if (isLoading) {
    return (
      <SectionCard eyebrow="Services" title="Loading services">
        <div className="rounded-[1.5rem] bg-white/75 p-6 text-sm text-[var(--nuyu-muted)]">
          Loading services...
        </div>
      </SectionCard>
    );
  }

  if (errorMessage || !data) {
    return (
      <SectionCard eyebrow="Services" title="Services could not be loaded">
        <AdminEmptyState
          title="Service data is unavailable"
          description={errorMessage ?? "No service data was returned."}
        />
      </SectionCard>
    );
  }

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Services"
        title="Services, pricing, and schedule coverage"
        description="Review the full service catalog, including package pricing, stay rules, activity, and availability windows."
      >
        <div className="flex flex-wrap gap-3 text-sm text-[var(--nuyu-muted)]">
          <div className="rounded-full bg-white/80 px-4 py-2">
            {data.metrics.activeServicesCount} active services
          </div>
          <div className="rounded-full bg-white/80 px-4 py-2">
            {data.services.reduce((sum, item) => sum + item.availabilityWindows.length, 0)} availability windows
          </div>
          <div className="rounded-full bg-white/80 px-4 py-2">
            {data.services.reduce((sum, item) => sum + item.packages.length, 0)} package options
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        {data.services.length ? (
          data.services.map((service) => (
            <SectionCard
              key={service.id}
              eyebrow={service.bookingKind}
              title={service.name}
              description={service.summary}
            >
              <div className="space-y-4 text-sm text-[var(--nuyu-muted)]">
                <div className="flex flex-wrap gap-2">
                  <AdminStatusPill
                    label={service.isActive ? "Active" : "Inactive"}
                    tone={service.isActive ? "green" : "rose"}
                  />
                  <AdminStatusPill label={formatCurrency(service.basePriceKobo)} tone="gold" />
                  {service.durationMinutes ? (
                    <AdminStatusPill label={`${service.durationMinutes} mins`} tone="ink" />
                  ) : null}
                  {service.minStayDays ? (
                    <AdminStatusPill
                      label={`${service.minStayDays}-${service.maxStayDays} days`}
                      tone="ink"
                    />
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.25rem] bg-white/78 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                      Booking Activity
                    </p>
                    <p className="mt-2">{service.bookingsCount} total booking records</p>
                    <p className="mt-1">{service.pendingCount} pending, {service.heldCount} held, {service.confirmedCount} confirmed</p>
                  </div>

                  <div className="rounded-[1.25rem] bg-white/78 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                      Next blocked slot
                    </p>
                    <p className="mt-2">
                      {service.nextBlockedSlot
                        ? formatDateTime(service.nextBlockedSlot.startsAt)
                        : "No blocked slot is scheduled"}
                    </p>
                    <p className="mt-1">
                      {service.nextBlockedSlot?.reason || "No blocking reason recorded"}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                    Packages
                  </p>
                  {service.packages.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {service.packages.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-full border border-[rgba(47,93,50,0.08)] bg-white px-3 py-2"
                        >
                          {item.label} - {item.sessions_count} sessions - {formatCurrency(item.package_price_kobo)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3">This service does not currently use package pricing.</p>
                  )}
                </div>

                <div className="rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                    Availability windows
                  </p>
                  {service.availabilityWindows.length ? (
                    <div className="mt-3 space-y-2">
                      {service.availabilityWindows.map((window) => (
                        <p key={window.id}>
                          {weekdayLabels[window.weekday]} - {formatTimeOnly(window.start_time)} - {formatTimeOnly(window.end_time)} - {window.slot_length_minutes} minute slots - capacity {window.capacity}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3">No availability windows are configured yet for this service.</p>
                  )}
                </div>
              </div>
            </SectionCard>
          ))
        ) : (
          <AdminEmptyState
            title="No services were found"
            description="Once the service catalog is configured in Supabase, it will appear here."
          />
        )}
      </div>
    </div>
  );
}
