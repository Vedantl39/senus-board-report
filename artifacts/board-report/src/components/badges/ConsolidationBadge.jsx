// `basis` is a free-text consolidation scope description (e.g.
// "Consolidated (excl. Loamin)" vs "Consolidated (incl. Loamin, acquired
// Nov 2025)") rather than a fixed standalone/consolidated flag — different
// periods can be consolidated over different sets of entities, and a
// binary label would misrepresent that. Rendered as-is.
export function ConsolidationBadge({ basis }) {
  if (!basis) return null;

  return (
    <span className="inline-flex items-center rounded-full border border-stone-300 bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
      {basis}
    </span>
  );
}
