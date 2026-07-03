import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Telescope } from "lucide-react";
import { AppShell, Card } from "@/components/app/AppShell";
import { YouTubeIcon, XIcon } from "@/components/landing/icons";

const CASCADE = [
  { state: "active", label: "YouTube Channel Email", sub: "Extracted from creator's About tab via YouTube Data API", status: "sent", statusLabel: "Sent 2d ago" },
  { state: "active", label: "Personal Website Contact Form", sub: "Scraped from channel's linked website — aspenreach.com/outreach-demo", status: "waiting", statusLabel: "Awaiting reply" },
  { state: "pending", label: "X / Twitter DM", sub: "Matched profile via handle found in YouTube bio — @mkbhd", status: "queued", statusLabel: "Queued in 48h" },
  { state: "pending", label: "Discord Community", sub: "Server invite link found in YouTube description pinned post", status: "queued", statusLabel: "Queued in 5d" },
  { state: "pending", label: "LinkedIn Message", sub: "Professional profile matched by name + niche — Marques Brownlee", status: "queued", statusLabel: "Queued in 7d" },
  { state: "pending", label: "Talent Management Agency", sub: "Flagged as managed talent (2.3M subs) — agency outreach form auto-filled", status: "queued", statusLabel: "Queued in 10d" },
] as const;

export const Route = createFileRoute("/app/outreach")({
  component: OutreachPage,
});

const SEQS = [
  { name: "YouTube Initial Pitch", steps: 3, status: "Active" },
  { name: "Reddit DM Follow-up", steps: 2, status: "Active" },
  { name: "X Cold Outreach", steps: 4, status: "Draft" },
  { name: "Re-engagement (No Reply)", steps: 2, status: "Draft" },
];

const TIMELINE = [
  { day: 0, title: "Initial Email", subject: "Collab opportunity — [Creator Name] × [Brand]", body: "Hey [Name], huge fan of your [recent video topic] video — the way you explained [topic] was exactly how our target customer thinks about this problem..." },
  { day: 3, title: "Follow-up Email", subject: "Quick follow-up — [Creator Name]", body: "Hey [Name], just circling back on my message from a few days ago. Completely understand if the timing isn't right..." },
  { day: 7, title: "Final Touch", subject: "Last one from me, [Creator Name]", body: "I'll keep this short — if this isn't the right time or fit, totally understand. But if there's even a 10% chance..." },
];

