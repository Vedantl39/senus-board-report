import { useCommentary } from "@/hooks/useCommentary";
import { parseCommentarySections } from "@/lib/parseCommentary";
import { EmptyState } from "@/components/EmptyState";

const AUDIENCE_LABELS = {
  management: "Management",
  board: "Board",
  investors: "Investors",
  lenders: "Lenders",
};

const SECTION_ORDER = ["measure", "report", "verify"];
const SECTION_LABELS = { measure: "Measure", report: "Report", verify: "Verify" };

export function VerifyView({ audience }) {
  const { data, isLoading, isError, error } = useCommentary(audience);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Generating AI commentary…</p>;
  }

  if (isError) {
    return (
      <EmptyState
        title="Couldn't generate commentary"
        description={error?.message ?? "Unknown error contacting the commentary service."}
      />
    );
  }

  if (data?.status !== "verified" || !data.commentary) {
    return (
      <EmptyState
        title="Commentary withheld"
        description={
          data?.reason ??
          "The AI-generated commentary could not be verified against the underlying disclosure data, so it was not shown rather than risk showing an unsupported figure."
        }
      />
    );
  }

  const sections = parseCommentarySections(data.commentary);
  const hasAnySection = SECTION_ORDER.some((key) => sections[key]);

  if (!hasAnySection) {
    return (
      <EmptyState
        title="Commentary withheld"
        description="The AI response could not be parsed into Measure/Report/Verify sections."
      />
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        AI-generated commentary for {AUDIENCE_LABELS[audience] ?? audience}, checked figure-by-figure
        against the underlying disclosure data before being shown here.
        {data.generatedAt ? ` Generated ${new Date(data.generatedAt).toLocaleString()}.` : ""}
      </p>
      {SECTION_ORDER.map((key) =>
        sections[key] ? (
          <section key={key}>
            <h2 className="mb-2 text-lg font-semibold text-foreground">{SECTION_LABELS[key]}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {sections[key]}
            </p>
          </section>
        ) : null,
      )}
    </div>
  );
}
