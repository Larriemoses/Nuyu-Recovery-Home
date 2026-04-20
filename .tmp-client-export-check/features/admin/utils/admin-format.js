export const weekdayLabels = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];
export function formatDateTime(value) {
    if (!value) {
        return "Not scheduled";
    }
    return new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}
export function formatDateOnly(value) {
    if (!value) {
        return "Not set";
    }
    return new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
    }).format(new Date(value));
}
export function formatTimeOnly(value) {
    if (!value) {
        return "Not set";
    }
    return new Intl.DateTimeFormat("en-NG", {
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(`2026-01-01T${value}`));
}
export function formatBookingSchedule(item) {
    if (item.bookingKind === "stay") {
        return `${formatDateOnly(item.checkInDate)} to ${formatDateOnly(item.checkOutDate)}`;
    }
    return formatDateTime(item.slotStartsAt);
}
