import { createFileRoute } from "@tanstack/react-router";
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

const CAMPAIGNS: { name: string; platforms: Platform[]; status: Status; done: number; total: number; budget: string }[] = [
  { name: "Summer Tech Drop", platforms: ["YouTube", "Reddit"], status: "Active", done: 14, total: 20, budget: "$8,400" },
  { name: "Home Lab Awareness", platforms: ["Reddit"], status: "Active", done: 8, total: 12, budget: "$3,200" },
  { name: "SaaS Tool Launch", platforms: ["YouTube", "X", "LinkedIn"], status: "Active", done: 6, total: 15, budget: "$12,000" },
  { name: "Q4 Holiday Push", platforms: ["All"], status: "Draft", done: 0, total: 0, budget: "Budget TBD" },
  { name: "Spring Fitness", platforms: ["YouTube"], status: "Completed", done: 20, total: 20, budget: "$6,000" },
  { name: "Crypto Community", platforms: ["Reddit", "X"], status: "Completed", done: 18, total: 18, budget: "$4,500" },
  { name: "B2B Thought Leadership", platforms: ["LinkedIn"], status: "Active", done: 4, total: 10, budget: "$7,500" },
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
                  <a href="#" className="text-sm text-[#00D97E] hover:underline">Open →</a>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {drawer && <CampaignDrawer onClose={() => setDrawer(false)} />}
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
  const [plats, setPlats] = useState({ youtube: true, reddit: false, x: false, linkedin: false });
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-[480px] h-full bg-[#0C1222] border-l border-white/[0.07] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.07]">
          <h3 className="font-bold text-lg">New Campaign</h3>
          <button onClick={onClose} className="text-[#8892A4] hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <Field label="Campaign name">
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-11 px-4 rounded-lg bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E]" />
          </Field>
          <Field label="Platforms">
            <div className="space-y-2">
              {([
                ["youtube", "YouTube", "#FF0000"],
                ["reddit", "Reddit", "#FF4500"],
                ["x", "X / Twitter", "#1A1A1A"],
                ["linkedin", "LinkedIn", "#0A66C2"],
              ] as const).map(([k, l, c]) => (
                <label key={k} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#131D2E] border border-white/10 cursor-pointer">
                  <input type="checkbox" checked={(plats as any)[k]} onChange={(e) => setPlats((p) => ({ ...p, [k]: e.target.checked }))} />
                  <span className="w-3 h-3 rounded" style={{ background: c }} />
                  <span className="text-sm">{l}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Budget ($)">
            <input type="number" placeholder="5000" className="w-full h-11 px-4 rounded-lg bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E]" />
          </Field>
          <Field label="Goal">
            <select className="w-full h-11 px-3 rounded-lg bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E]">
              <option>Brand Awareness</option><option>Product Launch</option><option>Affiliate Sales</option><option>Community Building</option>
            </select>
          </Field>
          <Field label="Target creator count">
            <input type="number" placeholder="20" className="w-full h-11 px-4 rounded-lg bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E]" />
          </Field>
          <Field label="Start date">
            <input type="date" className="w-full h-11 px-4 rounded-lg bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E]" />
          </Field>
        </div>
        <div className="p-6 border-t border-white/[0.07] flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 rounded-lg border border-white/15 hover:bg-white/5 text-sm font-semibold">Cancel</button>
          <button
            onClick={() => { toast.success("Campaign created! Add creators in Discovery."); onClose(); }}
            className="flex-1 h-11 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold hover:bg-[#00c472]"
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
