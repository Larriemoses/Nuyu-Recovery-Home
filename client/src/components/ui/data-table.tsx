import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "./helpers";
import { EmptyState } from "./empty-state";
import { Card } from "./card";

type SortDirection = "asc" | "desc";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  mobileHidden?: boolean;
};

type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  emptyHeading: string;
  emptySubtext: string;
  mobileTitle: (row: T) => ReactNode;
  mobileSubtitle?: (row: T) => ReactNode;
  mobileFooter?: (row: T) => ReactNode;
};

export function DataTable<T>({
  data,
  columns,
  getRowId,
  emptyHeading,
  emptySubtext,
  mobileTitle,
  mobileSubtitle,
  mobileFooter,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ columnId: string; direction: SortDirection }>();

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

  function toggleSort(column: DataTableColumn<T>) {
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

  function renderSortIcon(column: DataTableColumn<T>) {
    if (!column.sortValue) {
      return null;
    }

    if (sort?.columnId !== column.id) {
      return <ArrowUpDown className="h-4 w-4" />;
    }

    return sort.direction === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  }

  if (!sortedData.length) {
    return <EmptyState heading={emptyHeading} subtext={emptySubtext} />;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full table-auto">
            <thead className="bg-[var(--color-surface-overlay)]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className={cn(
                        "inline-flex items-center gap-2",
                        column.sortValue ? "transition hover:text-[var(--color-text)]" : "cursor-default",
                      )}
                    >
                      <span>{column.header}</span>
                      {renderSortIcon(column)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row) => (
                <tr
                  key={getRowId(row)}
                  className="border-t border-[var(--color-border-subtle)]"
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn(
                        "px-4 py-4 align-top text-sm text-[var(--color-text-muted)]",
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {sortedData.map((row) => (
          <Card key={getRowId(row)} variant="default">
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="font-semibold text-[var(--color-text)]">{mobileTitle(row)}</div>
                {mobileSubtitle ? (
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {mobileSubtitle(row)}
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                {columns
                  .filter((column) => !column.mobileHidden)
                  .map((column) => (
                    <div
                      key={column.id}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span className="text-[var(--color-text-muted)]">{column.header}</span>
                      <span className="text-right text-[var(--color-text)]">
                        {column.cell(row)}
                      </span>
                    </div>
                  ))}
              </div>
              {mobileFooter ? <div>{mobileFooter(row)}</div> : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
