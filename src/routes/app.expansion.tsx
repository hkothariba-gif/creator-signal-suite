import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/AppShell";

export const Route = createFileRoute("/app/expansion")({
  component: ExpansionPage,
});

const ROWS = [
  { name: "TechWithMarcus", plat: "YT", pc: "#FF0000", camps: 3, convs: 412, roas: "6.8x", trend: "up", action: "Scale Up" },
  { name: "CodeWithChris", plat: "YT", pc: "#FF0000", camps: 2, convs: 384, roas: "5.2x", trend: "up", action: "Scale Up" },
  { name: "r/homelab", plat: "Reddit", pc: "#FF4500", camps: 4, convs: 267, roas: "4.1x", trend: "flat", action: "Renew" },
  { name: "@buildinpublic_sara", plat: "X", pc: "#1A1A1A", camps: 1, convs: 89, roas: "3.3x", trend: "up", action: "Expand" },
  { name: "r/entrepreneur", plat: "Reddit", pc: "#FF4500", camps: 2, convs: 198, roas: "2.9x", trend: "down", action: "Review" },
];

const SUGGEST = [
  { name: "TechExplorer Weekly", plat: "YT", size: "95K subs", reason: "Similar audience to TechWithMarcus, 88% topic overlap" },
  { name: "r/homeautomation", plat: "Reddit", size: "420K members", reason: "Adjacent community to r/homelab with strong buyer signals" },
  { name: "@devreladvocate", plat: "X", size: "32K followers", reason: "Niche authority in your SaaS buyer segment" },
];

function ExpansionPage() {
  const navigate = useNavigate();
  const [modal, setModal] = useState<null | "action" | "apply">(null);

  return (
    <AppShell title="Expansion & Upsell">
      <p className="text-[#8892A4] mb-6">Identify your top performers and scale what's working</p>

      <Card className="overflow-hidden mb-6">
        <div className="p-5 border-b border-white/[0.07]">
          <h3 className="font-bold">Creator Performance Scores</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase text-[#8892A4]">
              <th className="px-5 py-3">Creator</th>
              <th className="px-2 py-3">Plat</th>
              <th className="px-2 py-3">Campaigns</th>
              <th className="px-2 py-3">Conversions</th>
              <th className="px-2 py-3">ROAS</th>
              <th className="px-2 py-3">Trend</th>
              <th className="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={r.name} className={i % 2 ? "bg-[#131D2E]" : "bg-[#0C1222]"}>
                <td className="px-5 py-3 font-semibold">{r.name}</td>
                <td className="px-2 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: r.pc }}>{r.plat}</span></td>
                <td className="px-2 py-3 text-[#8892A4]">{r.camps}</td>
                <td className="px-2 py-3 text-[#8892A4]">{r.convs}</td>
                <td className="px-2 py-3 font-bold text-[#F0F4FF]">{r.roas}</td>
                <td className="px-2 py-3">
                  {r.trend === "up" && <span className="text-[#00D97E]">↑ trending up</span>}
                  {r.trend === "flat" && <span className="text-[#F59E0B]">→ flat</span>}
                  {r.trend === "down" && <span className="text-[#EF4444]">↓ declining</span>}
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => setModal("action")} className="text-xs text-[#00D97E] hover:underline">{r.action}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold">Recommended New Creators</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/30">AI Suggested</span>
          </div>
          <p className="text-xs text-[#8892A4] mb-4">Based on your top performers</p>
          <div className="space-y-3">
            {SUGGEST.map((s) => (
              <div key={s.name} className="bg-[#131D2E] border border-white/[0.07] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-xs text-[#8892A4] mt-0.5">{s.plat} • {s.size}</div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[#8892A4]">{s.reason}</p>
                <button onClick={() => toast.success("Added to Hotlist!")} className="mt-2 text-xs text-[#00D97E] hover:underline">Add to Hotlist →</button>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-bold">Budget Reallocation Suggestions</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/30">AI Insight</span>
            </div>
            <div className="bg-[#131D2E] border-l-[3px] border-[#7C3AED] rounded-lg p-4">
              <p className="text-sm text-[#F0F4FF] leading-relaxed">
                Based on your campaign data, reallocating 20% of your YouTube budget to Reddit micro-creators could improve ROAS by an estimated 1.4x. Your r/homelab campaign has the highest CVR per dollar of any active campaign.
              </p>
              <button onClick={() => setModal("apply")} className="mt-3 px-4 h-9 rounded-lg bg-[#00D97E] text-[#05080F] text-xs font-bold">Apply Suggestion</button>
            </div>
          </Card>
          <Card className="p-5">
            <div className="bg-[#131D2E] border-l-[3px] border-[#7C3AED] rounded-lg p-4">
              <p className="text-sm text-[#F0F4FF] leading-relaxed">
                @buildinpublic_sara has been live for 1 campaign and already shows a 3.3x ROAS with an upward trend. Consider increasing her deal size or adding a second product mention to her next post.
              </p>
              <button onClick={() => navigate({ to: "/app/hotlist" })} className="mt-3 text-xs text-[#00D97E] hover:underline">View Creator →</button>
            </div>
          </Card>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-[440px] p-7 rounded-2xl bg-[#0C1222] border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">
              {modal === "action" ? "Expansion workflows coming soon" : "Budget optimization coming soon"}
            </h3>
            <p className="mt-3 text-sm text-[#8892A4]">
              {modal === "action"
                ? "You'll be able to send auto-renewal proposals, increase budget allocations, and trigger new campaign sequences directly from this view."
                : "You'll be able to apply AI-suggested reallocations with one click."}
            </p>
            <button onClick={() => setModal(null)} className="mt-5 w-full h-11 rounded-lg bg-[#00D97E] text-[#05080F] font-bold">Got it</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
