export function humanize(key) {
  if (!key) return "";
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatCurrency(value, unit) {
  if (value === null || value === undefined) return "—";
  const symbol = unit === "GBP" ? "£" : unit === "EUR" ? "€" : "";
  const formatted = Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

export function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}
