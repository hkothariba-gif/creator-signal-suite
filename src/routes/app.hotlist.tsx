import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { GripVertical } from "lucide-react";

export const Route = createFileRoute("/app/hotlist")({
  component: HotlistPage,
});

type Platform = "YouTube" | "Reddit" | "X" | "LinkedIn";
type Creator = { name: string; platform: Platform; stats: string; fit: number; cpm: string };
type Col = { key: string; label: string; items: Creator[] };

const initial: Col[] = [
  { key: "saved", label: "Saved", items: [
    { name: "TechWithMarcus", platform: "YouTube", stats: "340K subs • 6.2% eng", fit: 94, cpm: "$14-$32" },
    { name: "r/homelab", platform: "Reddit", stats: "847K members • 4.8% eng", fit: 89, cpm: "$8-$18" },
    { name: "@buildinpublic_sara", platform: "X", stats: "128K followers • 4.8% eng", fit: 82, cpm: "$6-$14" },
    { name: "Lena Park", platform: "LinkedIn", stats: "42K followers • Director, B2B SaaS", fit: 87, cpm: "$18-$36" },
    { name: "GadgetGuru", platform: "YouTube", stats: "210K subs • 5.1% eng", fit: 78, cpm: "$12-$24" },
  ]},
  { key: "contacted", label: "Contacted", items: [
    { name: "NightOwlTech", platform: "YouTube", stats: "180K subs • 7.3% eng", fit: 85, cpm: "$10-$22" },
    { name: "r/personalfinance", platform: "Reddit", stats: "1.2M members • 3.2% eng", fit: 76, cpm: "$10-$20" },
    { name: "@devtools_daily", platform: "X", stats: "45K followers • 8.1% eng", fit: 88, cpm: "$4-$10" },
    { name: "Marcus Chen", platform: "LinkedIn", stats: "78K followers • VP Product", fit: 81, cpm: "$22-$40" },
  ]},
  { key: "negotiating", label: "Negotiating", items: [
    { name: "CodeWithChris", platform: "YouTube", stats: "520K subs • 4.9% eng", fit: 91, cpm: "$18-$40" },
    { name: "r/SaaSFounders", platform: "Reddit", stats: "340K members • 5.6% eng", fit: 73, cpm: "$12-$22" },
  ]},
  { key: "contracted", label: "Contracted", items: [
    { name: "ProductivityPro", platform: "YouTube", stats: "95K subs • 8.9% eng", fit: 86, cpm: "$8-$18" },
    { name: "r/entrepreneur", platform: "Reddit", stats: "2.1M members • 2.8% eng", fit: 80, cpm: "$14-$28" },
  ]},
  { key: "live", label: "Live / Posted", items: [
    { name: "TechReviewHub", platform: "YouTube", stats: "1.1M subs • 3.4% eng", fit: 79, cpm: "$22-$48" },
  ]},
];

const platBadge = (p: Platform) => {
  if (p === "YouTube") return { bg: "rgba(255,0,0,0.15)", color: "#FF6B6B" };
  if (p === "Reddit") return { bg: "rgba(255,69,0,0.15)", color: "#FF7B3D" };
  if (p === "LinkedIn") return { bg: "rgba(10,102,194,0.15)", color: "#5BA4F5" };
  return { bg: "rgba(255,255,255,0.1)", color: "#FFFFFF" };
};

const fitBadge = (n: number) => {
  if (n >= 80) return { bg: "rgba(0,217,126,0.15)", color: "#00D97E" };
  if (n >= 60) return { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" };
  return { bg: "rgba(239,68,68,0.15)", color: "#EF4444" };
};

function HotlistPage() {
  const [cols] = useState<Col[]>(initial);
  const [addModal, setAddModal] = useState(false);

  return (
    <AppShell title="Hotlist CRM">
      <p className="text-[#8892A4] mb-4">Your shortlisted creators, organized by campaign</p>
      <select className="mb-6 h-9 px-3 rounded-lg bg-[#0C1222] border border-white/10 text-sm">
        <option>Showing: All Campaigns</option>
        <option>Summer Tech Drop</option>
        <option>Home Lab Awareness</option>
        <option>SaaS Tool Launch</option>
        <option>Q4 Holiday Push</option>
        <option>Spring Fitness</option>
        <option>Crypto Community</option>
      </select>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {cols.map((col) => (
          <div key={col.key} className="bg-[#0C1222] rounded-xl p-4 min-w-[260px] w-[260px] shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm">{col.label}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#8892A4]">{col.items.length}</span>
              </div>
              <button onClick={() => setAddModal(true)} className="text-[#8892A4] hover:text-[#00D97E] text-xs">+ Add</button>
            </div>
            <div className="space-y-2.5">
              {col.items.map((c) => {
                const pb = platBadge(c.platform);
                const fb = fitBadge(c.fit);
                return (
                  <div key={c.name} className="bg-[#131D2E] border border-white/[0.07] rounded-lg p-3.5 cursor-grab">
                    <div className="flex items-start gap-2.5">
                      <img
                        className="creator-avatar-img"
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name)}&backgroundColor=0C1222&radius=50`}
                        alt={c.name}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="w-3.5 h-3.5 text-[#4B5563]" />
                          <div className="font-bold text-sm truncate">{c.name}</div>
                        </div>
                        <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: pb.bg, color: pb.color }}>
                          {c.platform}
                        </span>
                        <div className="mt-2 text-[11px] text-[#8892A4]">{c.stats}</div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: fb.bg, color: fb.color }}>
                            {c.fit}% fit
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                            CPM {c.cpm}
                          </span>
                        </div>
                        <div className="mt-3 flex gap-3">
                          <button className="text-[11px] text-[#00D97E] hover:underline">Message →</button>
                          <button className="text-[11px] text-[#00D97E] hover:underline">View Profile →</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {addModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setAddModal(false)}>
          <div className="w-full max-w-[420px] p-7 rounded-2xl bg-[#0C1222] border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Add Creator</h3>
            <p className="mt-2 text-sm text-[#8892A4]">Search for creators to add from Discovery.</p>
            <button
              onClick={() => { toast("Heading to Discovery"); setAddModal(false); window.location.href = "/app/discovery"; }}
              className="mt-5 w-full h-11 rounded-lg bg-[#00D97E] text-[#05080F] font-bold"
            >
              Go to Discovery →
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
