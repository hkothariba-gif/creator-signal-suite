import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type PlatformFlags = {
  youtube: boolean;
  reddit: boolean;
  x: boolean;
  linkedin: boolean;
};

export type OrgRole = "admin" | "editor" | "reviewer";
export type AccountType = "brand" | "affiliate";

export type BrandProfile = {
  category?: string;
  age?: string;
  gender?: string;
  income?: string;
  notes?: string;
  platforms?: PlatformFlags;
};

export type AuthUser = {
  id: string;
  email: string;
  accountType: AccountType;
  /** Role in the user's organization, read from organization_members. Null when not a member of any organization. */
  role: OrgRole | null;
  organization: { id: string; name: string } | null;
  onboarded: boolean;
  company_name?: string;
  brand?: BrandProfile;
};

type AuthCtx = {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  /** True when the user's role allows writes (admin or editor). Reviewers are read only. */
  canEdit: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; user: AuthUser | null }>;
  signUp: (
    email: string,
    password: string,
    companyName: string,
  ) => Promise<{ error: string | null; user: AuthUser | null }>;
  update: (patch: Partial<Pick<AuthUser, "onboarded" | "company_name" | "brand">>) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
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
  return {
    id: supaUser.id,
    email: supaUser.email ?? "",
    accountType: "brand",
    role: null,
    organization: null,
    onboarded: false,
  };
}

function brandFromJson(json: unknown): BrandProfile {
  const obj = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
  return {
    category: typeof obj.category === "string" ? obj.category : undefined,
    age: typeof obj.age === "string" ? obj.age : undefined,
    gender: typeof obj.gender === "string" ? obj.gender : undefined,
    income: typeof obj.income === "string" ? obj.income : undefined,
    notes: typeof obj.notes === "string" ? obj.notes : undefined,
    platforms: platformsFromArray(Array.isArray(obj.platforms) ? (obj.platforms as string[]) : []),
  };
}

async function hydrateUser(supaUser: User): Promise<AuthUser> {
  const u = baseUser(supaUser);

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", supaUser.id).maybeSingle(),
    supabase
      .from("organization_members")
      .select("role, organizations(id, name, brand_profile)")
      .eq("user_id", supaUser.id)
      .limit(1)
      .maybeSingle(),
  ]);

  if (profile) {
    u.onboarded = profile.onboarded ?? false;
    u.company_name = profile.company_name ?? undefined;
    u.accountType = profile.account_type === "affiliate" ? "affiliate" : "brand";
  }

  if (membership?.organizations) {
    const org = membership.organizations as unknown as {
      id: string;
      name: string;
      brand_profile: unknown;
    };
    u.role = membership.role;
    u.organization = { id: org.id, name: org.name };
    u.brand = brandFromJson(org.brand_profile);
    if (!u.company_name) u.company_name = org.name;
  }

  return u;
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
        setUser((prev) => prev ?? baseUser(s.user));
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

  const refresh = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) setUser(await hydrateUser(data.user));
  };

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
    if (data.session) {
      await supabase.from("profiles").update({ company_name: companyName }).eq("id", data.user.id);
      const u = await hydrateUser(data.user);
      setUser(u);
      setSession(data.session);
      return { error: null, user: u };
    }
    const u: AuthUser = { ...baseUser(data.user), company_name: companyName };
    return { error: null, user: u };
  };

  // Onboarding state and the brand profile live in Supabase.
  // profiles.onboarded holds the flag; organizations.brand_profile holds the brand.
  const update: AuthCtx["update"] = async (patch) => {
    if (!user) return { error: "Not signed in" };

    const nextCompany = patch.company_name ?? user.company_name;

    if (patch.onboarded !== undefined || patch.company_name !== undefined) {
      const { error } = await supabase
        .from("profiles")
        .update({
          ...(patch.onboarded !== undefined ? { onboarded: patch.onboarded } : {}),
          ...(patch.company_name !== undefined ? { company_name: patch.company_name } : {}),
        })
        .eq("id", user.id);
      if (error) return { error: error.message };
    }

    if (patch.brand !== undefined) {
      let orgId = user.organization?.id ?? null;
      if (!orgId) {
        // First write creates the organization. The database trigger makes
        // the creator its admin.
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .insert({ name: nextCompany || user.email, created_by: user.id })
          .select("id")
          .single();
        if (orgError || !org) return { error: orgError?.message ?? "Could not create organization" };
        orgId = org.id;
      }
      const merged: BrandProfile = { ...(user.brand ?? {}), ...patch.brand };
      const { error } = await supabase
        .from("organizations")
        .update({
          brand_profile: {
            category: merged.category ?? null,
            age: merged.age ?? null,
            gender: merged.gender ?? null,
            income: merged.income ?? null,
            notes: merged.notes ?? null,
            platforms: platformsToArray(merged.platforms),
          },
        })
        .eq("id", orgId);
      if (error) return { error: error.message };
    }

    await refresh();
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const canEdit = user?.role === "admin" || user?.role === "editor";

  return (
    <Ctx.Provider value={{ user, session, loading, canEdit, signIn, signUp, update, refresh, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
