import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { useAudienceView } from "@/hooks/useAudienceView";
import { ManagementView } from "@/pages/views/ManagementView";
import { BoardView } from "@/pages/views/BoardView";
import { InvestorsView } from "@/pages/views/InvestorsView";
import { LendersView } from "@/pages/views/LendersView";
import { MeasureView } from "@/pages/views/MeasureView";
import { VerifyView } from "@/pages/views/VerifyView";

const VIEW_COMPONENTS = {
  management: ManagementView,
  board: BoardView,
  investors: InvestorsView,
  lenders: LendersView,
};

export function ReportShell() {
  const [audience, setAudience] = useState("management");
  const [framing, setFraming] = useState("report");
  const { data, isLoading, isError, error } = useAudienceView(audience, {
    enabled: framing === "report",
  });

  const ViewComponent = VIEW_COMPONENTS[audience];

  return (
    <div className="theme-senus min-h-screen bg-background text-foreground">
      <TopNav
        audience={audience}
        onAudienceChange={setAudience}
        framing={framing}
        onFramingChange={setFraming}
      />
      <main className="mx-auto max-w-6xl px-6 py-8">
        {framing === "measure" ? (
          <MeasureView />
        ) : framing === "verify" ? (
          <VerifyView audience={audience} />
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-destructive">
            Failed to load view: {error?.message ?? "Unknown error"}
          </p>
        ) : (
          <ViewComponent data={data} />
        )}
      </main>
    </div>
  );
}
