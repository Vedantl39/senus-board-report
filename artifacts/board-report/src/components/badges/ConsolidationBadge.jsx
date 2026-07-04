export function ConsolidationBadge({ basis }) {
  if (!basis) return null;

  const label = basis === "consolidated" ? "Consolidated" : "Standalone";

  return (
    <span className="inline-flex items-center rounded-full border border-stone-300 bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
      {label}
    </span>
  );
}
