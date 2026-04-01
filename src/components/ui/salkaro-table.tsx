"use client";

import { useMemo, useState } from "react";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon, InboxIcon, ChevronDownIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type SalkaroColumn<TRow> = {
  key: string;
  label: string;
  className?: string;
  render: (row: TRow) => React.ReactNode;
  searchValue?: (row: TRow) => string;
};

type SalkaroTableProps<TRow> = {
  rows: TRow[];
  columns: SalkaroColumn<TRow>[];
  rowKey: (row: TRow) => string;
  title?: React.ReactNode;
  headerRight?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  filterBy?: "all" | string[];
  emptyMessage?: string;
  pageSize?: number;
  onRowClick?: (row: TRow) => void;
  rowClassName?: (row: TRow) => string | undefined;
  collapsable?: boolean;
};

export function SalkaroTable<TRow>({
  rows,
  columns,
  rowKey,
  title,
  headerRight,
  searchable = false,
  searchPlaceholder = "Search...",
  filterBy,
  emptyMessage = "No results found.",
  pageSize,
  onRowClick,
  rowClassName,
  collapsable = false,
}: SalkaroTableProps<TRow>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [collapsed, setCollapsed] = useState(false);

  const filterKeys = useMemo<string[] | null>(() => {
    if (!filterBy || filterBy === "all") return null;
    return filterBy;
  }, [filterBy]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) => {
      const cols = filterKeys
        ? columns.filter((c) => filterKeys.includes(c.key))
        : columns;

      return cols.some((col) => {
        const val = col.searchValue
          ? col.searchValue(row)
          : String(col.render(row) ?? "");
        return val.toLowerCase().includes(q);
      });
    });
  }, [rows, query, columns, filterKeys]);

  const totalRows = filteredRows.length;
  const totalPages = pageSize ? Math.max(1, Math.ceil(totalRows / pageSize)) : 1;
  const clampedPage = Math.min(page, totalPages);

  const displayedRows = useMemo(() => {
    if (!pageSize) return filteredRows;
    const start = (clampedPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, clampedPage, pageSize]);

  function handleQueryChange(q: string) {
    setQuery(q);
    setPage(1);
  }

  const hasTitle = title !== undefined;
  const hasHeaderRight = headerRight !== undefined;
  const showTopBar = hasTitle || hasHeaderRight || searchable;
  const showPagination = !!pageSize && totalPages > 1;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {showTopBar && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border">
          {hasTitle ? (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{title}</p>
              {collapsable && (
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => !c)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDownIcon
                    className={`size-4 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
                  />
                </button>
              )}
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            {searchable && (
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 pl-8 text-xs max-w-xs"
                />
              </div>
            )}
            {hasHeaderRight && headerRight}
          </div>
        </div>
      )}
      {!collapsed && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                      <InboxIcon className="size-6" />
                      <p className="text-xs">{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayedRows.map((row) => (
                  <TableRow
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={
                      [
                        onRowClick ? "cursor-pointer" : "",
                        rowClassName?.(row) ?? "",
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.className}>
                        {col.render(row) ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {showPagination && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {totalRows === 0
                  ? "No results"
                  : `${(clampedPage - 1) * pageSize + 1}–${Math.min(clampedPage * pageSize, totalRows)} of ${totalRows}`}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={clampedPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="text-xs tabular-nums px-1">
                  {clampedPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={clampedPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
