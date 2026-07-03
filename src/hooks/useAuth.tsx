import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthUser = {
  id: string;
  email: string;
  role: "user" | "admin";
  onboarded?: boolean;
  company_name?: string;
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
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; user: AuthUser | null }>;
  signUp: (
    email: string,
    password: string,
    companyName: string,
  ) => Promise<{ error: string | null; user: AuthUser | null }>;
  update: (patch: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
const PROFILE_KEY = "ar_profile";

function loadProfileExtras(id: string): Partial<AuthUser> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${PROFILE_KEY}_${id}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProfileExtras(id: string, extras: Partial<AuthUser>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PROFILE_KEY}_${id}`, JSON.stringify(extras));
  } catch {}
}

function buildUser(supaUser: User, companyName?: string): AuthUser {
  const email = supaUser.email ?? "";
  const isAdmin = email.trim().toLowerCase() === "admin@aspenreach.com";
  const extras = loadProfileExtras(supaUser.id);
  return {
    id: supaUser.id,
    email,
    role: isAdmin ? "admin" : "user",
    onboarded: isAdmin ? true : extras.onboarded ?? false,
    company_name: companyName ?? extras.company_name,
    brand: extras.brand,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ? buildUser(s.user) : null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ? buildUser(data.session.user) : null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthCtx["signIn"] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: error?.message ?? "Sign in failed", user: null };
    const u = buildUser(data.user);
    setUser(u);
    setSession(data.session);
    return { error: null, user: u };
  };

  const signUp: AuthCtx["signUp"] = async (email, password, companyName) => {
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { company_name: companyName },
      },
    });
    if (error || !data.user) return { error: error?.message ?? "Sign up failed", user: null };
    saveProfileExtras(data.user.id, { company_name: companyName, onboarded: false });
    const u = buildUser(data.user, companyName);
    if (data.session) {
      setUser(u);
      setSession(data.session);
    }
    return { error: null, user: u };
  };

  const update = (patch: Partial<AuthUser>) => {
    if (!user) return;
    const next = { ...user, ...patch };
    setUser(next);
    saveProfileExtras(user.id, {
      onboarded: next.onboarded,
      company_name: next.company_name,
      brand: next.brand,
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <Ctx.Provider value={{ user, session, loading, signIn, signUp, update, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
