import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/AppShell";
import { Plus, X } from "lucide-react";
import { CampaignIntelligence } from "@/components/app/CampaignIntelligence";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/campaigns/")({
  component: CampaignsPage,
});

type Campaign = Tables<"campaigns">;
type Platform = "YouTube" | "Reddit" | "X" | "LinkedIn" | "All";

const TABS: { key: "active" | "draft" | "completed" | "all"; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "draft", label: "Draft" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

const platColor = (p: string) =>
  p === "YouTube" ? "#FF0000" : p === "Reddit" ? "#FF4500" : p === "X" ? "#1A1A1A" : p === "LinkedIn" ? "#0A66C2" : "#7C3AED";

function CampaignsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"active" | "draft" | "completed" | "all">("active");
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

  const counts = {
    active: rows.filter((c) => c.status === "active").length,
    draft: rows.filter((c) => c.status === "draft").length,
    completed: rows.filter((c) => c.status === "completed").length,
    all: rows.length,
  };
  const visible = tab === "all" ? rows : rows.filter((c) => c.status === tab);

  return (
    <AppShell
      title="Campaigns"
      right={
        <button onClick={() => setDrawer(true)} className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold hover:bg-[#00c472]">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      }
    >
      <div className="flex gap-6 border-b border-white/[0.07] mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-[#00D97E] text-[#00D97E]" : "border-transparent text-[#8892A4] hover:text-white"
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-[#8892A4] py-12 text-center">Loading…</div>
      ) : visible.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-[#8892A4] text-sm">No campaigns yet</div>
          <button
            onClick={() => setDrawer(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 h-10 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold hover:bg-[#00c472]"
          >
            <Plus className="w-4 h-4" /> Create your first campaign
          </button>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((c) => (
            <Card key={c.id} className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-4">
                  <div className="font-bold text-[#F0F4FF]">{c.name}</div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {(c.platforms ?? []).map((p) => (
                      <span key={p} className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: platColor(p) }}>{p}</span>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-5 text-xs text-[#8892A4]">
                  {c.goal ? <div>Goal: {c.goal}</div> : null}
                  {c.product_description ? <div className="line-clamp-1 mt-1">{c.product_description}</div> : null}
                </div>
                <div className="md:col-span-3 flex items-center justify-end gap-3">
                  <StatusBadge s={c.status} />
                  {c.budget ? <span className="text-sm text-[#8892A4]">{c.budget}</span> : null}
                  <button onClick={() => setIntel({ id: c.id, name: c.name })} className="text-sm text-[#8892A4] hover:text-white">Intel</button>
                  <Link to="/app/campaigns/$id" params={{ id: c.id }} className="text-sm text-[#00D97E] hover:underline">Open →</Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {drawer && <CampaignDrawer onClose={() => setDrawer(false)} onCreated={refresh} />}
      {intel && <CampaignIntelligence campaignId={intel.id} campaignName={intel.name} onClose={() => setIntel(null)} />}
    </AppShell>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: "rgba(0,217,126,0.15)", color: "#00D97E", label: "Active" },
    draft: { bg: "rgba(255,255,255,0.08)", color: "#8892A4", label: "Draft" },
    completed: { bg: "rgba(59,130,246,0.15)", color: "#60A5FA", label: "Completed" },
  };
  const v = map[s] ?? { bg: "rgba(255,255,255,0.08)", color: "#8892A4", label: s };
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: v.bg, color: v.color }}>{v.label}</span>;
}

function CampaignDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
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

    toast.success("Campaign created — generating search criteria…", { duration: 2000 });

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
        await supabase
          .from("campaigns")
          .update({ search_criteria: criteria })
          .eq("id", inserted.id);
      }
    } catch (e) {
      console.error("generate-search-criteria failed", e);
    }

    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] bg-[#0C1222] border border-white/10 rounded-2xl shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.07]">
          <h3 className="font-bold text-lg">New Campaign</h3>
          <button onClick={onClose} className="text-[#8892A4] hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <Field label="Campaign Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q3 YouTube Push" className="w-full p-3 rounded-lg bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E] text-white placeholder:text-[#8892A4]" />
          </Field>
          <Field label="Product / Brand Being Promoted">
            <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. Notion Pro" className="w-full p-3 rounded-lg bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E] text-white placeholder:text-[#8892A4]" />
          </Field>
          <Field label="Target Platform">
            <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="w-full p-3 rounded-lg bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E] text-white">
              <option>YouTube</option>
              <option>Reddit</option>
              <option>X</option>
              <option>LinkedIn</option>
              <option>All</option>
            </select>
          </Field>
          <Field label="Campaign Goal">
            <select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full p-3 rounded-lg bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E] text-white">
              <option>Brand Awareness</option>
              <option>Affiliate Sales</option>
              <option>Product Review</option>
              <option>Thought Leadership</option>
            </select>
          </Field>
          <Field label="Budget">
            <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="$0.00" className="w-full p-3 rounded-lg bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E] text-white placeholder:text-[#8892A4]" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-3 rounded-lg bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E] text-white" />
            </Field>
            <Field label="End Date">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-3 rounded-lg bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E] text-white" />
            </Field>
          </div>
          <Field label="Campaign Brief / Notes">
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={4} placeholder="Describe what creators should know about the product..." className="w-full p-3 rounded-lg bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E] text-white placeholder:text-[#8892A4] resize-none" />
          </Field>
        </div>
        <div className="p-6 border-t border-white/[0.07] flex gap-3">
          <button onClick={onClose} disabled={saving} className="flex-1 h-11 rounded-lg border border-white/15 hover:bg-white/5 text-sm font-semibold">Cancel</button>
          <button
            onClick={create}
            disabled={saving}
            className="w-full py-3 rounded-lg bg-[#00D97E] text-[#05080F] font-semibold hover:bg-[#00c472] disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create Campaign →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#8892A4] mb-1.5">{label}</label>
      {children}
    </div>
  );
}
