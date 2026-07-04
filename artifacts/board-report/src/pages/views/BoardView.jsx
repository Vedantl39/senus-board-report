import { MetricsTable } from "@/components/MetricsTable";
import { RiskRegister } from "@/components/RiskRegister";
import { EventList } from "@/components/EventList";

export function BoardView({ data }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-xl font-semibold text-foreground">
          P&amp;L Trend &amp; Cash Position
        </h2>
        <MetricsTable metrics={data?.metrics} />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold text-foreground">Risk Register</h2>
        <RiskRegister risks={data?.risks} />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold text-foreground">Governance Events</h2>
        <EventList events={data?.events} />
      </section>
    </div>
  );
}
