import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CampaignIntelligence } from "@/components/app/CampaignIntelligence";
import { DataGate } from "@/components/app/DataGate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

/* CAMPAIGNS — the `v.isCampaigns` block of src/aspen/AspenApp.tsx, on the live
   hooks the dark version used. Shell, header and title come from the /app
   layout route.

   The row actions the design does not draw (Activate / Complete / Intel) are
   kept — they are the only way to move a campaign's status — and restyled as
   Aspen buttons rather than dropped. CampaignDrawer is exported from here as
   before, because app.ads imports it. */

export const Route = createFileRoute("/app/campaigns/")({
  component: CampaignsPage,
});

type Campaign = Tables<"campaigns">;
type Platform = "YouTube" | "Reddit" | "X" | "LinkedIn" | "All";

const TABS: { key: "all" | "active" | "draft" | "completed"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "draft", label: "Draft" },
  { key: "completed", label: "Completed" },
];

// The design's platform chips, keyed to the same brand colours it used.
const platColor = (p: string) =>
  p === "YouTube" ? "#F03" : p === "Reddit" ? "#FF4500" : p === "X" ? "#17141E" : p === "LinkedIn" ? "#0A66C2" : "#8A8494";

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  active: { bg: "#DDF3E6", fg: "#0E7A3D", label: "Active" },
  draft: { bg: "#F5F1E9", fg: "#8A8494", label: "Draft" },
  completed: { bg: "#E7EDFB", fg: "#3159A8", label: "Completed" },
};

function CampaignsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { new: openNew } = useSearch({ from: "/app/campaigns" });
  // Default to "all": new campaigns start as drafts, and landing on an empty
  // Active tab made people think creation had failed.
  const [tab, setTab] = useState<"all" | "active" | "draft" | "completed">("all");
  const [drawer, setDrawer] = useState(false);
  const [intel, setIntel] = useState<{ id: string; name: string } | null>(null);
  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // The shell's "+ New campaign" button links here with ?new=1. Consume the
  // param so a refresh or a back-navigation does not reopen the drawer.
  useEffect(() => {
    if (openNew) {
      setDrawer(true);
      navigate({ to: "/app/campaigns", search: { new: undefined }, replace: true });
    }
  }, [openNew, navigate]);

  const setStatus = async (c: Campaign, status: "active" | "draft" | "completed") => {
    const { error } = await supabase.from("campaigns").update({ status }).eq("id", c.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "active" ? `${c.name} is live` : `${c.name} → ${status}`);
    await refresh();
  };

  const counts = {
    all: rows.length,
    active: rows.filter((c) => c.status === "active").length,
    draft: rows.filter((c) => c.status === "draft").length,
    completed: rows.filter((c) => c.status === "completed").length,
  };
  const visible = tab === "all" ? rows : rows.filter((c) => c.status === tab);

  return (
    <div className="aspen-scope">
      <div className="flex gap-[26px] border-b-[1.5px] border-border mb-[22px]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="border-0 bg-transparent cursor-pointer p-[0_0_13px] text-[14.5px] font-bold mb-[-1.5px]"
            style={{
              color: tab === t.key ? "#17141E" : "#8A8494",
              borderBottom: `2.5px solid ${tab === t.key ? "#F2542D" : "transparent"}`,
            }}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      <DataGate connected={true} loading={loading} empty={visible.length === 0}>
        <div className="flex flex-col gap-[12px]">
          {visible.map((c) => {
            const s = STATUS_STYLE[c.status] ?? { bg: "#F5F1E9", fg: "#8A8494", label: c.status };
            return (
              <div key={c.id} className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px_24px] flex gap-[24px] items-center flex-wrap">
                <div className="flex-[1_1_260px] min-w-0">
                  <div className="font-bold text-[16.5px]">{c.name}</div>
                  <div className="flex gap-[6px] mt-[9px] flex-wrap">
                    {(c.platforms ?? []).map((p) => (
                      <span key={p} className="text-[11px] font-bold text-surface p-[4px_9px] rounded-[7px]" style={{ background: platColor(p) }}>{p}</span>
                    ))}
                  </div>
                </div>
                <div className="flex-[1_1_260px] min-w-0 text-[13.5px] text-muted leading-[1.5]">
                  {c.goal ? <div className="font-semibold text-dark">Goal: {c.goal}</div> : null}
                  {c.product_description ? <div className="line-clamp-1">{c.product_description}</div> : null}
                </div>
                <div className="flex items-center gap-[10px] flex-wrap">
                  <span className="text-[12px] font-bold p-[6px_12px] rounded-[8px]" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
                  {c.budget ? <span className="text-[14px] font-bold">{c.budget}</span> : null}
                  {c.status === "draft" ? (
                    <button onClick={() => setStatus(c, "active")} className="border-0 bg-accent text-cream text-[13px] font-bold p-[9px_14px] rounded-[11px] cursor-pointer ah21">Activate</button>
                  ) : null}
                  {c.status === "active" ? (
                    <button onClick={() => setStatus(c, "completed")} className="border-[1.5px] border-border bg-transparent text-[13px] font-bold p-[8px_13px] rounded-[11px] cursor-pointer ah26">Complete</button>
                  ) : null}
                  <button onClick={() => setIntel({ id: c.id, name: c.name })} className="border-[1.5px] border-border bg-transparent text-[13px] font-bold p-[8px_13px] rounded-[11px] cursor-pointer ah26">Intel</button>
                  <Link to="/app/hotlist" search={{ campaign: c.id }} className="border-[1.5px] border-border bg-transparent text-[13.5px] font-bold p-[9px_15px] rounded-[11px] cursor-pointer ah26">Creators</Link>
                  <Link to="/app/campaigns/$id" params={{ id: c.id }} search={{ new: undefined }} className="border-0 bg-dark text-cream text-[13.5px] font-bold p-[10px_16px] rounded-[11px] cursor-pointer ah27">Open →</Link>
                </div>
              </div>
            );
          })}
        </div>
      </DataGate>

      {drawer && <CampaignDrawer onClose={() => setDrawer(false)} onCreated={refresh} />}
      {intel && <CampaignIntelligence campaignId={intel.id} campaignName={intel.name} onClose={() => setIntel(null)} />}
    </div>
  );
}

