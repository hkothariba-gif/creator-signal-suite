import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useConnectorStatus } from "@/components/app/DataGate";
import { supabase } from "@/integrations/supabase/client";
import "@/aspen/aspen.css";


export const Route = createFileRoute("/app")({
  component: AppLayout,
});

/* The Aspen app shell — sidebar, header and the `.aspen-scope` wrapper that
   rebinds the four colliding design tokens (see src/styles.css). This is the
   shell half of src/aspen/AspenApp.tsx (deleted once the split landed — it is
   in git history, and the per-screen comments still name their block); the
   twelve screen blocks it used to
   switch between with `state.screen` now live in the app.*.tsx routes and
   render through the <Outlet /> below. */

type AspenCampaign = {
  id: string;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
};

/* The sidebar's CAMPAIGN block is the Aspen design's campaign selector, and it
   replaces the dark <CampaignPicker> that used to sit in each screen's header.
   Discovery, Hotlist and the Ads Center all scope to whatever is chosen here,
   so the selection is shared through context rather than re-picked per screen.
   `campaigns` is empty until the user has created one — screens fall back to
   their unscoped behaviour in that case, exactly as they did with no picker
   value. */
type CampaignContextValue = {
  campaigns: AspenCampaign[];
  selected: AspenCampaign | null;
  selectedId: string | undefined;
};

const CampaignContext = createContext<CampaignContextValue>({
  campaigns: [],
  selected: null,
  selectedId: undefined,
});

export const useAspenCampaign = () => useContext(CampaignContext);

/* `state.screen` → the header's title and subtitle. Keyed by route path now,
   matched longest-prefix-first so /app/creators/$id wins over /app. */
const SCREEN_META: [string, string, string][] = [
  ["/app/campaigns", "Campaigns", "Every campaign, its platforms and its stage"],
  ["/app/discovery", "Creator discovery", "YouTube search — more platforms as they connect"],
  ["/app/creators", "Creator profile", "Fit, contact paths and stage"],
  ["/app/hotlist", "Hotlist CRM", "Creators for this campaign, scored and staged"],
  ["/app/outreach", "Outreach inbox", "Email, X, Reddit and LinkedIn in one thread list"],
  ["/app/ads", "Ads Center", "Ads built from real audience language"],
  ["/app/affiliate", "Affiliate & payouts", "Tracking links, conversions and what you owe"],
  ["/app/community", "Community signals", "Reddit and X conversations about your category"],
  ["/app/expansion", "Expansion & upsell", "Scale what already works"],
  ["/app/platforms", "Platforms", "Connections that power discovery, ads and attribution"],
  ["/app/settings", "Settings", "Workspace, team and billing"],
];

const HOME_META: [string, string] = ["Home", "What moved across your campaigns today"];

// "1 Aug – 30 Sep · Affiliate Sales", skipping whichever half is missing.
function campaignSubtitle(c: AspenCampaign): string {
  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : null;
  const from = fmt(c.start_date);
  const to = fmt(c.end_date);
  const range = from && to ? `${from} – ${to}` : from ? `From ${from}` : to ? `Until ${to}` : null;
  return [range, c.goal].filter(Boolean).join(" · ");
}

/* The sidebar nav, from the design's `nav` array. `match` is the path prefix
   that lights the item up; discovery also owns creator profiles, the way
   `key === 'discovery' && s.screen === 'creator'` did.

   `count` names which real number the badge shows. The design hard-coded 4 / 42
   / 9; two of those have a source, and the ones that do not (community signals,
   outreach) show nothing rather than a number we would be inventing — outreach
   threads need a server call this layout should not make on every navigation. */
const NAV = [
  {
    title: "WORKSPACE",
    items: [
      { to: "/app", label: "Home", count: null, match: ["/app"], exact: true },
      {
        to: "/app/campaigns",
        label: "Campaigns",
        count: "campaigns",
        match: ["/app/campaigns"],
        exact: false,
      },
    ],
  },
  {
    title: "FIND",
    items: [
      {
        to: "/app/discovery",
        label: "Discovery",
        count: null,
        match: ["/app/discovery", "/app/creators"],
        exact: false,
      },
      {
        to: "/app/hotlist",
        label: "Hotlist CRM",
        count: "hotlist",
        match: ["/app/hotlist"],
        exact: false,
      },
      {
        to: "/app/community",
        label: "Community signals",
        count: null,
        match: ["/app/community"],
        exact: false,
      },
    ],
  },
  {
    title: "RUN",
    items: [
      {
        to: "/app/outreach",
        label: "Outreach inbox",
        count: null,
        match: ["/app/outreach"],
        exact: false,
      },
      { to: "/app/ads", label: "Ads Center", count: null, match: ["/app/ads"], exact: false },
    ],
  },
  {
    title: "PROVE",
    items: [
      {
        to: "/app/affiliate",
        label: "Affiliate & payouts",
        count: null,
        match: ["/app/affiliate"],
        exact: false,
      },
      {
        to: "/app/expansion",
        label: "Expansion",
        count: null,
        match: ["/app/expansion"],
        exact: false,
      },
    ],
  },
  {
    title: "SETUP",
    items: [
      {
        to: "/app/platforms",
        label: "Platforms",
        count: null,
        match: ["/app/platforms"],
        exact: false,
      },
      {
        to: "/app/settings",
        label: "Settings",
        count: null,
        match: ["/app/settings"],
        exact: false,
      },
    ],
  },
] as const;


