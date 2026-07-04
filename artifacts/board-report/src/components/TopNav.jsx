import { useAuth } from "@/context/AuthContext";

const FRAMING = [
  { key: "measure", label: "Measure" },
  { key: "report", label: "Report" },
  { key: "verify", label: "Verify" },
];

const AUDIENCES = [
  { key: "management", label: "Management" },
  { key: "board", label: "Board" },
  { key: "investors", label: "Investors" },
  { key: "lenders", label: "Lenders" },
];

export function TopNav({ audience, onAudienceChange }) {
  const { logout } = useAuth();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-lg font-semibold tracking-tight text-foreground">
              Senus PLC
            </p>
            <p className="text-xs text-muted-foreground">Board Report</p>
          </div>
          <nav className="flex items-center gap-1">
            {FRAMING.map((item) => (
              <span
                key={item.key}
                aria-current={item.key === "report" ? "page" : undefined}
                title={item.key === "report" ? undefined : "Coming soon"}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  item.key === "report"
                    ? "bg-primary text-primary-foreground"
                    : "cursor-default text-muted-foreground/60"
                }`}
              >
                {item.label}
              </span>
            ))}
          </nav>
        </div>
        <button
          type="button"
          onClick={logout}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-6 pb-3">
        {AUDIENCES.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onAudienceChange(item.key)}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
              audience === item.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
