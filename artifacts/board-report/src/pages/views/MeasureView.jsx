import { useMemo, useState } from "react";
import { useAllMetrics } from "@/hooks/useAllMetrics";
import { EmptyState } from "@/components/EmptyState";
import { humanize } from "@/lib/format";

const COLUMNS = [
  { key: "metric_name", label: "Metric" },
  { key: "category", label: "Category" },
  { key: "period_label", label: "Period" },
  { key: "value", label: "Value" },
  { key: "comparative_value", label: "Comparative" },
  { key: "unit", label: "Unit" },
  { key: "derived", label: "Derived" },
  { key: "source_filename", label: "Source" },
];

function getSortValue(row, key) {
  const payload = row.payload ?? {};
  switch (key) {
    case "metric_name":
      return payload.metric_name ?? "";
    case "value":
      return payload.value ?? null;
    case "comparative_value":
      return payload.comparative_value ?? null;
    case "unit":
      return payload.unit ?? "";
    case "derived":
      return payload.derived ? 1 : 0;
    default:
      return row[key] ?? "";
  }
}

export function MeasureView() {
  const { data, isLoading, isError, error } = useAllMetrics();
  const [sortKey, setSortKey] = useState("category");
  const [sortDir, setSortDir] = useState("asc");

  const rows = data?.disclosures ?? [];

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      if (av === bv) return 0;
      if (av === null || av === undefined || av === "") return 1;
      if (bv === null || bv === undefined || bv === "") return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load metrics: {error?.message ?? "Unknown error"}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No raw metrics disclosed yet"
        description="Once documents are extracted, every raw and derived metric will appear here, one row per period and source document."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Every metric disclosed across all periods and audiences — {rows.length} rows, unfiltered.
        Click a column heading to sort.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60 text-left text-muted-foreground">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="cursor-pointer select-none whitespace-nowrap px-3 py-2 font-medium hover:text-foreground"
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key ? (sortDir === "asc" ? " \u25B2" : " \u25BC") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const p = row.payload ?? {};
              return (
                <tr key={row.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">
                    {humanize(p.metric_name)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {row.category ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {row.period_label ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-foreground">
                    {p.value ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {p.comparative_value ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {p.unit ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {p.derived ? "Yes" : "No"}
                  </td>
                  <td
                    className="max-w-[180px] truncate px-3 py-2 text-muted-foreground"
                    title={row.source_filename ?? undefined}
                  >
                    {row.source_filename ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
