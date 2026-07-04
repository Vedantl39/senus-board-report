export function EventList({ events }) {
  if (!events || events.length === 0) {
    return <p className="text-sm text-muted-foreground">No governance events disclosed.</p>;
  }

  return (
    <ul className="space-y-2">
      {events.map((event) => {
        const payload = event.payload ?? {};
        return (
          <li key={event.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-foreground">{payload.title}</span>
              <span className="text-[11px] text-muted-foreground">
                {event.period_label ?? ""}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{payload.description}</p>
          </li>
        );
      })}
    </ul>
  );
}
