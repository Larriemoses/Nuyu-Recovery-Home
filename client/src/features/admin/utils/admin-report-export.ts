import type { AdminReportResponse } from "../../../types/admin";

const csvHeaders = [
  "report_period",
  "report_anchor_date",
  "report_range_label",
  "range_start",
  "range_end",
  "generated_at",
  "row_type",
  "label",
  "count",
  "amount_kobo",
  "booking_kind",
  "status",
  "payment_status",
  "service_name",
  "client_name",
  "client_email",
  "created_at",
] as const;

type CsvRow = Record<(typeof csvHeaders)[number], string | number>;

function escapeCsvValue(value: string | number) {
  const normalized = String(value).replace(/"/g, "\"\"");

  return `"${normalized}"`;
}

function makeBaseRow(report: AdminReportResponse): CsvRow {
  return {
    report_period: report.period,
    report_anchor_date: report.anchorDate,
    report_range_label: report.range.label,
    range_start: report.range.startsAt,
    range_end: report.range.endsAt,
    generated_at: report.generatedAt,
    row_type: "",
    label: "",
    count: "",
    amount_kobo: "",
    booking_kind: "",
    status: "",
    payment_status: "",
    service_name: "",
    client_name: "",
    client_email: "",
    created_at: "",
  };
}

export function buildAdminReportCsv(report: AdminReportResponse) {
  const rows: CsvRow[] = [];
  const baseRow = makeBaseRow(report);

  const metricRows = [
    ["Bookings created", report.summary.bookingsCreated],
    ["New clients", report.summary.newClients],
    ["Pending bookings", report.summary.pendingBookings],
    ["Held bookings", report.summary.heldBookings],
    ["Confirmed bookings", report.summary.confirmedBookings],
    ["Completed bookings", report.summary.completedBookings],
    ["Cancelled bookings", report.summary.cancelledBookings],
    ["Stay requests", report.summary.stayRequests],
    ["Active holds now", report.summary.activeHoldsNow],
  ] as const;

  for (const [label, count] of metricRows) {
    rows.push({
      ...baseRow,
      row_type: "metric",
      label,
      count,
    });
  }

  rows.push({
    ...baseRow,
    row_type: "metric",
    label: "Quoted value",
    amount_kobo: report.summary.quotedValueKobo,
  });
  rows.push({
    ...baseRow,
    row_type: "metric",
    label: "Paid or confirmed value",
    amount_kobo: report.summary.paidValueKobo,
  });

  for (const item of report.bookingTypeSummary) {
    rows.push({
      ...baseRow,
      row_type: "booking_type",
      label: item.bookingKind,
      booking_kind: item.bookingKind,
      count: item.count,
      amount_kobo: item.quotedValueKobo,
    });
  }

  for (const item of report.statusSummary) {
    rows.push({
      ...baseRow,
      row_type: "booking_status",
      label: item.status,
      status: item.status,
      count: item.count,
    });
  }

  rows.push({
    ...baseRow,
    row_type: "payment_summary",
    label: "Payment records",
    count: report.paymentSummary.totalRecords,
  });
  rows.push({
    ...baseRow,
    row_type: "payment_summary",
    label: "Paid payment records",
    count: report.paymentSummary.paidCount,
    amount_kobo: report.paymentSummary.verifiedAmountKobo,
  });
  rows.push({
    ...baseRow,
    row_type: "payment_summary",
    label: "Pending payment records",
    count: report.paymentSummary.pendingCount,
  });
  rows.push({
    ...baseRow,
    row_type: "payment_summary",
    label: "Failed payment records",
    count: report.paymentSummary.failedCount,
  });
  rows.push({
    ...baseRow,
    row_type: "payment_summary",
    label: "Refunded payment records",
    count: report.paymentSummary.refundedCount,
  });

  for (const item of report.serviceSummary) {
    rows.push({
      ...baseRow,
      row_type: "service_summary",
      label: item.serviceName,
      booking_kind: item.bookingKind,
      count: item.bookingsCount,
      amount_kobo: item.quotedValueKobo,
      service_name: item.serviceName,
    });
    rows.push({
      ...baseRow,
      row_type: "service_stay_requests",
      label: `${item.serviceName} stay requests`,
      booking_kind: item.bookingKind,
      count: item.stayRequests,
      service_name: item.serviceName,
    });
    rows.push({
      ...baseRow,
      row_type: "service_paid_value",
      label: `${item.serviceName} paid value`,
      booking_kind: item.bookingKind,
      amount_kobo: item.paidValueKobo,
      service_name: item.serviceName,
    });
  }

  for (const item of report.recentActivity) {
    rows.push({
      ...baseRow,
      row_type: "recent_activity",
      label: item.serviceName,
      amount_kobo: item.totalAmountKobo,
      booking_kind: item.bookingKind,
      status: item.status,
      payment_status: item.paymentStatus,
      service_name: item.serviceName,
      client_name: item.clientName,
      client_email: item.clientEmail ?? "",
      created_at: item.createdAt,
      count: 1,
    });
  }

  const lines = [
    csvHeaders.join(","),
    ...rows.map((row) =>
      csvHeaders.map((header) => escapeCsvValue(row[header])).join(","),
    ),
  ];

  return lines.join("\n");
}

export function buildAdminReportFilename(report: AdminReportResponse) {
  return `nuyu-${report.period}-report-${report.anchorDate}.csv`;
}
