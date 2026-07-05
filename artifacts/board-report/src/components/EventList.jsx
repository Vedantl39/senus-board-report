import { useState } from "react";
import { ChevronDown } from "lucide-react";

const DEFAULT_VISIBLE_COUNT = 5;

export function EventList({ events }) {
  const [showAll, setShowAll] = useState(false);

  if (!events || events.length === 0) {
    return <p className="text-sm text-muted-foreground">No governance events disclosed.</p>;
  }

  const visible = showAll ? events : events.slice(0, DEFAULT_VISIBLE_COUNT);
  const hiddenCount = events.length - visible.length;

  return (
    <div>
      <ul className="space-y-2">
        {visible.map((event) => {
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
      {events.length > DEFAULT_VISIBLE_COUNT ? (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${showAll ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
          {showAll ? "Show less" : `Show full history (${hiddenCount} more)`}
        </button>
      ) : null}
    </div>
  );
}