/* Create-campaign drawer. Same side effects as before — insert, then call the
   generate-search-criteria edge function and store the result on the row — with
   the dark form repainted in the Aspen palette so it does not flash a navy
   modal over a cream page. app.ads imports this. */
export function CampaignDrawer({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (createdId?: string) => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [product, setProduct] = useState("");
  const [platform, setPlatform] = useState<Platform>("All");
  const [goal, setGoal] = useState("Brand Awareness");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [brief, setBrief] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error("Campaign Name is required.");
      return;
    }
    setSaving(true);
    const platforms = platform === "All" ? ["YouTube", "Reddit", "X", "LinkedIn"] : [platform];
    const { data: inserted, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        name: name.trim(),
        product_description: product.trim() || null,
        platforms,
        goal,
        budget: budget || null,
        start_date: startDate || null,
        end_date: endDate || null,
        brief: brief.trim() || null,
        status: "draft",
      })
      .select("*")
      .single();
    if (error || !inserted) {
      setSaving(false);
      toast.error(error?.message ?? "Failed to create campaign");
      return;
    }

    toast.success("Campaign created. Generating search criteria…", { duration: 2000 });

    // Fire-and-await edge function
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-search-criteria`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({
          productDescription: product.trim() || brief.trim() || name.trim(),
          targetAudience: undefined,
          goal,
        }),
      });
      if (res.ok) {
        const criteria = await res.json();
        await supabase.from("campaigns").update({ search_criteria: criteria }).eq("id", inserted.id);
      }
    } catch (e) {
      console.error("generate-search-criteria failed", e);
    }

    setSaving(false);
    onCreated(inserted.id);
    onClose();
  };

  const field = "w-full box-border h-[46px] p-[0_14px] rounded-[12px] border-[1.5px] border-border bg-cream text-[14.5px] outline-none";

  return (
    <div className="aspen-scope fixed inset-0 z-50 flex items-center justify-center p-[16px]">
      <div className="absolute inset-0 bg-[rgba(23,20,30,0.55)]" onClick={onClose} />
      <div className="relative w-full max-w-[520px] max-h-[90vh] bg-surface border-[1.5px] border-border rounded-[22px] overflow-y-auto">
        <div className="flex items-center justify-between p-[22px_24px] border-b-[1.5px] border-border-soft">
          <h3 className="font-heading font-bold text-[19px] m-0">New campaign</h3>
          <button onClick={onClose} className="border-0 bg-transparent text-[18px] text-subtle cursor-pointer ah20" aria-label="Close">✕</button>
        </div>
        <div className="p-[24px] flex flex-col gap-[16px]">
          <Field label="CAMPAIGN NAME">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q3 YouTube push" className={field} />
          </Field>
          <Field label="PRODUCT / BRAND BEING PROMOTED">
            <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. Notion Pro" className={field} />
          </Field>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[16px]">
            <Field label="TARGET PLATFORM">
              <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className={field}>
                <option>YouTube</option>
                <option>Reddit</option>
                <option>X</option>
                <option>LinkedIn</option>
                <option>All</option>
              </select>
            </Field>
            <Field label="CAMPAIGN GOAL">
              <select value={goal} onChange={(e) => setGoal(e.target.value)} className={field}>
                <option>Brand Awareness</option>
                <option>Affiliate Sales</option>
                <option>Product Review</option>
                <option>Thought Leadership</option>
              </select>
            </Field>
          </div>
          <Field label="BUDGET">
            <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="$0.00" className={field} />
          </Field>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[16px]">
            <Field label="START DATE">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={field} />
            </Field>
            <Field label="END DATE">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={field} />
            </Field>
          </div>
          <Field label="CAMPAIGN BRIEF / NOTES">
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={4} placeholder="Describe what creators should know about the product…" className="w-full box-border p-[13px] rounded-[12px] border-[1.5px] border-border bg-cream text-[14px] leading-[1.55] outline-none resize-y" />
          </Field>
        </div>
        <div className="p-[20px_24px] border-t-[1.5px] border-border-soft flex gap-[10px]">
          <button onClick={onClose} disabled={saving} className="flex-1 border-[1.5px] border-border bg-transparent text-[14px] font-bold p-[12px_0] rounded-[12px] cursor-pointer ah26 disabled:opacity-60">Cancel</button>
          <button onClick={create} disabled={saving} className="flex-[2] border-0 bg-accent text-cream text-[14px] font-bold p-[13px_0] rounded-[12px] cursor-pointer ah21 disabled:opacity-60">
            {saving ? "Creating…" : "Create campaign →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11.5px] font-bold tracking-[0.1em] text-subtle mb-[7px]">{label}</div>
      {children}
    </div>
  );
}
