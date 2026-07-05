import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import assiduousLogo from "@assets/assiduous_logo_trimmed.png";

export function LoginPage() {
  const { login, error } = useAuth();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    await login(password);
    setSubmitting(false);
  }

  return (
    <div className="theme-assiduous dark flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img
            src={assiduousLogo}
            alt="Assiduous"
            className="mx-auto h-auto max-h-16 w-full max-w-[340px] object-contain"
          />
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Board Report Access
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the shared access password to continue.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-sm space-y-4 rounded-xl border border-border bg-card p-6 shadow-lg"
        >
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none ring-primary focus:ring-2"
              placeholder="••••••••"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={submitting || !password}
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
