const STATUS_STYLES = {
  New: "bg-red-100 text-red-700 border-red-300",
  Updated: "bg-amber-100 text-amber-700 border-amber-300",
  Unchanged: "bg-stone-100 text-stone-600 border-stone-300",
};

export function StatusPill({ status }) {
  if (!status) return null;

  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.Unchanged;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}
