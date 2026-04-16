import { SectionCard } from "../../../components/ui/section-card";
import { useAdminPortal } from "../context/admin-portal-provider";
import { AdminEmptyState } from "../components/admin-empty-state";
import { formatDateTime } from "../utils/admin-format";
import { formatCurrency } from "../../../utils/currency";

export function AdminClientsPage() {
  const { data, isLoading, errorMessage } = useAdminPortal();

  if (isLoading) {
    return (
      <SectionCard eyebrow="Clients" title="Loading client records">
        <div className="rounded-[1.5rem] bg-white/75 p-6 text-sm text-[var(--nuyu-muted)]">
          Loading clients...
        </div>
      </SectionCard>
    );
  }

  if (errorMessage || !data) {
    return (
      <SectionCard eyebrow="Clients" title="Clients could not be loaded">
        <AdminEmptyState
          title="Client data is unavailable"
          description={errorMessage ?? "No client data was returned."}
        />
      </SectionCard>
    );
  }

  const sortedClients = [...data.clients].sort(
    (left, right) => right.totalBookings - left.totalBookings,
  );

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Clients"
        title="Clients and booking activity"
        description="Keep a clear people-first view of contact details, repeat activity, and service interest."
      >
        <div className="flex flex-wrap gap-3 text-sm text-[var(--nuyu-muted)]">
          <div className="rounded-full bg-white/80 px-4 py-2">
            {data.metrics.totalClients} total client records
          </div>
          <div className="rounded-full bg-white/80 px-4 py-2">
            {sortedClients.filter((item) => item.totalBookings > 1).length} returning clients
          </div>
          <div className="rounded-full bg-white/80 px-4 py-2">
            {formatCurrency(sortedClients.reduce((sum, item) => sum + item.totalQuotedKobo, 0))} in quoted value
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Client Directory"
        title="People currently in the Nuyu system"
        description="This list focuses on the information the team is most likely to need while testing and following up."
      >
        <div className="space-y-4">
          {sortedClients.length ? (
            sortedClients.map((client) => (
              <article
                key={client.id}
                className="rounded-[1.75rem] border border-[rgba(47,93,50,0.08)] bg-white/78 p-5 text-sm text-[var(--nuyu-muted)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--nuyu-ink)]">{client.fullName}</p>
                    <p className="mt-1">{client.email}</p>
                    <p className="mt-1">{client.phone}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-[var(--nuyu-ink)]">
                      {client.totalBookings} bookings
                    </p>
                    <p className="mt-1">{formatCurrency(client.totalQuotedKobo)} quoted</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                      Latest activity
                    </p>
                    <p className="mt-2">
                      {client.latestBookingAt
                        ? formatDateTime(client.latestBookingAt)
                        : "No booking activity yet"}
                    </p>
                    <p className="mt-1">{client.latestServiceName ?? "No service yet"}</p>
                  </div>

                  <div className="rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                      Current pipeline
                    </p>
                    <p className="mt-2">{client.pendingBookings} pending bookings</p>
                    <p className="mt-1">{client.heldBookings} held bookings</p>
                  </div>

                  <div className="rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                      Notes
                    </p>
                    <p className="mt-2">{client.notes || "No admin notes recorded yet."}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <AdminEmptyState
              title="No client records exist yet"
              description="Client details will appear here once the public booking flow is used."
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
}
