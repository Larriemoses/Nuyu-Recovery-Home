import { useAdminPortal } from "../context/admin-portal-provider";
import { AdminEmptyState } from "../components/admin-empty-state";
import { AdminMetricCard, AdminPanel } from "../components/admin-ui";
import { formatDateTime } from "../utils/admin-format";
import { formatCurrency } from "../../../utils/currency";

export function AdminClientsPage() {
  const { data, isLoading, errorMessage } = useAdminPortal();

  if (isLoading) {
    return (
      <AdminPanel eyebrow="Clients" title="Loading client records">
        <div className="rounded-[1.5rem] bg-white/75 p-6 text-sm text-[var(--nuyu-muted)]">
          Loading clients...
        </div>
      </AdminPanel>
    );
  }

  if (errorMessage || !data) {
    return (
      <AdminPanel eyebrow="Clients" title="Clients could not be loaded">
        <AdminEmptyState
          title="Client data is unavailable"
          description={errorMessage ?? "No client data was returned."}
        />
      </AdminPanel>
    );
  }

  const sortedClients = [...data.clients].sort(
    (left, right) => right.totalBookings - left.totalBookings,
  );
  const topClients = sortedClients.slice(0, 6);
  const newClients = [...data.clients]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <AdminPanel
        eyebrow="Clients"
        title="Client overview"
        description="The client area now keeps the most useful information together in fewer, clearer sections."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label="Total clients"
            value={data.metrics.totalClients}
            helper="People stored in the system"
            accent="primary"
          />
          <AdminMetricCard
            label="Returning"
            value={sortedClients.filter((item) => item.totalBookings > 1).length}
            helper="Clients with repeat bookings"
            accent="gold"
          />
          <AdminMetricCard
            label="Need follow-up"
            value={sortedClients.filter((item) => item.pendingBookings > 0).length}
            helper="Clients with pending activity"
          />
          <AdminMetricCard
            label="Quoted value"
            value={formatCurrency(sortedClients.reduce((sum, item) => sum + item.totalQuotedKobo, 0))}
            helper="Total quoted booking value"
          />
        </div>
      </AdminPanel>

      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <AdminPanel
          eyebrow="Top Clients"
          title="Most active clients"
          description="The highest-activity client records are grouped into denser cards for easier scanning."
        >
          <div className="space-y-3">
            {topClients.length ? (
              topClients.map((client) => (
                <article
                  key={client.id}
                  className="admin-list-row rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-[var(--nuyu-ink)]">{client.fullName}</p>
                      <p className="mt-1">{client.email}</p>
                      <p className="mt-1">{client.phone}</p>
                    </div>
                    <div className="rounded-full bg-[rgba(244,247,242,0.92)] px-3 py-2 font-semibold text-[var(--nuyu-ink)]">
                      {client.totalBookings} bookings
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="admin-quiet-card rounded-[1.2rem] p-3.5">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-gold)]">
                        Value
                      </p>
                      <p className="mt-2">{formatCurrency(client.totalQuotedKobo)} quoted</p>
                      <p className="mt-1">{formatCurrency(client.totalPaidKobo)} paid</p>
                    </div>
                    <div className="admin-quiet-card rounded-[1.2rem] p-3.5">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-gold)]">
                        Latest activity
                      </p>
                      <p className="mt-2">
                        {client.latestBookingAt
                          ? formatDateTime(client.latestBookingAt)
                          : "No booking activity yet"}
                      </p>
                      <p className="mt-1">{client.latestServiceName ?? "No service yet"}</p>
                    </div>
                    <div className="admin-quiet-card rounded-[1.2rem] p-3.5">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-gold)]">
                        Pipeline
                      </p>
                      <p className="mt-2">{client.pendingBookings} pending bookings</p>
                      <p className="mt-1">{client.heldBookings} held bookings</p>
                    </div>
                    <div className="admin-quiet-card rounded-[1.2rem] p-3.5">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--nuyu-gold)]">
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
        </AdminPanel>

        <AdminPanel
          eyebrow="New Clients"
          title="Newest people in the system"
          description="The latest client records stay in a smaller side panel for quick follow-up."
        >
          <div className="space-y-3">
            {newClients.length ? (
              newClients.map((client) => (
                <article
                  key={client.id}
                  className="admin-list-row rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]"
                >
                  <p className="font-semibold text-[var(--nuyu-ink)]">{client.fullName}</p>
                  <p className="mt-1">{client.email}</p>
                  <p className="mt-1">{client.phone}</p>
                  <p className="mt-3">Added {formatDateTime(client.createdAt)}</p>
                </article>
              ))
            ) : (
              <AdminEmptyState
                title="No client records exist yet"
                description="Client details will appear here once the public booking flow is used."
              />
            )}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
