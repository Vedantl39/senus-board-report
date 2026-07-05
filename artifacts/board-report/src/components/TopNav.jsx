import { useAuth } from "@/context/AuthContext";
import senusLogo from "@assets/senus_logo_trimmed.png";

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
    <header className="border-b border-sidebar-border bg-sidebar">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <div>
            <img
              src={senusLogo}
              alt="Senus PLC"
              className="h-6 w-auto"
            />
            <p className="mt-1 text-xs text-sidebar-foreground/70">
              Board Report
            </p>
          </div>
          <nav className="flex items-center gap-1">
            {FRAMING.map((item) => (
              <span
                key={item.key}
                aria-current={item.key === "report" ? "page" : undefined}
                title={item.key === "report" ? undefined : "Coming soon"}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  item.key === "report"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "cursor-default text-sidebar-foreground/40"
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
          className="rounded-full px-3 py-1.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
        >
          Sign out
        </button>
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 pb-3">
        {AUDIENCES.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onAudienceChange(item.key)}
            className={`rounded-full border px-3.5 py-1 text-sm font-semibold transition-colors ${
              audience === item.key
                ? "border-sidebar-accent bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "border-sidebar-foreground/20 text-sidebar-foreground/70 hover:border-sidebar-accent/60 hover:text-sidebar-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
