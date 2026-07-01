import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/AppShell";
import { Plus, X } from "lucide-react";
import { CampaignIntelligence } from "@/components/app/CampaignIntelligence";

export const Route = createFileRoute("/app/campaigns")({
  component: CampaignsPage,
});

type Status = "Active" | "Draft" | "Completed";
type Platform = "YouTube" | "Reddit" | "X" | "LinkedIn" | "All";

const CAMPAIGNS: { name: string; campaignId: string; platforms: Platform[]; status: Status; done: number; total: number; budget: string }[] = [
  { name: "Summer Tech Drop", campaignId: "camp_001", platforms: ["YouTube", "Reddit"], status: "Active", done: 14, total: 20, budget: "$8,400" },
  { name: "Home Lab Awareness", campaignId: "camp_002", platforms: ["Reddit"], status: "Active", done: 8, total: 12, budget: "$3,200" },
  { name: "SaaS Tool Launch", campaignId: "camp_001", platforms: ["YouTube", "X", "LinkedIn"], status: "Active", done: 6, total: 15, budget: "$12,000" },
  { name: "Q4 Holiday Push", campaignId: "camp_001", platforms: ["All"], status: "Draft", done: 0, total: 0, budget: "Budget TBD" },
  { name: "Spring Fitness", campaignId: "camp_002", platforms: ["YouTube"], status: "Completed", done: 20, total: 20, budget: "$6,000" },
  { name: "Crypto Community", campaignId: "camp_002", platforms: ["Reddit", "X"], status: "Completed", done: 18, total: 18, budget: "$4,500" },
  { name: "B2B Thought Leadership", campaignId: "camp_001", platforms: ["LinkedIn"], status: "Active", done: 4, total: 10, budget: "$7,500" },
];

const TABS: { key: "Active" | "Draft" | "Completed" | "All"; label: string }[] = [
  { key: "Active", label: "Active" },
  { key: "Draft", label: "Draft" },
  { key: "Completed", label: "Completed" },
  { key: "All", label: "All" },
];

const platColor = (p: Platform) => p === "YouTube" ? "#FF0000" : p === "Reddit" ? "#FF4500" : p === "X" ? "#1A1A1A" : p === "LinkedIn" ? "#0A66C2" : "#7C3AED";
const platText = (_p: Platform) => "#fff";

function CampaignsPage() {
  const [tab, setTab] = useState<"Active" | "Draft" | "Completed" | "All">("Active");
  const [drawer, setDrawer] = useState(false);
  const [intel, setIntel] = useState<{ id: string; name: string } | null>(null);

  const counts = {
    Active: CAMPAIGNS.filter((c) => c.status === "Active").length,
    Draft: CAMPAIGNS.filter((c) => c.status === "Draft").length,
    Completed: CAMPAIGNS.filter((c) => c.status === "Completed").length,
    All: CAMPAIGNS.length,
  };
  const visible = tab === "All" ? CAMPAIGNS : CAMPAIGNS.filter((c) => c.status === tab);

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

      <div className="space-y-3">
        {visible.map((c) => {
          const pct = c.total > 0 ? (c.done / c.total) * 100 : 0;
          return (
            <Card key={c.name} className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-4">
                  <div className="font-bold text-[#F0F4FF]">{c.name}</div>
                  <div className="flex gap-1.5 mt-2">
                    {c.platforms.map((p) => (
                      <span key={p} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: platColor(p), color: platText(p) }}>{p}</span>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-5">
                  <div className="text-xs text-[#8892A4] mb-1.5">{c.done} of {c.total} creators contacted</div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#00D97E]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="md:col-span-3 flex items-center justify-end gap-3">
                  <StatusBadge s={c.status} />
                  <span className="text-sm text-[#8892A4]">{c.budget}</span>
                  <button onClick={() => setIntel({ id: c.campaignId, name: c.name })} className="text-sm text-[#8892A4] hover:text-white">Intel</button>
                  <Link to="/app/campaigns/$id" params={{ id: c.campaignId }} className="text-sm text-[#00D97E] hover:underline">Open →</Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {drawer && <CampaignDrawer onClose={() => setDrawer(false)} />}
      {intel && <CampaignIntelligence campaignId={intel.id} campaignName={intel.name} onClose={() => setIntel(null)} />}
    </AppShell>
  );
}

function StatusBadge({ s }: { s: Status }) {
  const map = {
    Active: { bg: "rgba(0,217,126,0.15)", color: "#00D97E" },
    Draft: { bg: "rgba(255,255,255,0.08)", color: "#8892A4" },
    Completed: { bg: "rgba(59,130,246,0.15)", color: "#60A5FA" },
  };
  const v = map[s];
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: v.bg, color: v.color }}>{s}</span>;
}

function CampaignDrawer({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [product, setProduct] = useState("");
  const [platform, setPlatform] = useState<Platform>("All");
  const [goal, setGoal] = useState("Brand Awareness");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [brief, setBrief] = useState("");

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
            <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="$0.00" className="w-full p-3 rounded-lg bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E] text-white placeholder:text-[#8892A4]" />
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
          <button onClick={onClose} className="flex-1 h-11 rounded-lg border border-white/15 hover:bg-white/5 text-sm font-semibold">Cancel</button>
          <button
            onClick={() => {
              if (!name.trim()) {
                toast.error("Campaign Name is required.");
                return;
              }
              const existing = JSON.parse(localStorage.getItem("ar_campaigns") || "[]");
              const newCampaign = {
                id: "camp_" + Math.random().toString(36).slice(2, 10),
                name: name.trim(),
                product: product.trim(),
                platform,
                goal,
                budget,
                startDate,
                endDate,
                brief: brief.trim(),
                status: "draft",
                createdAt: Date.now(),
              };
              localStorage.setItem("ar_campaigns", JSON.stringify([...existing, newCampaign]));
              toast.success("Campaign created!", { duration: 2000 });
              onClose();
            }}
            className="w-full py-3 rounded-lg bg-[#00D97E] text-[#05080F] font-semibold hover:bg-[#00c472]"
          >
            Create Campaign →
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