// Testers without a Supabase session can still reach the shell once they have
// walked the onboarding flow locally. Real users always take the auth path.
function hasTesterBypass(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      !!localStorage.getItem("aspen_tester_email") &&
      localStorage.getItem("aspen_onboarded") === "true"
    );
  } catch {
    return false;
  }
}

// The shell's shape is fixed, so it is drawn while the session resolves instead
// of blanking the viewport.
function ShellSkeleton() {
  return (
    <div className="aspen-scope flex min-h-screen bg-cream">
      <aside className="w-[246px] shrink-0 bg-dark p-[22px_16px] flex flex-col gap-[18px]">
        <div className="h-[28px] w-[110px] rounded-[9px] bg-dark-raised animate-pulse" />
        <div className="h-[58px] rounded-[14px] bg-dark-raised animate-pulse" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[34px] rounded-[11px] bg-dark-raised animate-pulse" />
        ))}
      </aside>
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="p-[20px_32px] border-b-[1.5px] border-border">
          <div className="h-[28px] w-[220px] rounded-[8px] bg-sand animate-pulse" />
          <div className="h-[14px] w-[300px] rounded-[6px] bg-sand animate-pulse mt-[8px]" />
        </header>
        <div className="p-[28px_32px] grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[16px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] rounded-[20px] bg-surface border-[1.5px] border-border animate-pulse"
            />
          ))}
        </div>
      </main>
    </div>
  );
}

