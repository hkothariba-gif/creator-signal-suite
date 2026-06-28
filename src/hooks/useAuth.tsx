import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AuthUser = {
  email: string;
  role: "user" | "admin";
  onboarded?: boolean;
  brand?: {
    category?: string;
    age?: string;
    gender?: string;
    income?: string;
    notes?: string;
    platforms?: { youtube: boolean; reddit: boolean; x: boolean };
  };
};

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string) => AuthUser;
  update: (patch: Partial<AuthUser>) => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "ar_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    if (typeof window === "undefined") return;
    if (u) localStorage.setItem(KEY, JSON.stringify(u));
    else localStorage.removeItem(KEY);
  };

  const login = (email: string): AuthUser => {
    const isAdmin = email.trim().toLowerCase() === "admin@aspenreach.com";
    const next: AuthUser = isAdmin
      ? { email, role: "admin", onboarded: true }
      : { email, role: "user", onboarded: user?.email === email ? user?.onboarded ?? false : false };
    persist(next);
    return next;
  };

  const update = (patch: Partial<AuthUser>) => {
    if (!user) return;
    persist({ ...user, ...patch });
  };

  const logout = () => persist(null);

  return <Ctx.Provider value={{ user, loading, login, update, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
