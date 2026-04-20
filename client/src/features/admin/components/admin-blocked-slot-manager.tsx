import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../lib/api/client";
import { Button } from "../../../components/ui";
import { useAdminAuth } from "../context/admin-auth-provider";
import { useAdminPortal } from "../context/admin-portal-provider";
import { formatDateTime } from "../utils/admin-format";
import { AdminPanel } from "./admin-ui";

type ActionState = {
  status: "idle" | "submitting" | "success" | "error";
  message?: string;
};

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayDateInput() {
  return formatDateInput(new Date());
}

function toLagosIso(date: string, time: string) {
  return new Date(`${date}T${time}:00+01:00`).toISOString();
}

export function AdminBlockedSlotManager() {
  const { accessToken } = useAdminAuth();
  const { data, refresh } = useAdminPortal();
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(getTodayDateInput);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [reason, setReason] = useState("");
  const [state, setState] = useState<ActionState>({ status: "idle" });

  const timedServices = useMemo(
    () => data?.services.filter((service) => service.bookingKind !== "stay") ?? [],
    [data],
  );

  useEffect(() => {
    if (!timedServices.length) {
      setServiceId("");
      return;
    }

    if (!serviceId || !timedServices.some((service) => service.id === serviceId)) {
      setServiceId(timedServices[0].id);
    }
  }, [serviceId, timedServices]);

  useEffect(() => {
    if (!serviceId) {
      return;
    }

    setDate(getTodayDateInput());
  }, [serviceId]);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setState({ status: "idle" });
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [state.status]);

  if (!data) {
    return null;
  }

  const selectedService = timedServices.find((service) => service.id === serviceId);
  const blockedSlots = data.operations.blockedSlots
    .filter((slot) => slot.serviceId === serviceId)
    .slice(0, 8);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !serviceId) {
      setState({
        status: "error",
        message: "Admin access is required before blocked times can be updated.",
      });
      return;
    }

    setState({
      status: "submitting",
      message: undefined,
    });

    try {
      await apiRequest<{ message: string }>("/admin/blocked-slots", {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          serviceId,
          startsAt: toLagosIso(date, startTime),
          endsAt: toLagosIso(date, endTime),
          reason: reason || undefined,
        }),
      });

      setState({
        status: "success",
        message: "Saved.",
      });
      setReason("");
      await refresh();
    } catch {
      setState({
        status: "error",
        message: "Something went wrong. Please try again.",
      });
    }
  }

  async function handleRemove(blockedSlotId: string) {
    if (!accessToken) {
      setState({
        status: "error",
        message: "Admin access is required before blocked times can be updated.",
      });
      return;
    }

    try {
      await apiRequest<{ message: string }>(`/admin/blocked-slots/${blockedSlotId}`, {
        method: "DELETE",
        accessToken,
      });
      await refresh();
    } catch {
      setState({
        status: "error",
        message: "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <div className="space-y-4">
      <AdminPanel
        eyebrow="Blocked Times"
        title="Block a specific time"
        description="Use this when a service should be unavailable for a meeting, break, maintenance, or any one-off change."
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
              Service
              <select
                className="admin-form-control rounded-2xl px-4 py-3 text-sm"
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
              >
                {timedServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
              Date
              <input
                type="date"
                className="admin-form-control rounded-2xl px-4 py-3 text-sm"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
              Start time
              <input
                type="time"
                className="admin-form-control rounded-2xl px-4 py-3 text-sm"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
              End time
              <input
                type="time"
                className="admin-form-control rounded-2xl px-4 py-3 text-sm"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                required
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
            Reason
            <textarea
              className="admin-form-control min-h-24 rounded-2xl px-4 py-3 text-sm"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="For example: Staff meeting, maintenance, or private use"
            />
          </label>

          <div className="admin-quiet-card rounded-[1.25rem] p-4 text-sm leading-6 text-[var(--color-text-muted)]">
            Blocking a time here removes that option from the client booking page.
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={state.status === "submitting"}>
              {state.status === "submitting"
                ? "Saving blocked time..."
                : "Save blocked time"}
            </Button>
          </div>
          {state.message ? (
            <p
              className={[
                "text-[13px]",
                state.status === "error"
                  ? "text-[var(--color-danger)]"
                  : "text-[var(--color-success)]",
              ].join(" ")}
            >
              {state.message}
            </p>
          ) : null}
        </form>
      </AdminPanel>

      <AdminPanel
        eyebrow="Current Blocked Times"
        title={selectedService ? `${selectedService.name} blocked times` : "Current blocked times"}
        description="These are the latest times this service is not allowed to take bookings."
      >
        <div className="space-y-3">
          {blockedSlots.length ? (
            blockedSlots.map((slot) => (
              <article
                key={slot.id}
                className="admin-list-row rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--nuyu-ink)]">
                      {formatDateTime(slot.startsAt)}
                    </p>
                    <p className="mt-1">Until {formatDateTime(slot.endsAt)}</p>
                  </div>

                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemove(slot.id)}
                  >
                    Remove
                  </Button>
                </div>
                <p className="mt-3">{slot.reason || "No reason was recorded."}</p>
              </article>
            ))
          ) : (
            <p className="px-4 py-6 text-center text-[13px] text-[var(--color-text-muted)]">
              No blocked times. Use the form above to remove a period from booking.
            </p>
          )}
        </div>
      </AdminPanel>
    </div>
  );
}