// Real-auth gating. Access to /app requires an authenticated Supabase user and a
// finished onboarding run; while the session loads we draw the shell skeleton.
function AppLayout() {
  const { user, loading, logout } = useAuth();

  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [campaignIndex, setCampaignIndex] = useState(0);

  const campaignQuery = useQuery({
    queryKey: ["shell-campaigns", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("id,name,goal,start_date,end_date")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as AspenCampaign[];
    },
  });

  // Two guards, not one. An unauthenticated visitor goes to login; a signed-in
  // user who never finished onboarding has no organization, so every org-scoped
  // screen inside the shell would fail in its own way. Send them to /onboarding
  // once, from here, instead of letting each screen invent an empty state.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!user.onboarded && !hasTesterBypass()) navigate({ to: "/onboarding" });
  }, [loading, user, navigate]);


  const connectorStatus = useConnectorStatus();

  const hotlistCount = useQuery({
    queryKey: ["shell-hotlist-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("hotlist")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count ?? 0;
    },
  });

  const campaigns = campaignQuery.data ?? [];
  const selected = campaigns.length ? campaigns[campaignIndex % campaigns.length] : null;

  const p = connectorStatus.data?.platform;
  const platformsConnected = p ? [p.youtube, p.reddit, p.x, p.listening].filter(Boolean).length : 0;

  // Zero is not worth a badge — the design only shows one when there is
  // something to look at.
  const badges: Record<string, string> = {
    campaigns: campaigns.length ? String(campaigns.length) : "",
    hotlist: hotlistCount.data ? String(hotlistCount.data) : "",
  };

  // Returning null here used to blank the whole viewport while the session
  // resolved. The shell's shape is known before the data is, so draw it.
  if (loading || !user) return <ShellSkeleton />;


  const initials = (user.email ?? "?").slice(0, 2).toUpperCase();
  /* Campaign detail titles itself: the screen deliberately does not repeat the
     campaign name in its own header card, so the name belongs up here with the
     date range and goal as the subtitle. The shell already holds every campaign
     for the switcher, so this is a lookup rather than another fetch. */
  const detailId = pathname.startsWith("/app/campaigns/")
    ? pathname.slice("/app/campaigns/".length).split("/")[0]
    : null;
  const detail = detailId ? campaigns.find((c) => c.id === detailId) : undefined;

  const meta = SCREEN_META.find(([prefix]) => pathname.startsWith(prefix));
  let [title, subtitle] = meta ? [meta[1], meta[2]] : HOME_META;
  if (detailId) {
    title = detail?.name ?? "Campaign";
    subtitle = detail ? campaignSubtitle(detail) : "";
  }

  const isActive = (item: { to: string; match: readonly string[]; exact: boolean }) =>
    item.exact
      ? pathname === item.to
      : item.match.some((m) => pathname === m || pathname.startsWith(m + "/"));

  return (
    <CampaignContext.Provider value={{ campaigns, selected, selectedId: selected?.id }}>
      <div className="aspen-scope flex min-h-screen bg-cream">
        {/* SIDEBAR */}
        <aside className="w-[246px] shrink-0 bg-dark text-cream p-[22px_16px] flex flex-col gap-[26px] sticky top-0 h-[100vh] box-border overflow-y-auto">
          <Link to="/" className="flex items-center gap-[10px] p-[0_8px]">
            <div className="w-[28px] h-[28px] rounded-[9px] bg-accent grid place-items-center text-cream font-heading font-extrabold text-[16px]">
              a
            </div>
            <span className="font-heading font-extrabold text-[19px] tracking-[-0.02em] text-cream">
              aspen
            </span>
          </Link>

          <div className="bg-dark-raised rounded-[14px] p-[12px_13px]">
            <div className="text-[10.5px] font-bold tracking-[0.12em] text-subtle">CAMPAIGN</div>
            <div className="flex items-center justify-between gap-[8px] mt-[6px]">
              <span className="font-bold text-[14px] text-cream truncate">
                {campaignQuery.isLoading ? "Loading…" : (selected?.name ?? "No campaigns yet")}
              </span>
              {campaigns.length > 1 ? (
                <button
                  onClick={() => setCampaignIndex((c) => (c + 1) % campaigns.length)}
                  className="border-0 bg-transparent text-subtle text-[13px] font-bold cursor-pointer ah20 shrink-0"
                  aria-label="Switch campaign"
                >
                  ⇄
                </button>
              ) : null}
            </div>
          </div>

          {NAV.map((g) => (
            <div key={g.title} className="flex flex-col gap-[3px]">
              <div className="text-[10.5px] font-bold tracking-[0.14em] text-dark-muted p-[0_10px_6px]">
                {g.title}
              </div>
              {g.items.map((i) => {
                const on = isActive(i);
                return (
                  <Link
                    key={i.to}
                    to={i.to}
                    aria-current={on ? "page" : undefined}
                    className={`flex items-center justify-between gap-[8px] w-full text-left border-0 cursor-pointer p-[9px_11px] rounded-[11px] text-[14.5px] font-semibold ${
                      on ? "bg-accent text-cream" : "bg-transparent text-dark-muted"
                    }`}
                  >
                    {i.label}
                    <span
                      className={`text-[11px] font-bold ${on ? "text-cream" : "text-subtle"}`}
                    >
                      {i.count ? (badges[i.count] ?? "") : ""}
                    </span>
                  </Link>

                );
              })}
            </div>
          ))}

          {/* The design draws this block as static text. It carries the real
              session now, and a log out control — the Aspen shell had none at
              all, so signing out meant clearing storage by hand. */}
          <div className="mt-[auto] border-t-[1px] border-dark-border pt-[16px] flex items-center gap-[10px]">
            <div className="w-[32px] h-[32px] rounded-[10px] bg-highlight text-dark grid place-items-center font-extrabold text-[13px] shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold text-cream truncate" title={user.email}>
                {user.email}
              </div>
              <div className="text-[11.5px] text-subtle truncate">
                {[user.organization?.name ?? user.company_name, user.role]
                  .filter(Boolean)
                  .join(" · ") || "No organization yet"}
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  await logout();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not log out — try again");
                  return;
                }
                navigate({ to: "/login" });
              }}

              className="border-0 bg-transparent text-subtle text-[11.5px] font-bold cursor-pointer ah20 shrink-0"
              title="Log out"
            >
              Log out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="flex items-center justify-between gap-[20px] p-[20px_32px] border-b-[1.5px] border-border bg-cream sticky top-0 z-10 flex-wrap">
            <div>
              <h1 className="font-heading font-extrabold text-[26px] tracking-[-0.025em] m-0">
                {title}
              </h1>
              <div className="text-[13.5px] text-subtle mt-[2px]">{subtitle}</div>
            </div>
            <div className="flex items-center gap-[10px]">
              {/* The design hard-codes "4 platforms connected". It counts the
                  four platform connectors for real — otherwise it contradicts
                  the Platforms screen sitting one click away. */}
              <Link
                to="/app/platforms"
                className="inline-flex items-center gap-[8px] bg-surface border-[1.5px] border-border rounded-[11px] p-[9px_13px] text-[13px] font-semibold text-muted"
              >
                <span
                  className="w-[8px] h-[8px] rounded-full"
                  style={{ background: platformsConnected > 0 ? "#1FA463" : "#C9C1B4" }}
                ></span>
                {connectorStatus.isLoading
                  ? "Checking platforms…"
                  : `${platformsConnected} of 4 platforms connected`}
              </Link>
              <Link
                to="/app/campaigns"
                search={{ new: true }}
                className="border-0 bg-accent text-cream text-[14px] font-bold p-[11px_18px] rounded-[12px] cursor-pointer ah21"
              >
                + New campaign
              </Link>
            </div>
          </header>

          <div className="p-[28px_32px_64px] flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </CampaignContext.Provider>
  );
}
