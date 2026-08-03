import { createFileRoute } from "@tanstack/react-router";
import { useConnectorStatus, WAITING_COPY } from "@/components/app/DataGate";

/* PLATFORMS — the `v.isPlatforms` block of src/aspen/AspenApp.tsx, on real
   connector status. Shell, header and title come from the /app layout route.

   This screen now owns connector management: the four platform cards the design
   draws, plus the full integration list that used to be the Connectors tab in
   Settings. Keys are still server-side only — nothing here is editable, it
   reports what the server has configured. */

export const Route = createFileRoute("/app/platforms")({
  component: PlatformsPage,
});

// The design's four platform cards. `key` indexes the connector status.
const CARDS: {
  key: "youtube" | "reddit" | "x" | "linkedin";
  glyph: string;
  color: string;
  bandBg: string;
  title: string;
  subtitle: string;
  tag: string;
  body: string;
}[] = [
  { key: "youtube", glyph: "▶", color: "#F03", bandBg: "#FFF0EF", title: "Creator partnerships", subtitle: "Video sponsorships and integrations", tag: "Video", body: "Channel emails, topic clusters and audience fit all read from the YouTube Data API." },
  { key: "reddit", glyph: "r/", color: "#FF4500", bandBg: "#FFF2EC", title: "Audience intelligence", subtitle: "Ad targeting from community signals", tag: "Ads", body: "Subreddit mapping, sentiment and Promoted Posts, seeded by your best-performing videos." },
  { key: "x", glyph: "X", color: "#17141E", bandBg: "#F5F1E9", title: "Creator amplification", subtitle: "DM outreach, whitelisting and paid reach", tag: "Social", body: "Find open-DM creators, run sequences, then whitelist the posts that land as X Ads." },
  { key: "linkedin", glyph: "in", color: "#0A66C2", bandBg: "#EFF5FD", title: "Professional reviews", subtitle: "B2B thought leadership and advocacy", tag: "B2B", body: "Match voices to your buying committee and track which posts influence pipeline." },
];

// Moved here from the Settings > Connectors tab.
const CONNECTOR_ROWS: { key: string; label: string; desc: string }[] = [
  { key: "listening", label: "Social listening", desc: "Chatter and sentiment across the web" },
  { key: "creatorPerformance", label: "Creator performance", desc: "How content performs for creators in your space" },
  { key: "youtube", label: "YouTube Data API", desc: "Video stats and comments" },
  { key: "x", label: "X API", desc: "Posts and search" },
  { key: "reddit", label: "Reddit Data API", desc: "Posts and comments" },
  { key: "trends", label: "Trends", desc: "Search interest over time" },
  { key: "llm", label: "Ad copy model", desc: "Generates ad copy from ranked hooks" },
  { key: "image", label: "Ad imagery", desc: "Generates ad images" },
  { key: "email", label: "Team invite email", desc: "Delivers invitation emails" },
  { key: "adsMiddleware", label: "Ads middleware", desc: "Publishes paid campaigns to Reddit, X, and YouTube" },
  { key: "stripe", label: "Stripe", desc: "Brand billing" },
  { key: "paypal", label: "PayPal Payouts", desc: "Affiliate cash out" },
  { key: "identity", label: "Identity and tax", desc: "Verification before payout" },
];

function PlatformsPage() {
  const status = useConnectorStatus();
  const platform = status.data?.platform as Record<string, boolean> | undefined;

  return (
    <div className="aspen-scope max-w-[1020px]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] gap-[16px]">
        {CARDS.map((p) => {
          const connected = platform?.[p.key] === true;
          return (
            <div key={p.key} className="bg-surface border-[1.5px] border-border rounded-[20px] overflow-hidden">
              <div className="flex items-center gap-[12px] p-[18px_20px]" style={{ background: p.bandBg }}>
                <span className="w-[34px] h-[34px] rounded-[11px] text-surface grid place-items-center font-extrabold text-[13px] shrink-0" style={{ background: p.color }}>{p.glyph}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[15.5px]">{p.title}</div>
                  <div className="text-[12.5px] text-muted mt-[2px]">{p.subtitle}</div>
                </div>
                <span className="text-[11px] font-bold p-[5px_10px] rounded-[8px] bg-surface text-muted">{p.tag}</span>
              </div>
              <div className="p-[18px_20px]">
                <div className="text-[13.5px] text-muted leading-[1.55]">{p.body}</div>
                <div className="flex items-center justify-between gap-[12px] mt-[16px]">
                  <span className="text-[12.5px] font-bold" style={{ color: connected ? "#0E7A3D" : "#8A8494" }}>
                    {status.isLoading ? "Checking…" : connected ? "Connected" : "Not configured"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[12px] font-bold tracking-[0.14em] text-subtle m-[34px_0_14px]">ALL INTEGRATIONS</div>
      <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[20px_22px] mb-[16px]">
        <p className="text-[13.5px] text-muted leading-[1.55] m-0">
          Integration keys are configured on the server by the platform team. They are never stored in the browser.
          Panels that depend on an integration show “{WAITING_COPY}” until it is configured.
        </p>
      </div>

      {status.isLoading ? (
        <div className="text-[13.5px] text-subtle">Loading…</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[12px]">
          {CONNECTOR_ROWS.map((row) => {
            const connected = platform?.[row.key] === true;
            return (
              <div key={row.key} className="bg-surface border-[1.5px] border-border rounded-[16px] p-[16px_18px]">
                <div className="flex items-center justify-between gap-[10px]">
                  <div className="font-bold text-[14.5px]">{row.label}</div>
                  <span
                    className="text-[11px] font-bold p-[4px_9px] rounded-[7px] shrink-0"
                    style={connected ? { background: "#DDF3E6", color: "#0E7A3D" } : { background: "#F5F1E9", color: "#8A8494" }}
                  >
                    {connected ? "✓ Configured" : "Not configured"}
                  </span>
                </div>
                <div className="text-[13px] text-muted mt-[5px] leading-[1.5]">{row.desc}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
