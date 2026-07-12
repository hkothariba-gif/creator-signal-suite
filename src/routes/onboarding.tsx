import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { YouTubeIcon, RedditIcon, XIcon, LinkedInIcon } from "@/components/landing/icons";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

const TOTAL_STEPS = 5;
const MAX_LOOKALIKE_BYTES = 10 * 1024 * 1024;

function OnboardingPage() {
  const { user, update } = useAuth();
  const navigate = useNavigate();
  // Onboarding state is saved to Supabase when the flow finishes.
  // profiles.onboarded holds the flag and organizations.brand_profile holds
  // the brand answers. finish() also seeds the user's first campaign so it
  // appears immediately on the Campaigns dashboard.
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("aspen_hero_prompt") ?? "";
    } catch {
      return "";
    }
  });
  const [age, setAge] = useState("25-34");
  const [gender, setGender] = useState("Any");
  const [income, setIncome] = useState("Any");
  const [notes, setNotes] = useState("");
  const [platforms, setPlatforms] = useState({ youtube: true, reddit: true, x: true, linkedin: false });
  const [lookalikeFile, setLookalikeFile] = useState<File | null>(null);
  const [modal, setModal] = useState<null | { kind: "store" | "payout"; name: string }>(null);
  const [teamModal, setTeamModal] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const platformLabels = () => {
    const out: string[] = [];
    if (platforms.youtube) out.push("YouTube");
    if (platforms.reddit) out.push("Reddit");
    if (platforms.x) out.push("X");
    if (platforms.linkedin) out.push("LinkedIn");
    return out;
  };

  const seedFirstCampaign = async () => {
    if (!user) return; // tester bypass: no session, skip DB writes
    const desc = category.trim();
    const name = (desc.split("\n")[0] || "My first campaign").slice(0, 60) || "My first campaign";
    const platformsArr = platformLabels();
    const audience = {
      age,
      gender,
      income,
      notes: notes.trim() || null,
      platforms: platformsArr,
      lookalike_sheet_path: null as string | null,
      lookalike_sheet_name: lookalikeFile?.name ?? null,
    };

    const { data: inserted, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        name,
        status: "draft",
        goal: "Brand Awareness",
        product_description: desc || null,
        platforms: platformsArr.length ? platformsArr : ["YouTube", "Reddit", "X", "LinkedIn"],
        target_audience: audience,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("seed campaign failed", error);
      return;
    }

    // Upload lookalike sheet (best-effort) and patch the campaign.
    if (lookalikeFile) {
      const safeName = lookalikeFile.name.replace(/[^\w.\-]+/g, "_");
      const path = `${user.id}/${inserted.id}/${Date.now()}-${safeName}`;
      const up = await supabase.storage
        .from("audience-sheets")
        .upload(path, lookalikeFile, { upsert: false, contentType: lookalikeFile.type || undefined });
      if (!up.error) {
        audience.lookalike_sheet_path = path;
        await supabase.from("campaigns").update({ target_audience: audience }).eq("id", inserted.id);
      } else {
        console.error("lookalike upload failed", up.error);
      }
    }

    // Fire generate-search-criteria (non-blocking; ignore failures).
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
          productDescription: desc || name,
          targetAudience: audience,
          goal: "Brand Awareness",
        }),
      });
      if (res.ok) {
        const criteria = await res.json();
        await supabase.from("campaigns").update({ search_criteria: criteria }).eq("id", inserted.id);
      }
    } catch (e) {
      console.error("generate-search-criteria failed", e);
    }
  };

  const finish = async () => {
    if (submitting) return;
    setSubmitting(true);
    const { error } = await update({
      onboarded: true,
      brand: { category, age, gender, income, notes, platforms },
    });
    if (error && error !== "Not signed in") {
      setSubmitting(false);
      toast.error(`Could not save profile: ${error}`);
      return;
    }
    try {
      localStorage.setItem("aspen_onboarded", "true");
    } catch {}
    await seedFirstCampaign();
    toast.success("We saved your first campaign as a draft.");
    setSubmitting(false);
    navigate({ to: "/app/campaigns" });
  };

  return (
    <div className="min-h-screen bg-[#05080F] text-[#F0F4FF] relative">
      <div className="h-[3px] w-full bg-white/10">
        <div className="h-full bg-[#00D97E] transition-all duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>
      <div className="flex items-center justify-between px-8 py-5">
        <span className="text-lg font-extrabold tracking-tight">
          Aspen<span className="text-[#00D97E]">Reach</span>
        </span>
        <span className="text-xs text-[#8892A4]">Step {step} of {TOTAL_STEPS}</span>
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
              <h2 className="text-[32px] font-extrabold tracking-tight">Tell us about your product</h2>
              <p className="mt-2 text-[#8892A4]">
                The more detail you share about your product, brand, and target buyer, the better we can match you to creators whose audiences actually convert. Write freely — or upload a doc below.
              </p>
              <textarea
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Describe your product, brand, and who you're trying to reach — as much detail as you like..."
                rows={6}
                className="mt-8 w-full p-5 rounded-xl bg-[#131D2E] border border-white/10 text-base leading-relaxed focus:outline-none focus:border-[#00D97E] resize-y min-h-[160px]"
              />

              <div className="mt-6">
                <label
                  htmlFor="brand-docs"
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-sm text-[#8892A4] hover:text-white hover:border-[#00D97E]/50 cursor-pointer transition-colors"
                >
                  <span className="text-[#00D97E]">+</span> Attach PDFs or docs (optional)
                </label>
                <input
                  id="brand-docs"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    if (picked.length) setFiles((prev) => [...prev, ...picked]);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                {files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {files.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#0C1222] border border-white/[0.07] text-sm"
                      >
                        <span className="truncate text-[#F0F4FF]">{f.name}</span>
                        <button
                          onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                          className="ml-3 text-xs text-[#8892A4] hover:text-red-400"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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

              <div className="mt-8">
                <div className="text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Where do your buyers hang out?</div>
                <p className="mt-1 text-xs text-[#8892A4]">Select every platform we should scout creators on.</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <PlatformCard
                    selected={platforms.youtube}
                    onClick={() => setPlatforms((p) => ({ ...p, youtube: !p.youtube }))}
                    icon={<YouTubeIcon size={28} />}
                    name="YouTube" sub="Long form • High intent"
                    selStyle={{ border: "1px solid rgba(255,0,0,0.6)", boxShadow: "0 0 20px rgba(255,0,0,0.2)", background: "rgba(255,0,0,0.05)" }}
                  />
                  <PlatformCard
                    selected={platforms.x}
                    onClick={() => setPlatforms((p) => ({ ...p, x: !p.x }))}
                    icon={<XIcon size={28} bg="black" />}
                    name="X / Twitter" sub="Niche authority • Live"
                    selStyle={{ border: "1px solid rgba(255,255,255,0.3)", boxShadow: "0 0 20px rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
                  />
                  <PlatformCard
                    selected={platforms.linkedin}
                    onClick={() => setPlatforms((p) => ({ ...p, linkedin: !p.linkedin }))}
                    icon={<LinkedInIcon size={28} />}
                    name="LinkedIn" sub="B2B • Director+ reach"
                    selStyle={{ border: "1px solid rgba(10,102,194,0.6)", boxShadow: "0 0 20px rgba(10,102,194,0.25)", background: "rgba(10,102,194,0.06)" }}
                  />
                  <PlatformCard
                    selected={platforms.reddit}
                    onClick={() => setPlatforms((p) => ({ ...p, reddit: !p.reddit }))}
                    icon={<RedditIcon size={28} />}
                    name="Reddit" sub="Community trust"
                    selStyle={{ border: "1px solid rgba(255,69,0,0.6)", boxShadow: "0 0 20px rgba(255,69,0,0.2)", background: "rgba(255,69,0,0.05)" }}
                  />
                </div>
              </div>

              <div className="mt-8">
                <div className="text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Audience lookalike sheet</div>
                <p className="mt-1 text-xs text-[#8892A4]">Optional. Upload a CSV/XLSX of your best customers and we'll find creators whose audiences look like them.</p>
                <label
                  htmlFor="lookalike-sheet"
                  className="mt-3 flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-sm text-[#8892A4] hover:text-white hover:border-[#00D97E]/50 cursor-pointer transition-colors"
                >
                  <span className="text-[#00D97E]">+</span> {lookalikeFile ? "Replace file" : "Upload .csv / .xlsx (optional)"}
                </label>
                <input
                  id="lookalike-sheet"
                  type="file"
                  accept=".csv,.tsv,.xls,.xlsx"
                  onChange={(e) => {
                    const picked = e.target.files?.[0];
                    e.target.value = "";
                    if (!picked) return;
                    if (picked.size > MAX_LOOKALIKE_BYTES) {
                      toast.error("File too large (max 10MB).");
                      return;
                    }
                    setLookalikeFile(picked);
                  }}
                  className="hidden"
                />
                {lookalikeFile && (
                  <div className="mt-3 flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#0C1222] border border-white/[0.07] text-sm">
                    <span className="truncate text-[#F0F4FF]">{lookalikeFile.name}</span>
                    <button
                      onClick={() => setLookalikeFile(null)}
                      className="ml-3 text-xs text-[#8892A4] hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 3 && (
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

          {step === 4 && (
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

          {step === 5 && (
            <>
              <h2 className="text-[32px] font-extrabold tracking-tight">Your workspace is ready 🎉</h2>
              <p className="mt-2 text-[#8892A4]">Here's a summary of what we've set up for you.</p>
              <div className="mt-8 p-8 rounded-2xl bg-[#0C1222] border border-[#00D97E]/20 space-y-4">
                <SummaryRow label="Product" value={(category.trim() || "Not specified").slice(0, 80)} />
                <SummaryRow label="Target Buyer" value={`${age} / ${gender} / ${income}`} />
                <div>
                  <div className="text-xs uppercase text-[#8892A4] font-semibold mb-2">Platforms</div>
                  <div className="flex flex-wrap gap-2">
                    {platforms.youtube && <Badge color="#FF0000">YouTube</Badge>}
                    {platforms.reddit && <Badge color="#FF4500">Reddit</Badge>}
                    {platforms.x && <Badge color="#FFFFFF" text="#1A1A1A">X</Badge>}
                    {platforms.linkedin && <Badge color="#0A66C2">LinkedIn</Badge>}
                    {!platforms.youtube && !platforms.reddit && !platforms.x && !platforms.linkedin && (
                      <span className="text-xs text-[#8892A4]">No platforms selected</span>
                    )}
                  </div>
                </div>
                <SummaryRow
                  label="Lookalike sheet"
                  value={lookalikeFile ? lookalikeFile.name : <span className="flex items-center gap-2"><Dot color="#8892A4" /> None</span>}
                />
                <SummaryRow label="Store" value={<span className="flex items-center gap-2"><Dot color="#F59E0B" /> Not connected</span>} />
                <SummaryRow label="Payouts" value={<span className="flex items-center gap-2"><Dot color="#F59E0B" /> Not configured</span>} />
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={finish}
                  disabled={submitting}
                  className="flex-1 h-12 rounded-lg bg-[#00D97E] hover:bg-[#00c472] text-[#05080F] font-bold disabled:opacity-60"
                >
                  {submitting ? "Setting up…" : "Go to your dashboard →"}
                </button>
                <button onClick={() => setTeamModal(true)} className="flex-1 h-12 rounded-lg border border-white/15 text-[#F0F4FF] hover:bg-white/5 font-semibold">
                  Invite a teammate
                </button>
              </div>
            </>
          )}
        </div>

        {step < TOTAL_STEPS && (
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
      className="text-left rounded-xl p-4 transition-all"
      style={selected ? selStyle : { background: "#0C1222", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {icon}
      <div className="mt-3 font-bold text-sm">{name}</div>
      <div className="text-xs text-[#8892A4] mt-0.5">{sub}</div>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm gap-4">
      <span className="text-[#8892A4] shrink-0">{label}</span>
      <span className="font-semibold text-[#F0F4FF] text-right truncate">{value}</span>
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
