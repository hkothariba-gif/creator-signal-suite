import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type PlatformFlags = {
  youtube: boolean;
  reddit: boolean;
  x: boolean;
  linkedin: boolean;
};

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
    platforms?: PlatformFlags;
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
  update: (patch: Partial<AuthUser>) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const PLATFORM_KEYS: (keyof PlatformFlags)[] = ["youtube", "reddit", "x", "linkedin"];

function platformsFromArray(arr: string[] | null | undefined): PlatformFlags {
  const set = new Set((arr ?? []).map((s) => s.toLowerCase()));
  return {
    youtube: set.has("youtube"),
    reddit: set.has("reddit"),
    x: set.has("x"),
    linkedin: set.has("linkedin"),
  };
}

function platformsToArray(flags: PlatformFlags | undefined): string[] {
  if (!flags) return [];
  return PLATFORM_KEYS.filter((k) => flags[k]);
}

function baseUser(supaUser: User): AuthUser {
  const email = supaUser.email ?? "";
  const isAdmin = email.trim().toLowerCase() === "admin@aspenreach.com";
  return {
    id: supaUser.id,
    email,
    role: isAdmin ? "admin" : "user",
    onboarded: isAdmin ? true : false,
  };
}

async function hydrateUser(supaUser: User): Promise<AuthUser> {
  const u = baseUser(supaUser);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", supaUser.id)
    .maybeSingle();
  if (error || !data) return u;
  return {
    ...u,
    onboarded: u.role === "admin" ? true : data.onboarded ?? false,
    company_name: data.company_name ?? undefined,
    brand: {
      category: data.category ?? undefined,
      age: data.target_age ?? undefined,
      gender: data.target_gender ?? undefined,
      income: data.target_income ?? undefined,
      notes: data.notes ?? undefined,
      platforms: platformsFromArray(data.platforms),
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        // Defer async fetch to avoid deadlocks in the auth callback.
        setUser(baseUser(s.user));
        hydrateUser(s.user).then(setUser).catch(() => {});
      } else {
        setUser(null);
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        setUser(await hydrateUser(data.session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthCtx["signIn"] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: error?.message ?? "Sign in failed", user: null };
    const u = await hydrateUser(data.user);
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
    // Trigger inserts profile row; set company_name if session is available.
    if (data.session) {
      await supabase
        .from("profiles")
        .update({ company_name: companyName })
        .eq("id", data.user.id);
      const u = await hydrateUser(data.user);
      setUser(u);
      setSession(data.session);
      return { error: null, user: u };
    }
    const u: AuthUser = { ...baseUser(data.user), company_name: companyName };
    return { error: null, user: u };
  };

  const update: AuthCtx["update"] = async (patch) => {
    if (!user) return { error: "Not signed in" };
    const next: AuthUser = {
      ...user,
      ...patch,
      brand: { ...(user.brand ?? {}), ...(patch.brand ?? {}) },
    };
    const row = {
      id: user.id,
      email: user.email,
      company_name: next.company_name ?? null,
      onboarded: next.onboarded ?? false,
      category: next.brand?.category ?? null,
      target_age: next.brand?.age ?? null,
      target_gender: next.brand?.gender ?? null,
      target_income: next.brand?.income ?? null,
      notes: next.brand?.notes ?? null,
      platforms: platformsToArray(next.brand?.platforms),
    };
    const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
    if (error) return { error: error.message };
    setUser(next);
    return { error: null };
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
