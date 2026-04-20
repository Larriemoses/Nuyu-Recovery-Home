import { formatCurrency } from "../../../utils/currency";
const csvHeaders = [
    "S/N",
    "Client Name",
    "Service Booked",
    "Applied Option",
    "Amount Paid",
    "Date",
    "Time",
];
const dateFormatter = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
});
const timeFormatter = new Intl.DateTimeFormat("en-NG", {
    timeStyle: "short",
});
function escapeCsvValue(value) {
    const normalized = String(value).replace(/"/g, "\"\"");
    return `"${normalized}"`;
}
function getAppliedOption(row) {
    return (row.appliedOption ??
        (row.bookingKind === "package"
            ? "Package booking"
            : row.bookingKind === "stay"
                ? "Recovery stay request"
                : "Direct service booking"));
}
function formatExportDate(row) {
    if (row.slotStartsAt) {
        return dateFormatter.format(new Date(row.slotStartsAt));
    }
    if (row.checkInDate) {
        return dateFormatter.format(new Date(row.checkInDate));
    }
    return dateFormatter.format(new Date(row.createdAt));
}
function formatExportTime(row) {
    if (row.slotStartsAt && row.slotEndsAt) {
        return `${timeFormatter.format(new Date(row.slotStartsAt))} - ${timeFormatter.format(new Date(row.slotEndsAt))}`;
    }
    if (row.checkInDate && row.checkOutDate) {
        return `Stay until ${dateFormatter.format(new Date(row.checkOutDate))}`;
    }
    return timeFormatter.format(new Date(row.createdAt));
}
function getExportBookings(report) {
    if (Array.isArray(report.exportBookings)) {
        return report.exportBookings;
    }
    if (Array.isArray(report.recentActivity)) {
        return report.recentActivity.map((row) => ({
            id: row.id,
            createdAt: row.createdAt,
            serviceName: row.serviceName,
            clientName: row.clientName,
            clientEmail: row.clientEmail ?? null,
            appliedOption: null,
            bookingKind: row.bookingKind,
            status: row.status,
            paymentStatus: row.paymentStatus,
            totalAmountKobo: row.totalAmountKobo,
            paidAmountKobo: row.paymentStatus === "paid" || row.status === "confirmed"
                ? row.totalAmountKobo
                : 0,
            slotStartsAt: null,
            slotEndsAt: null,
            checkInDate: null,
            checkOutDate: null,
        }));
    }
    return [];
}
function getBookingTypeSummary(report) {
    return Array.isArray(report.bookingTypeSummary) ? report.bookingTypeSummary : [];
}
function getStatusSummary(report) {
    return Array.isArray(report.statusSummary) ? report.statusSummary : [];
}
function getServiceSummary(report) {
    return Array.isArray(report.serviceSummary) ? report.serviceSummary : [];
}
function buildBookingRows(report) {
    return getExportBookings(report).map((row, index) => ({
        "S/N": index + 1,
        "Client Name": row.clientName,
        "Service Booked": row.serviceName,
        "Applied Option": getAppliedOption(row),
        "Amount Paid": formatCurrency(row.paidAmountKobo),
        Date: formatExportDate(row),
        Time: formatExportTime(row),
    }));
}
function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
}
function buildVisualBar(value, maxValue) {
    if (maxValue <= 0) {
        return "";
    }
    const filled = Math.max(1, Math.round((value / maxValue) * 10));
    return `${"#".repeat(filled)}${".".repeat(Math.max(0, 10 - filled))}`;
}
function applyHeaderRowStyle(row) {
    row.height = 24;
    row.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = {
            bold: true,
            color: { argb: "FFFFFFFF" },
            size: 11,
        };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "1F5A44" },
        };
        cell.border = {
            top: { style: "thin", color: { argb: "D7DED8" } },
            left: { style: "thin", color: { argb: "D7DED8" } },
            bottom: { style: "thin", color: { argb: "D7DED8" } },
            right: { style: "thin", color: { argb: "D7DED8" } },
        };
        cell.alignment = {
            vertical: "middle",
            horizontal: "center",
            wrapText: true,
        };
    });
}
function applyDataRowStyle(row, rowIndex) {
    row.height = 22;
    const fillColor = rowIndex % 2 === 0 ? "F7F8F7" : "FFFFFF";
    row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: fillColor },
        };
        cell.border = {
            top: { style: "thin", color: { argb: "E2E7E3" } },
            left: { style: "thin", color: { argb: "E2E7E3" } },
            bottom: { style: "thin", color: { argb: "E2E7E3" } },
            right: { style: "thin", color: { argb: "E2E7E3" } },
        };
        cell.alignment = {
            vertical: "middle",
            wrapText: true,
        };
        cell.font = {
            color: { argb: "171E19" },
            size: 10,
        };
    });
}
function setSectionTitle(cell) {
    cell.font = {
        bold: true,
        color: { argb: "A58428" },
        size: 11,
    };
    cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FCFAF4" },
    };
    cell.alignment = {
        vertical: "middle",
        horizontal: "left",
    };
    cell.border = {
        bottom: { style: "thin", color: { argb: "E2E7E3" } },
    };
}
function applyMetricBlock(worksheet, range, label, value) {
    worksheet.mergeCells(range);
    const cell = worksheet.getCell(range.split(":")[0]);
    cell.value = `${label}\n${value}`;
    cell.alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: true,
    };
    cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F4F7F5" },
    };
    cell.border = {
        top: { style: "thin", color: { argb: "DCE3DE" } },
        left: { style: "thin", color: { argb: "DCE3DE" } },
        bottom: { style: "thin", color: { argb: "DCE3DE" } },
        right: { style: "thin", color: { argb: "DCE3DE" } },
    };
    cell.font = {
        bold: true,
        size: 12,
        color: { argb: "171E19" },
    };
}
function toAnalyticsRows(report) {
    const bookingTypeSummary = getBookingTypeSummary(report);
    const statusSummary = getStatusSummary(report);
    const serviceSummary = getServiceSummary(report);
    const paymentSummary = report.paymentSummary ?? {
        totalRecords: 0,
        paidCount: 0,
        pendingCount: 0,
        failedCount: 0,
        refundedCount: 0,
        verifiedAmountKobo: 0,
    };
    const maxBookingType = Math.max(0, ...bookingTypeSummary.map((item) => item.count));
    const maxStatus = Math.max(0, ...statusSummary.map((item) => item.count));
    const maxServiceBookings = Math.max(0, ...serviceSummary.map((item) => item.bookingsCount));
    return {
        bookingTypes: bookingTypeSummary.map((item) => ({
            type: item.bookingKind,
            count: item.count,
            visual: buildVisualBar(item.count, maxBookingType),
            quotedValue: formatCurrency(item.quotedValueKobo),
        })),
        statuses: statusSummary.map((item) => ({
            status: item.status,
            count: item.count,
            visual: buildVisualBar(item.count, maxStatus),
        })),
        services: serviceSummary.map((item) => ({
            service: item.serviceName,
            type: item.bookingKind,
            bookings: item.bookingsCount,
            stayRequests: item.stayRequests,
            paidValue: formatCurrency(item.paidValueKobo),
            visual: buildVisualBar(item.bookingsCount, maxServiceBookings),
        })),
        payments: [
            { label: "Total payment records", value: paymentSummary.totalRecords },
            { label: "Paid records", value: paymentSummary.paidCount },
            { label: "Pending records", value: paymentSummary.pendingCount },
            { label: "Failed records", value: paymentSummary.failedCount },
            { label: "Refunded records", value: paymentSummary.refundedCount },
            {
                label: "Verified paid value",
                value: formatCurrency(paymentSummary.verifiedAmountKobo),
            },
        ],
    };
}
async function createAdminWorkbook(report) {
    const { Workbook } = await import("exceljs");
    const workbook = new Workbook();
    const bookingRows = buildBookingRows(report);
    const analyticsRows = toAnalyticsRows(report);
    const summary = report.summary ?? {
        bookingsCreated: 0,
        newClients: 0,
        pendingBookings: 0,
        heldBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        stayRequests: 0,
        activeHoldsNow: 0,
        quotedValueKobo: 0,
        paidValueKobo: 0,
    };
    const paymentSummary = report.paymentSummary ?? {
        totalRecords: 0,
        pendingCount: 0,
        paidCount: 0,
        failedCount: 0,
        refundedCount: 0,
        verifiedAmountKobo: 0,
    };
    const serviceSummary = getServiceSummary(report);
    const topService = serviceSummary[0];
    workbook.creator = "Nuyu Recovery Home";
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.subject = `${report.range.label} export`;
    workbook.title = `Nuyu ${report.period} report`;
    const summarySheet = workbook.addWorksheet("Summary", {
        views: [{ showGridLines: false }],
    });
    summarySheet.columns = [
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
    ];
    summarySheet.mergeCells("A1:F1");
    summarySheet.getCell("A1").value = "Nuyu Recovery Home Report";
    summarySheet.getCell("A1").font = {
        bold: true,
        size: 18,
        color: { argb: "171E19" },
    };
    summarySheet.getCell("A1").alignment = { horizontal: "left", vertical: "middle" };
    summarySheet.mergeCells("A2:F2");
    summarySheet.getCell("A2").value = `${report.range.label} • Generated ${dateFormatter.format(new Date(report.generatedAt))}`;
    summarySheet.getCell("A2").font = {
        size: 11,
        color: { argb: "5C675F" },
    };
    summarySheet.getCell("A2").value = `${report.range.label} - Generated ${dateFormatter.format(new Date(report.generatedAt))}`;
    applyMetricBlock(summarySheet, "A4:C6", "Bookings Created", summary.bookingsCreated);
    applyMetricBlock(summarySheet, "D4:F6", "New Clients", summary.newClients);
    applyMetricBlock(summarySheet, "A7:C9", "Amount Paid", formatCurrency(summary.paidValueKobo));
    applyMetricBlock(summarySheet, "D7:F9", "Verified Payments", formatCurrency(paymentSummary.verifiedAmountKobo));
    summarySheet.getCell("A11").value = "Quick View";
    setSectionTitle(summarySheet.getCell("A11"));
    summarySheet.getCell("A12").value = "Report period";
    summarySheet.getCell("B12").value = report.period;
    summarySheet.getCell("A13").value = "Range";
    summarySheet.getCell("B13").value = report.range.label;
    summarySheet.getCell("A14").value = "Quoted value";
    summarySheet.getCell("B14").value = formatCurrency(summary.quotedValueKobo);
    summarySheet.getCell("A15").value = "Active holds now";
    summarySheet.getCell("B15").value = summary.activeHoldsNow;
    summarySheet.getCell("D11").value = "Top Service";
    setSectionTitle(summarySheet.getCell("D11"));
    summarySheet.getCell("D12").value = topService?.serviceName ?? "No service activity";
    summarySheet.getCell("D13").value = `Bookings: ${topService?.bookingsCount ?? 0}`;
    summarySheet.getCell("D14").value = `Quoted: ${topService ? formatCurrency(topService.quotedValueKobo) : formatCurrency(0)}`;
    summarySheet.getCell("D15").value = `Paid: ${topService ? formatCurrency(topService.paidValueKobo) : formatCurrency(0)}`;
    const analyticsSheet = workbook.addWorksheet("Analytics", {
        views: [{ state: "frozen", ySplit: 1 }],
    });
    analyticsSheet.columns = [
        { width: 24 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
    ];
    analyticsSheet.getCell("A1").value = "Booking Types";
    setSectionTitle(analyticsSheet.getCell("A1"));
    analyticsSheet.addRow(["Type", "Count", "Visual", "Quoted Value"]);
    applyHeaderRowStyle(analyticsSheet.getRow(2));
    analyticsRows.bookingTypes.forEach((item, index) => {
        analyticsSheet.addRow([item.type, item.count, item.visual, item.quotedValue]);
        applyDataRowStyle(analyticsSheet.getRow(3 + index), index);
    });
    const statusStart = analyticsRows.bookingTypes.length + 5;
    analyticsSheet.getCell(`A${statusStart}`).value = "Booking Statuses";
    setSectionTitle(analyticsSheet.getCell(`A${statusStart}`));
    analyticsSheet.addRow(["Status", "Count", "Visual", ""]);
    applyHeaderRowStyle(analyticsSheet.getRow(statusStart + 1));
    analyticsRows.statuses.forEach((item, index) => {
        analyticsSheet.addRow([item.status, item.count, item.visual, ""]);
        applyDataRowStyle(analyticsSheet.getRow(statusStart + 2 + index), index);
    });
    const paymentStart = statusStart + analyticsRows.statuses.length + 5;
    analyticsSheet.getCell(`A${paymentStart}`).value = "Payments";
    setSectionTitle(analyticsSheet.getCell(`A${paymentStart}`));
    analyticsSheet.addRow(["Label", "Value", "", ""]);
    applyHeaderRowStyle(analyticsSheet.getRow(paymentStart + 1));
    analyticsRows.payments.forEach((item, index) => {
        analyticsSheet.addRow([item.label, item.value, "", ""]);
        applyDataRowStyle(analyticsSheet.getRow(paymentStart + 2 + index), index);
    });
    const servicesSheet = workbook.addWorksheet("Services", {
        views: [{ state: "frozen", ySplit: 1 }],
    });
    servicesSheet.columns = [
        { width: 28 },
        { width: 16 },
        { width: 14 },
        { width: 16 },
        { width: 18 },
        { width: 18 },
    ];
    servicesSheet.addRow([
        "Service",
        "Type",
        "Bookings",
        "Stay Requests",
        "Paid Value",
        "Visual",
    ]);
    applyHeaderRowStyle(servicesSheet.getRow(1));
    analyticsRows.services.forEach((item, index) => {
        servicesSheet.addRow([
            item.service,
            item.type,
            item.bookings,
            item.stayRequests,
            item.paidValue,
            item.visual,
        ]);
        applyDataRowStyle(servicesSheet.getRow(2 + index), index);
    });
    servicesSheet.autoFilter = "A1:F1";
    const bookingsSheet = workbook.addWorksheet("Bookings", {
        views: [{ state: "frozen", ySplit: 1 }],
    });
    bookingsSheet.columns = [
        { width: 8 },
        { width: 24 },
        { width: 24 },
        { width: 24 },
        { width: 16 },
        { width: 18 },
        { width: 20 },
    ];
    bookingsSheet.addRow(csvHeaders);
    applyHeaderRowStyle(bookingsSheet.getRow(1));
    bookingRows.forEach((row, index) => {
        bookingsSheet.addRow(csvHeaders.map((header) => row[header]));
        applyDataRowStyle(bookingsSheet.getRow(2 + index), index);
    });
    bookingsSheet.autoFilter = "A1:G1";
    return workbook;
}
export function buildAdminReportCsv(report) {
    const rows = buildBookingRows(report);
    const lines = [
        csvHeaders.join(","),
        ...rows.map((row) => csvHeaders.map((header) => escapeCsvValue(row[header])).join(",")),
    ];
    return `\uFEFF${lines.join("\n")}`;
}
export function buildAdminReportFilename(report, extension = "csv") {
    return `nuyu-${report.period}-report-${report.anchorDate}.${extension}`;
}
export function downloadAdminReportCsv(report) {
    const csv = buildAdminReportCsv(report);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, buildAdminReportFilename(report, "csv"));
}
export async function downloadAdminReportWorkbook(report) {
    const workbook = await createAdminWorkbook(report);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(blob, buildAdminReportFilename(report, "xlsx"));
}
export async function buildAdminReportWorkbookBuffer(report) {
    const workbook = await createAdminWorkbook(report);
    return workbook.xlsx.writeBuffer();
}
