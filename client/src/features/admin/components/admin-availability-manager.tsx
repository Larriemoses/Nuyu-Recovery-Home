import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../lib/api/client";
import { AdminEmptyState } from "./admin-empty-state";
import { useAdminAuth } from "../context/admin-auth-provider";
import { useAdminPortal } from "../context/admin-portal-provider";
import { formatTimeOnly, weekdayLabels } from "../utils/admin-format";
import { AdminPanel } from "./admin-ui";

type ActionState = {
  status: "idle" | "submitting" | "success" | "error";
  message?: string;
};

export function AdminAvailabilityManager() {
  const { accessToken } = useAdminAuth();
  const { data, refresh } = useAdminPortal();
  const [serviceId, setServiceId] = useState("");
  const [weekday, setWeekday] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [slotLengthMinutes, setSlotLengthMinutes] = useState("60");
  const [capacity, setCapacity] = useState("1");
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

  if (!data) {
    return null;
  }

  const selectedService = timedServices.find((service) => service.id === serviceId);
  const windows = data.operations.availabilityWindows
    .filter((window) => window.serviceId === serviceId)
    .sort((left, right) => {
      if (left.weekday !== right.weekday) {
        return left.weekday - right.weekday;
      }

      return left.startTime.localeCompare(right.startTime);
    });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !serviceId) {
      setState({
        status: "error",
        message: "Admin access is required before available times can be updated.",
      });
      return;
    }

    setState({
      status: "submitting",
      message: "Saving the new available time...",
    });

    try {
      const result = await apiRequest<{ message: string }>("/admin/availability-windows", {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          serviceId,
          weekday: Number(weekday),
          startTime,
          endTime,
          slotLengthMinutes: Number(slotLengthMinutes),
          capacity: Number(capacity),
        }),
      });

      setState({
        status: "success",
        message: result.message,
      });
      await refresh();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to save the available time.",
      });
    }
  }

  async function handleRemove(windowId: string) {
    if (!accessToken) {
      setState({
        status: "error",
        message: "Admin access is required before available times can be updated.",
      });
      return;
    }

    setState({
      status: "submitting",
      message: "Removing the available time...",
    });

    try {
      const result = await apiRequest<{ message: string }>(
        `/admin/availability-windows/${windowId}`,
        {
          method: "DELETE",
          accessToken,
        },
      );

      setState({
        status: "success",
        message: result.message,
      });
      await refresh();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to remove the available time.",
      });
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <AdminPanel
        eyebrow="Weekly Schedule"
        title="Set the normal weekly timetable"
        description="Pick the service, choose the day, and save the regular open hours clients should be allowed to book."
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
              Day of week
              <select
                className="rounded-2xl border border-[rgba(47,93,50,0.08)] bg-white px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                value={weekday}
                onChange={(event) => setWeekday(event.target.value)}
              >
                {weekdayLabels.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
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

            <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
              Slot length in minutes
              <input
                type="number"
                min={15}
                step={15}
                className="rounded-2xl border border-[rgba(47,93,50,0.08)] bg-white px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                value={slotLengthMinutes}
                onChange={(event) => setSlotLengthMinutes(event.target.value)}
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-[var(--nuyu-muted)]">
              Capacity
              <input
                type="number"
                min={1}
                className="rounded-2xl border border-[rgba(47,93,50,0.08)] bg-white px-4 py-3 text-sm text-[var(--nuyu-ink)]"
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                required
              />
            </label>
          </div>

          {state.message ? (
            <div
              className={[
                "rounded-[1.25rem] px-4 py-3 text-sm",
                state.status === "error"
                  ? "bg-[rgba(190,92,63,0.12)] text-[var(--nuyu-ink)]"
                  : "bg-[rgba(47,93,50,0.08)] text-[var(--nuyu-ink)]",
              ].join(" ")}
            >
              {state.message}
            </div>
          ) : null}

          <div className="rounded-[1.25rem] bg-[var(--nuyu-cream)] p-4 text-sm text-[var(--nuyu-muted)]">
            Saving available time here updates the booking-side availability clients can choose from.
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={state.status === "submitting"}
              className="rounded-full bg-[var(--nuyu-primary)] px-5 py-3 text-sm font-semibold text-[var(--nuyu-cream)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state.status === "submitting"
                ? "Saving available time..."
                : "Save available time"}
            </button>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel
        eyebrow="Current Weekly Schedule"
        title={selectedService ? `${selectedService.name} weekly schedule` : "Current schedule"}
        description="These are the recurring booking times the client booking page can use right now."
      >
        <div className="space-y-3">
          {windows.length ? (
            windows.map((window) => (
              <article
                key={window.id}
                className="admin-list-row rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--nuyu-ink)]">
                      {weekdayLabels[window.weekday]}
                    </p>
                    <p className="mt-1">
                      {formatTimeOnly(window.startTime)} to {formatTimeOnly(window.endTime)}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="rounded-full border border-[rgba(190,92,63,0.22)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--nuyu-ink)] transition hover:bg-[rgba(190,92,63,0.08)]"
                    onClick={() => handleRemove(window.id)}
                  >
                    Remove
                  </button>
                </div>
                <p className="mt-3">
                  {window.slotLengthMinutes} minute slots, capacity {window.capacity}
                </p>
              </article>
            ))
          ) : (
            <AdminEmptyState
              title="No weekly schedule has been added yet"
              description="Once the admin saves a weekly schedule here, it will show in this panel and the booking page can use it."
            />
          )}
        </div>
      </AdminPanel>
    </div>
  );
}