function OutreachPage() {
  const [sel, setSel] = useState(0);
  const [launch, setLaunch] = useState(false);

  return (
    <AppShell title="Outreach Sequences">
      <p className="text-[#8892A4] mb-6">AI-powered multi-touch outreach, tailored per creator</p>

      {/* Creator header */}
      <Card className="p-5 mb-6 flex flex-wrap items-center gap-4">
        <img
          className="creator-avatar-img lg"
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=mkbhd&backgroundColor=0C1222&radius=50"
          alt="Marques Brownlee"
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F0F4FF] text-lg">Marques Brownlee</span>
            <span className="text-sm text-[#8892A4]">@mkbhd</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white inline-flex items-center gap-1" style={{ background: "#FF0000" }}>
              <YouTubeIcon size={11} /> YouTube
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white inline-flex items-center gap-1" style={{ background: "#1A1A1A" }}>
              <XIcon size={10} bg="none" className="[&_path]:fill-white" /> X
            </span>
            <span className="text-[11px] text-[#8892A4]">2.3M subscribers</span>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,217,126,0.15)", color: "#00D97E" }}>
          Tech Reviews
        </span>
        <span className="ml-auto text-sm font-bold text-[#00D97E]">94% Brand Fit</span>
      </Card>

      {/* Cascade */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-bold text-[#F0F4FF]">Creator Reach Cascade</h3>
        <p className="text-sm text-[#8892A4] mt-1 mb-5">
          AspenReach attempts contact through every available channel — in priority order.
        </p>
        <div className="outreach-cascade-wrapper">
          {CASCADE.map((s, i) => (
            <div key={i} className="outreach-step">
              <div className={`outreach-step-dot ${s.state}`}>{i + 1}</div>
              <div className="outreach-step-body">
                <div className="outreach-step-label">{s.label}</div>
                <div className="outreach-step-sub">{s.sub}</div>
              </div>
              <span className={`outreach-step-status ${s.status}`}>{s.statusLabel}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 px-4 py-3 rounded-lg border border-[#00D97E]/25 bg-[#00D97E]/[0.06] text-sm text-[#00D97E] font-semibold">
          AspenReach has a 73% reply rate when 3+ channels are attempted within 14 days.
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-0 border border-white/[0.07] rounded-xl overflow-hidden">
        {/* LEFT */}
        <div className="bg-[#0C1222] border-r border-white/[0.07] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Sequences</h3>
            <button className="text-xs px-2.5 py-1 rounded-md border border-[#00D97E]/50 text-[#00D97E] hover:bg-[#00D97E]/10">+ New</button>
          </div>
          <div className="space-y-1">
            {SEQS.map((s, i) => {
              const active = sel === i;
              return (
                <button
                  key={s.name}
                  onClick={() => setSel(i)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    active ? "bg-[#00D97E]/8 border-l-[3px] border-[#00D97E] pl-[9px]" : "hover:bg-white/[0.04]"
                  }`}
                  style={active ? { background: "rgba(0,217,126,0.08)" } : undefined}
                >
                  <div className="text-sm font-semibold text-[#F0F4FF]">{s.name}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-[#8892A4]">{s.steps} steps</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={
                        s.status === "Active"
                          ? { background: "rgba(0,217,126,0.15)", color: "#00D97E" }
                          : { background: "rgba(255,255,255,0.08)", color: "#8892A4" }
                      }
                    >
                      {s.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-[#05080F] p-6">
          <Card className="p-4 mb-6 grid grid-cols-4 gap-4">
            <Metric label="Sent" value="47" />
            <Metric label="Opened" value="31" sub="66%" />
            <Metric label="Replied" value="14" sub="30%" />
            <Metric label="Deals" value="4" sub="9%" />
          </Card>

          <div className="relative space-y-3">
            {TIMELINE.map((s, i) => (
              <div key={i} className="relative">
                <Card className="p-5 border-l-[3px]" style={{ borderLeftColor: "#00D97E" }}>
                  <div className="text-xs text-[#8892A4]">Day {s.day} — {s.title}</div>
                  <div className="mt-1 font-semibold text-[#F0F4FF]">Subject: {s.subject}</div>
                  <p className="mt-2 text-sm text-[#8892A4] leading-relaxed line-clamp-2">{s.body}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="text-xs px-3 py-1.5 rounded-md border border-white/15 text-[#8892A4] hover:text-white hover:border-white/30">Edit Template</button>
                    <button className="text-xs px-3 py-1.5 rounded-md border border-white/15 text-[#8892A4] hover:text-white hover:border-white/30">Preview</button>
                  </div>
                </Card>
                {i < TIMELINE.length - 1 && <div className="h-3 w-px ml-6 my-1 border-l border-dashed border-white/10" />}
              </div>
            ))}
            <button className="text-sm text-[#00D97E] hover:underline mt-2">+ Add Step</button>
          </div>

          <button
            onClick={() => setLaunch(true)}
            className="mt-6 w-full h-12 rounded-lg bg-[#00D97E] text-[#05080F] font-bold hover:bg-[#00c472]"
          >
            Launch Sequence
          </button>
        </div>
      </div>

      {launch && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setLaunch(false)}>
          <div className="w-full max-w-[480px] p-7 rounded-2xl bg-[#0C1222] border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Launch sequence</h3>
            <p className="mt-2 text-sm text-[#8892A4]">Select creators from your Hotlist to send this sequence to.</p>
            <div className="mt-4 max-h-48 overflow-auto space-y-1 border border-white/10 rounded-lg p-2">
              {["TechWithMarcus","r/homelab","@buildinpublic_sara","NightOwlTech","CodeWithChris"].map((n) => (
                <label key={n} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-white/5 text-sm">
                  <input type="checkbox" /> {n}
                </label>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setLaunch(false)} className="flex-1 h-11 rounded-lg border border-white/15 text-sm">Cancel</button>
              <button
                onClick={() => { toast("Sequence launching is coming soon. You'll be able to send directly from here in the next update."); setLaunch(false); }}
                className="flex-1 h-11 rounded-lg bg-[#00D97E] text-[#05080F] font-bold text-sm"
              >
                Send to Selected Creators →
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-[#8892A4] font-semibold">{label}</div>
      <div className="mt-1 text-xl font-bold text-[#F0F4FF]">{value} {sub && <span className="text-sm text-[#8892A4] font-medium">({sub})</span>}</div>
    </div>
  );
}
