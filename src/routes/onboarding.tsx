import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { YouTubeIcon, RedditIcon, XIcon, LinkedInIcon } from "@/components/landing/icons";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});


function OnboardingPage() {
  const { update } = useAuth();
  const navigate = useNavigate();
  // Onboarding state is saved to Supabase when the flow finishes.
  // profiles.onboarded holds the flag and organizations.brand_profile holds
  // the brand answers. Nothing is persisted in localStorage.
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [age, setAge] = useState("25-34");
  const [gender, setGender] = useState("Any");
  const [income, setIncome] = useState("Any");
  const [notes, setNotes] = useState("");
  const [platforms, setPlatforms] = useState({ youtube: true, reddit: true, x: true, linkedin: false });
  const [modal, setModal] = useState<null | { kind: "store" | "payout"; name: string }>(null);
  const [teamModal, setTeamModal] = useState(false);

  const next = () => setStep((s) => Math.min(6, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const finish = async () => {
    const { error } = await update({
      onboarded: true,
      brand: { category, age, gender, income, notes, platforms },
    });
    if (error) {
      toast.error(`Could not save profile: ${error}`);
      return;
    }
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen bg-[#05080F] text-[#F0F4FF] relative">
      <div className="h-[3px] w-full bg-white/10">
        <div className="h-full bg-[#00D97E] transition-all duration-500" style={{ width: `${(step / 6) * 100}%` }} />
      </div>
      <div className="flex items-center justify-between px-8 py-5">
        <span className="text-lg font-extrabold tracking-tight">
          Aspen<span className="text-[#00D97E]">Reach</span>
        </span>
        <span className="text-xs text-[#8892A4]">Step {step} of 6</span>
      </div>

      {step > 1 && (
        <button onClick={back} className="absolute left-8 top-[72px] text-xs text-[#8892A4] hover:text-white">
          ← Back
        </button>
      )}

      <div className="max-w-[640px] mx-auto px-6 py-12">
        <div key={step} className="animate-[fadeIn_0.3s_ease]">
          {step === 1 && (
            <>
              <h2 className="text-[32px] font-extrabold tracking-tight">What does your brand sell?</h2>
              <p className="mt-2 text-[#8892A4]">This helps us match you to creators whose audiences actually buy your category.</p>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Supplements, SaaS tools, Home goods..."
                className="mt-8 w-full h-14 px-5 rounded-xl bg-[#131D2E] border border-white/10 text-lg focus:outline-none focus:border-[#00D97E]"
              />
              <div className="mt-5 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const sel = category === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                        sel
                          ? "bg-[#00D97E]/15 border-[#00D97E] text-[#00D97E]"
                          : "bg-white/[0.05] border-white/10 text-[#F0F4FF] hover:border-white/30"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-[32px] font-extrabold tracking-tight">Describe your ideal buyer</h2>
              <p className="mt-2 text-[#8892A4]">We use this to score every creator's audience for fit before you spend a cent.</p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select label="Age range" value={age} onChange={setAge} opts={["18-24","25-34","35-44","45-54","55+"]} />
                <Select label="Gender skew" value={gender} onChange={setGender} opts={["Any","Mostly Male","Mostly Female","Mixed"]} />
                <Select label="Income tier" value={income} onChange={setIncome} opts={["Any","Under $50K","$50K-$100K","$100K-$150K","$150K+"]} />
              </div>
              <label className="block mt-6 text-xs font-semibold text-[#8892A4]">Any other buyer details?</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Early adopters who love tech, homeowners focused on fitness..."
                rows={3}
                className="mt-2 w-full p-4 rounded-xl bg-[#131D2E] border border-white/10 focus:outline-none focus:border-[#00D97E]"
              />
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-[32px] font-extrabold tracking-tight">Where do your buyers hang out?</h2>
              <p className="mt-2 text-[#8892A4]">Select all platforms you want to run creator campaigns on.</p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <PlatformCard
                  selected={platforms.youtube}
                  onClick={() => setPlatforms((p) => ({ ...p, youtube: !p.youtube }))}
                  icon={<YouTubeIcon size={36} />}
                  name="YouTube" sub="Long form video • High purchase intent"
                  selStyle={{ border: "1px solid rgba(255,0,0,0.6)", boxShadow: "0 0 20px rgba(255,0,0,0.2)", background: "rgba(255,0,0,0.05)" }}
                />
                <PlatformCard
                  selected={platforms.reddit}
                  onClick={() => setPlatforms((p) => ({ ...p, reddit: !p.reddit }))}
                  icon={<RedditIcon size={36} />}
                  name="Reddit" sub="Community trust • Why Flagged signals"
                  selStyle={{ border: "1px solid rgba(255,69,0,0.6)", boxShadow: "0 0 20px rgba(255,69,0,0.2)", background: "rgba(255,69,0,0.05)" }}
                />
                <PlatformCard
                  selected={platforms.x}
                  onClick={() => setPlatforms((p) => ({ ...p, x: !p.x }))}
                  icon={<XIcon size={36} bg="black" />}
                  name="X / Twitter" sub="Niche authority • Live conversation"
                  selStyle={{ border: "1px solid rgba(255,255,255,0.3)", boxShadow: "0 0 20px rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
                />
                <PlatformCard
                  selected={platforms.linkedin}
                  onClick={() => setPlatforms((p) => ({ ...p, linkedin: !p.linkedin }))}
                  icon={<LinkedInIcon size={36} />}
                  name="LinkedIn" sub="B2B thought leadership • Director+ reach"
                  selStyle={{ border: "1px solid rgba(10,102,194,0.6)", boxShadow: "0 0 20px rgba(10,102,194,0.25)", background: "rgba(10,102,194,0.06)" }}
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-[32px] font-extrabold tracking-tight">Connect your store or tracking</h2>
              <p className="mt-2 text-[#8892A4]">Link your sales platform so AspenReach can attribute conversions from creator campaigns.</p>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
                {["Shopify","WooCommerce","Stripe","PayPal","BigCommerce","Custom Webhook"].map((p) => (
                  <div key={p} className="bg-[#0C1222] border border-white/[0.07] rounded-xl p-5 text-center">
                    <div className="w-10 h-10 mx-auto rounded-lg bg-white/5 flex items-center justify-center text-[#00D97E] font-bold">
                      {p[0]}
                    </div>
                    <div className="mt-3 font-semibold text-sm">{p}</div>
                    <button onClick={() => setModal({ kind: "store", name: p })} className="mt-3 text-xs text-[#00D97E] hover:underline">Connect →</button>
                  </div>
                ))}
              </div>
              <button onClick={next} className="block mx-auto mt-6 text-sm text-[#8892A4] hover:text-white">Skip this step →</button>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="text-[32px] font-extrabold tracking-tight">How will you pay your creators?</h2>
              <p className="mt-2 text-[#8892A4]">AspenReach handles contracts, invoicing, and payouts automatically.</p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { icon: "🏦", name: "Direct Bank Transfer", sub: "ACH or SWIFT from your business account" },
                  { icon: "S", name: "Stripe Connect", sub: "Instant payouts to creator Stripe accounts", color: "#7C3AED" },
                  { icon: "W", name: "Wise Business", sub: "International multi-currency payouts", color: "#00B9FF" },
                ].map((m) => (
                  <button
                    key={m.name}
                    onClick={() => setModal({ kind: "payout", name: m.name })}
                    className="text-left bg-[#0C1222] border border-white/[0.07] rounded-xl p-6 hover:border-[#00D97E]/30 transition-colors"
                  >
                    <div className="text-2xl mb-3" style={{ color: (m as any).color }}>{m.icon}</div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-xs text-[#8892A4] mt-1">{m.sub}</div>
                  </button>
                ))}
              </div>
              <button onClick={next} className="block mx-auto mt-6 text-sm text-[#8892A4] hover:text-white">I'll set this up later →</button>
            </>
          )}

          {step === 6 && (
            <>
              <h2 className="text-[32px] font-extrabold tracking-tight">Your workspace is ready 🎉</h2>
              <p className="mt-2 text-[#8892A4]">Here's a summary of what we've set up for you.</p>
              <div className="mt-8 p-8 rounded-2xl bg-[#0C1222] border border-[#00D97E]/20 space-y-4">
                <SummaryRow label="Category" value={category || "Not specified"} />
                <SummaryRow label="Target Buyer" value={`${age} / ${gender} / ${income}`} />
                <div>
                  <div className="text-xs uppercase text-[#8892A4] font-semibold mb-2">Platforms</div>
                  <div className="flex flex-wrap gap-2">
                    {platforms.youtube && <Badge color="#FF0000">YouTube</Badge>}
                    {platforms.reddit && <Badge color="#FF4500">Reddit</Badge>}
                    {platforms.x && <Badge color="#FFFFFF" text="#1A1A1A">X</Badge>}
                    {platforms.linkedin && <Badge color="#0A66C2">LinkedIn</Badge>}
                  </div>
                </div>
                <SummaryRow label="Store" value={<span className="flex items-center gap-2"><Dot color="#F59E0B" /> Not connected</span>} />
                <SummaryRow label="Payouts" value={<span className="flex items-center gap-2"><Dot color="#F59E0B" /> Not configured</span>} />
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button onClick={finish} className="flex-1 h-12 rounded-lg bg-[#00D97E] hover:bg-[#00c472] text-[#05080F] font-bold">
                  Go to your dashboard →
                </button>
                <button onClick={() => setTeamModal(true)} className="flex-1 h-12 rounded-lg border border-white/15 text-[#F0F4FF] hover:bg-white/5 font-semibold">
                  Invite a teammate
                </button>
              </div>
            </>
          )}
        </div>

        {step < 6 && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={next}
              disabled={step === 1 && !category.trim()}
              className="h-12 px-8 rounded-lg bg-[#00D97E] hover:bg-[#00c472] text-[#05080F] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </div>
        )}
      </div>

      {modal && (
        <Modal onClose={() => setModal(null)}>
          <h3 className="text-xl font-bold">{modal.name}</h3>
          <p className="mt-3 text-sm text-[#8892A4]">Waiting for API connection</p>
          <p className="mt-2 text-xs text-[#8892A4]">
            The {modal.name} connector is not configured yet. This step will light up once the integration is live. You can skip it and connect later from Settings.
          </p>
          <button onClick={() => setModal(null)} className="mt-6 w-full h-11 rounded-lg bg-[#00D97E] text-[#05080F] font-bold">Got it</button>
        </Modal>
      )}

      {teamModal && (
        <Modal onClose={() => setTeamModal(false)}>
          <h3 className="text-xl font-bold">Invite teammates</h3>
          <p className="mt-3 text-sm text-[#8892A4]">Once you finish setup, open Settings and use the Team tab to invite teammates as admin, editor, or reviewer.</p>
          <button onClick={() => setTeamModal(false)} className="mt-6 w-full h-11 rounded-lg bg-[#00D97E] text-[#05080F] font-bold">Got it</button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-[440px] p-8 rounded-2xl bg-[#0C1222] border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: string[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#8892A4] mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 rounded-lg bg-[#131D2E] border border-white/10 text-sm focus:outline-none focus:border-[#00D97E]"
      >
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function PlatformCard({ selected, onClick, icon, name, sub, selStyle }: {
  selected: boolean; onClick: () => void; icon: React.ReactNode; name: string; sub: string; selStyle: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl p-6 transition-all"
      style={selected ? selStyle : { background: "#0C1222", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {icon}
      <div className="mt-3 font-bold">{name}</div>
      <div className="text-xs text-[#8892A4] mt-1">{sub}</div>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#8892A4]">{label}</span>
      <span className="font-semibold text-[#F0F4FF]">{value}</span>
    </div>
  );
}

function Badge({ color, text = "white", children }: { color: string; text?: string; children: React.ReactNode }) {
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: color, color: text }}>
      {children}
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />;
}
