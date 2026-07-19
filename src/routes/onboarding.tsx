import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { processBrandDoc } from "@/lib/brand-docs.functions";
import { YouTubeIcon, RedditIcon, XIcon, LinkedInIcon } from "@/components/landing/icons";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

// v3-5: onboarding is plain account setup that ends in the user's first
// campaign. Product first: we ask about the product and its buyer, then create
// the campaign and land in the Ads Center. No store or payout steps and no
// summary screen; those connections live in Settings once they exist.

const TOTAL_STEPS = 2;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function OnboardingPage() {
  const { user, update } = useAuth();
  const navigate = useNavigate();
  // profiles.onboarded holds the completion flag and organizations.brand_profile
  // keeps the answers. finish() creates the first campaign, uploads any brand
  // docs against it, and opens the Ads Center on that campaign.
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

  const seedFirstCampaign = async (): Promise<string | null> => {
    if (!user) return null; // tester bypass: no session, skip DB writes
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
      return null;
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

    // Upload brand docs against the campaign (best-effort). Extraction into the
    // grounding corpus runs server-side; failures never block onboarding.
    for (const f of files) {
      try {
        const safeName = f.name.replace(/[^\w.\-]+/g, "_");
        const path = `${user.id}/${inserted.id}/${Date.now()}-${safeName}`;
        const up = await supabase.storage
          .from("brand-docs")
          .upload(path, f, { upsert: false, contentType: f.type || undefined });
        if (up.error) continue;
        const { data: doc } = await supabase
          .from("brand_docs")
          .insert({ user_id: user.id, campaign_id: inserted.id, file_name: f.name, storage_path: path })
          .select("id")
          .single();
        if (doc) {
          processBrandDoc({ data: { docId: doc.id } }).catch(() => {
            // Extraction needs the LLM key; the doc stays listed for a retry later.
          });
        }
      } catch (e) {
        console.error("brand doc upload failed", e);
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

    return inserted.id;
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
    const campaignId = await seedFirstCampaign();
    setSubmitting(false);
    if (campaignId) {
      toast.success("Your first campaign is ready.");
      navigate({ to: "/app/ads", search: { campaign: campaignId } });
    } else if (user) {
      toast.error("Could not create your campaign. You can create one from the Campaigns page.");
      navigate({ to: "/app/campaigns" });
    } else {
      navigate({ to: "/app/campaigns" });
    }
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
                Everything here becomes your first campaign: creator matching, audience scoring, and
                the ads you build all read from it. Write freely, or attach a doc below.
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
                  <span className="text-[#00D97E]">+</span> Attach product or brand docs (.pdf, .txt, .md — optional)
                </label>
                <input
                  id="brand-docs"
                  type="file"
                  multiple
                  accept=".pdf,.txt,.md"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    e.target.value = "";
                    const kept = picked.filter((f) => {
                      if (f.size > MAX_UPLOAD_BYTES) {
                        toast.error(`${f.name} is too large (max 10MB)`);
                        return false;
                      }
                      return true;
                    });
                    if (kept.length) setFiles((prev) => [...prev, ...kept]);
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
                {files.length > 0 && (
                  <p className="mt-2 text-xs text-[#8892A4]">
                    We pull real excerpts from these into your campaign's ad corpus.
                  </p>
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
                    if (picked.size > MAX_UPLOAD_BYTES) {
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

              <div className="mt-10">
                <button
                  onClick={finish}
                  disabled={submitting}
                  className="w-full h-12 rounded-lg bg-[#00D97E] hover:bg-[#00c472] text-[#05080F] font-bold disabled:opacity-60"
                >
                  {submitting ? "Creating your campaign…" : "Create your first campaign →"}
                </button>
                <p className="mt-3 text-center text-xs text-[#8892A4]">
                  You'll land in the Ads Center with this campaign selected. Connect your store and
                  payouts later from Settings.
                </p>
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
