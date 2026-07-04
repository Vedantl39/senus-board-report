import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkSession = useCallback(async () => {
    try {
      const data = await apiFetch("/session");
      setAuthenticated(Boolean(data?.authenticated));
    } catch {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(async (password) => {
    setError(null);
    try {
      await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setAuthenticated(true);
      return true;
    } catch (err) {
      setError(err.message ?? "Login failed");
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/logout", { method: "POST" });
    } finally {
      setAuthenticated(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ authenticated, loading, error, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
