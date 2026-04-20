import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "./helpers";
import { EmptyState } from "./empty-state";
import { Card } from "./card";
export function DataTable({ data, columns, getRowId, emptyHeading, emptySubtext, mobileTitle, mobileSubtitle, mobileFooter, }) {
    const [sort, setSort] = useState();
    const sortedData = useMemo(() => {
        if (!sort) {
            return data;
        }
        const column = columns.find((item) => item.id === sort.columnId);
        if (!column?.sortValue) {
            return data;
        }
        return [...data].sort((left, right) => {
            const leftValue = column.sortValue?.(left);
            const rightValue = column.sortValue?.(right);
            if (leftValue == null && rightValue == null) {
                return 0;
            }
            if (leftValue == null) {
                return 1;
            }
            if (rightValue == null) {
                return -1;
            }
            if (leftValue === rightValue) {
                return 0;
            }
            const comparison = leftValue > rightValue ? 1 : -1;
            return sort.direction === "asc" ? comparison : comparison * -1;
        });
    }, [columns, data, sort]);
    function toggleSort(column) {
        if (!column.sortValue) {
            return;
        }
        setSort((current) => {
            if (current?.columnId !== column.id) {
                return { columnId: column.id, direction: "asc" };
            }
            return {
                columnId: column.id,
                direction: current.direction === "asc" ? "desc" : "asc",
            };
        });
    }
    function renderSortIcon(column) {
        if (!column.sortValue) {
            return null;
        }
        if (sort?.columnId !== column.id) {
            return _jsx(ArrowUpDown, { className: "h-4 w-4" });
        }
        return sort.direction === "asc" ? (_jsx(ArrowUp, { className: "h-4 w-4" })) : (_jsx(ArrowDown, { className: "h-4 w-4" }));
    }
    if (!sortedData.length) {
        return _jsx(EmptyState, { heading: emptyHeading, subtext: emptySubtext });
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]", children: _jsx("div", { className: "hidden overflow-x-auto md:block", children: _jsxs("table", { className: "min-w-full table-auto", children: [_jsx("thead", { className: "bg-[var(--color-surface-overlay)]", children: _jsx("tr", { children: columns.map((column) => (_jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]", children: _jsxs("button", { type: "button", onClick: () => toggleSort(column), className: cn("inline-flex items-center gap-2", column.sortValue ? "transition hover:text-[var(--color-text)]" : "cursor-default"), children: [_jsx("span", { children: column.header }), renderSortIcon(column)] }) }, column.id))) }) }), _jsx("tbody", { children: sortedData.map((row) => (_jsx("tr", { className: "border-t border-[var(--color-border-subtle)]", children: columns.map((column) => (_jsx("td", { className: cn("px-4 py-4 align-top text-sm text-[var(--color-text-muted)]", column.className), children: column.cell(row) }, column.id))) }, getRowId(row)))) })] }) }) }), _jsx("div", { className: "grid gap-3 md:hidden", children: sortedData.map((row) => (_jsx(Card, { variant: "default", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "font-semibold text-[var(--color-text)]", children: mobileTitle(row) }), mobileSubtitle ? (_jsx("div", { className: "text-sm text-[var(--color-text-muted)]", children: mobileSubtitle(row) })) : null] }), _jsx("div", { className: "space-y-2", children: columns
                                    .filter((column) => !column.mobileHidden)
                                    .map((column) => (_jsxs("div", { className: "flex items-start justify-between gap-3 text-sm", children: [_jsx("span", { className: "text-[var(--color-text-muted)]", children: column.header }), _jsx("span", { className: "text-right text-[var(--color-text)]", children: column.cell(row) })] }, column.id))) }), mobileFooter ? _jsx("div", { children: mobileFooter(row) }) : null] }) }, getRowId(row)))) })] }));
}
