import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../lib/api/client";
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

export function AdminManualSlotManager() {
  const { accessToken } = useAdminAuth();
  const { data, refresh } = useAdminPortal();
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(getTodayDateInput);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
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
  const manualSlots = data.operations.manualAvailabilitySlots
    .filter((slot) => slot.serviceId === serviceId)
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
    .slice(0, 8);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !serviceId) {
      setState({
        status: "error",
        message: "Admin access is required before one-off times can be posted.",
      });
      return;
    }

    setState({
      status: "submitting",
      message: undefined,
    });

    try {
      await apiRequest<{ message: string }>("/admin/manual-slots", {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          serviceId,
          startsAt: toLagosIso(date, startTime),
          endsAt: toLagosIso(date, endTime),
        }),
      });

      setState({
        status: "success",
        message: "Saved.",
      });
      await refresh();
    } catch {
      setState({
        status: "error",
        message: "Something went wrong. Please try again.",
      });
    }
  }

  async function handleRemove(slotId: string) {
    if (!accessToken) {
      setState({
        status: "error",
        message: "Admin access is required before one-off times can be updated.",
      });
      return;
    }

    try {
      await apiRequest<{ message: string }>(`/admin/manual-slots/${slotId}`, {
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
    <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
      <AdminPanel
        eyebrow="One-Off Availability"
        title="Post a specific open time"
        description="Use this when you want clients to see one exact time, even if it is outside the normal weekly schedule."
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
              Service
              <select
                className="rounded-2xl border border-[rgba(47,93,50,0.08)] bg-white px-4 py-3 text-sm text-[var(--nuyu-ink)]"
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
                className="rounded-2xl border border-[rgba(47,93,50,0.08)] bg-white px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
              Start time
              <input
                type="time"
                className="rounded-2xl border border-[rgba(47,93,50,0.08)] bg-white px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
              End time
              <input
                type="time"
                className="rounded-2xl border border-[rgba(47,93,50,0.08)] bg-white px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                required
              />
            </label>
          </div>

          <div className="rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4 text-sm text-[var(--nuyu-muted)]">
            Clients will only see this exact time if it is still open. This makes it easy to
            add special appointments without changing the full weekly schedule.
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={state.status === "submitting"}
              className="rounded-full bg-[var(--nuyu-primary)] px-5 py-3 text-sm font-semibold text-[var(--nuyu-cream)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state.status === "submitting"
                ? "Posting available time..."
                : "Post available time"}
            </button>
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
        eyebrow="Posted Times"
        title={
          selectedService ? `${selectedService.name} one-off times` : "One-off available times"
        }
        description="These are the exact extra times clients can currently choose for this service."
      >
        <div className="space-y-3">
          {manualSlots.length ? (
            manualSlots.map((slot) => (
              <article
                key={slot.id}
                className="admin-list-row rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--nuyu-ink)]">
                      {formatDateTime(slot.startsAt)}
                    </p>
                    <p className="mt-1">Ends {formatDateTime(slot.endsAt)}</p>
                  </div>

                  <button
                    type="button"
                    className="rounded-full border border-[rgba(190,92,63,0.22)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--nuyu-ink)] transition hover:bg-[rgba(190,92,63,0.08)]"
                    onClick={() => handleRemove(slot.id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="px-4 py-6 text-center text-[13px] text-[var(--color-text-muted)]">
              No extra slots posted. Use the form above to add a specific open time.
            </p>
          )}
        </div>
      </AdminPanel>
    </div>
  );
}
