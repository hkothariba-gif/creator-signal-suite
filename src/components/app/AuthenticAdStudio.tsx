import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, ShieldCheck, ShieldAlert, Quote, RefreshCw, Save } from "lucide-react";
import { Card } from "@/components/app/AppShell";
import { AdPreviewFrame } from "@/components/app/AdPreviewFrame";
import { CampaignPicker } from "@/components/app/CampaignPicker";
import { supabase } from "@/integrations/supabase/client";
import { collectAdCorpus, listAdCorpus, type AdCorpusRow } from "@/lib/ad-corpus.functions";
import { generateAuthenticAd, type AuthenticAdResult } from "@/lib/ads.functions";
import { AD_STYLES } from "@/lib/ad-playbooks";

// Phase 5A: Authentic Ads. Copy is generated only from real language — audience
// comments, creators' spoken words, conversion-backed phrases — plus the
// campaign belief doc. No tone adjectives anywhere. Every ad shows its
// provenance ("why this ad") and must pass the swap + groundedness gates.

const KIND_LABEL: Record<string, string> = {
  comment: "Audience comments",
  transcript: "Creator spoken content",
  conversion_phrase: "Converted phrases",
};

export function AuthenticAdStudio({
  organizationId,
  brand,
  canEdit,
  llmReady,
  onGenerated,
  campaignId: controlledCampaignId,
}: {
  organizationId: string;
  brand: string;
  canEdit: boolean;
  llmReady: boolean | undefined;
  onGenerated?: () => void;
  campaignId?: string; // controlled by the Ads Center shell when provided
}) {
  const [internalCampaignId, setInternalCampaignId] = useState<string | undefined>(undefined);
  const campaignId = controlledCampaignId ?? internalCampaignId;
  const setCampaignId = setInternalCampaignId;
  const controlled = controlledCampaignId !== undefined;

  // Belief doc
  const [beliefs, setBeliefs] = useState("");
  const [proof, setProof] = useState("");
  const [neverSay, setNeverSay] = useState("");
  const [savingBeliefs, setSavingBeliefs] = useState(false);
  const [beliefsLoaded, setBeliefsLoaded] = useState(false);

  // Corpus
  const [corpus, setCorpus] = useState<AdCorpusRow[]>([]);
  const [collecting, setCollecting] = useState(false);

  // Generation
  const [platform, setPlatform] = useState<"reddit" | "x" | "youtube" | "linkedin">("reddit");
  const [styleId, setStyleId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AuthenticAdResult | null>(null);

  const loadCampaign = useCallback(async () => {
    setBeliefsLoaded(false);
    setResult(null);
    if (!campaignId) {
      setBeliefs("");
      setProof("");
      setNeverSay("");
      setCorpus([]);
      return;
    }
    const [{ data: c }, rows] = await Promise.all([
      supabase
        .from("campaigns")
        .select("brand_beliefs,proof_points,never_say")
        .eq("id", campaignId)
        .maybeSingle(),
      listAdCorpus({ data: { campaignId } }),
    ]);
    setBeliefs(c?.brand_beliefs ?? "");
    setProof(c?.proof_points ?? "");
    setNeverSay(c?.never_say ?? "");
    setCorpus(rows);
    setBeliefsLoaded(true);
  }, [campaignId]);

  useEffect(() => {
    void loadCampaign();
  }, [loadCampaign]);

  const saveBeliefs = async () => {
    if (!campaignId) return;
    setSavingBeliefs(true);
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({
          brand_beliefs: beliefs.trim() || null,
          proof_points: proof.trim() || null,
          never_say: neverSay.trim() || null,
        })
        .eq("id", campaignId);
      if (error) throw new Error(error.message);
      toast.success("Belief doc saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSavingBeliefs(false);
    }
  };

  const collect = async () => {
    if (!campaignId) return;
    setCollecting(true);
    try {
      const res = await collectAdCorpus({ data: { campaignId, organizationId } });
      const parts = Object.entries(res.byKind).map(([k, v]) => `${v} ${KIND_LABEL[k] ?? k}`);
      toast.success(
        res.inserted > 0
          ? `Collected ${res.inserted} items${parts.length ? ` (${parts.join(", ")})` : ""}`
          : "Nothing new found",
      );
      if (res.needsYouTubeKey) toast.info("Connect the YouTube key to pull creator comments");
      if (res.needsRedditKey) toast.info("Connect the Reddit keys to pull audience threads");
      setCorpus(await listAdCorpus({ data: { campaignId } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Collection failed");
    } finally {
      setCollecting(false);
    }
  };

  const generate = async () => {
    if (!campaignId) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await generateAuthenticAd({
        data: { organizationId, campaignId, platform, brand, styleId: styleId || undefined },
      });
      setResult(res);
      if (res.passed) toast.success("Ad generated and passed both gates");
      else toast.warning("Generated, but flagged by review — see the gate notes");
      onGenerated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const counts = corpus.reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold text-[#F0F4FF] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00D97E]" /> Authentic Ads
          </h2>
          <p className="mt-0.5 text-xs text-[#8892A4] max-w-xl">
            Copy built only from real audience comments, your creators' own words, and phrases that
            actually converted — plus what your brand believes. No tone adjectives, ever.
          </p>
        </div>
        {!controlled && <CampaignPicker value={campaignId} onChange={setCampaignId} />}
      </div>

      {!campaignId ? (
        <p className="mt-4 text-xs text-[#5A6478]">Pick a campaign to begin.</p>
      ) : !beliefsLoaded ? (
        <p className="mt-4 text-xs text-[#5A6478]">Loading…</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Belief doc */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8892A4]">
              Belief doc — what only this brand would say
            </h3>
            <div>
              <label className="text-xs text-[#8892A4]">
                Beliefs (specific enough that a rival would object)
              </label>
              <textarea
                value={beliefs}
                onChange={(e) => setBeliefs(e.target.value)}
                rows={4}
                disabled={!canEdit}
                placeholder="e.g. Most creator tools optimize for volume; we believe 10 real fans beat 10,000 impressions…"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-[#05080F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00D97E] resize-y"
              />
            </div>
            <div>
              <label className="text-xs text-[#8892A4]">Proof (decisions and facts that back it)</label>
              <textarea
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                rows={3}
                disabled={!canEdit}
                placeholder="e.g. We turned down marketplace ads in 2025; every affiliate is hand-scored before outreach…"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-[#05080F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00D97E] resize-y"
              />
            </div>
            <div>
              <label className="text-xs text-[#8892A4]">Never say</label>
              <textarea
                value={neverSay}
                onChange={(e) => setNeverSay(e.target.value)}
                rows={2}
                disabled={!canEdit}
                placeholder='e.g. "game-changing", "seamless", any uptime claims…'
                className="mt-1 w-full px-3 py-2 rounded-lg bg-[#05080F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00D97E] resize-y"
              />
            </div>
            {canEdit && (
              <button
                onClick={saveBeliefs}
                disabled={savingBeliefs}
                className="text-xs font-bold px-4 h-8 rounded-lg bg-white/[0.08] text-white hover:bg-white/[0.14] inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingBeliefs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save belief doc
              </button>
            )}
          </div>

          {/* Corpus + generation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8892A4]">
                Grounding corpus
              </h3>
              {canEdit && (
                <button
                  onClick={collect}
                  disabled={collecting}
                  className="text-xs font-semibold px-3 h-8 rounded-lg border border-white/10 text-[#8892A4] hover:text-white inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {collecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Collect
                </button>
              )}
            </div>
            {corpus.length === 0 ? (
              <p className="text-xs text-[#5A6478]">
                No data to display — collect real comments, transcripts, and converted phrases from
                this campaign's creators.
              </p>
            ) : (
              <>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(counts).map(([k, v]) => (
                    <span key={k} className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white/[0.05] text-[#8892A4]">
                      {v} {KIND_LABEL[k] ?? k}
                    </span>
                  ))}
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {corpus.slice(0, 12).map((r) => (
                    <p key={r.id} className="text-[11px] text-[#F0F4FF]/70 border-l-2 border-white/10 pl-2">
                      <Quote className="w-3 h-3 inline mr-1 text-[#5A6478]" />
                      {r.content.slice(0, 140)}
                      {r.content.length > 140 ? "…" : ""}
                      <span className="text-[#5A6478]"> — {r.author ?? r.source}</span>
                    </p>
                  ))}
                </div>
              </>
            )}

            {canEdit && (
              <div className="pt-1">
                <label className="text-xs text-[#8892A4]">Ad style</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setStyleId("")}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                      styleId === "" ? "bg-[#00D97E] text-[#05080F]" : "bg-white/[0.05] text-[#8892A4] hover:text-white"
                    }`}
                  >
                    Engine's pick
                  </button>
                  {AD_STYLES.map((s) => {
                    const recommended = s.bestOn.includes(platform);
                    return (
                      <button
                        key={s.id}
                        onClick={() => setStyleId(s.id)}
                        title={`${s.recipe}\n\n⚠ ${s.caution}`}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                          styleId === s.id
                            ? "bg-[#00D97E] text-[#05080F]"
                            : recommended
                              ? "bg-white/[0.08] text-[#F0F4FF]/80 hover:text-white"
                              : "bg-white/[0.03] text-[#5A6478] hover:text-white"
                        }`}
                      >
                        {s.emoji} {s.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[10px] text-[#5A6478]">
                  Styles shape structure and delivery; the substance still comes from your corpus and
                  beliefs. Brighter chips fit {platform} best.
                </p>
              </div>
            )}

            {canEdit && (
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as typeof platform)}
                  className="h-9 px-2 rounded-lg bg-[#05080F] border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="reddit">Reddit</option>
                  <option value="x">X</option>
                  <option value="youtube">YouTube</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
                <button
                  onClick={generate}
                  disabled={generating || !llmReady || corpus.length < 3 || !beliefs.trim()}
                  className="text-xs font-bold px-4 h-9 rounded-lg bg-[#00D97E] text-[#05080F] inline-flex items-center gap-1.5 disabled:opacity-40"
                >
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate grounded ad
                </button>
              </div>
            )}
            {!llmReady && <p className="text-[10px] text-[#5A6478]">Waiting for API connection (LLM key)</p>}
            {llmReady && (corpus.length < 3 || !beliefs.trim()) && (
              <p className="text-[10px] text-[#5A6478]">
                Needs a saved belief doc and at least 3 corpus quotes.
              </p>
            )}

            {result && (
              <div className="rounded-lg border border-white/[0.07] p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {(["swap", "groundedness", "platformFit"] as const).map((g) => {
                    const gate = result.gates[g];
                    const label = g === "swap" ? "Swap test" : g === "groundedness" ? "Grounded" : "Platform fit";
                    return (
                      <span
                        key={g}
                        title={gate.reason}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          gate.pass ? "bg-[#00D97E]/15 text-[#00D97E]" : "bg-[#FF6B6B]/15 text-[#FF6B6B]"
                        }`}
                      >
                        {gate.pass ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {label}
                      </span>
                    );
                  })}
                  {result.styleId && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-[#8892A4]">
                      {AD_STYLES.find((s) => s.id === result.styleId)?.emoji}{" "}
                      {AD_STYLES.find((s) => s.id === result.styleId)?.label}
                    </span>
                  )}
                </div>
                <AdPreviewFrame
                  platform={platform}
                  brand={brand}
                  headline={result.headline}
                  body={result.body}
                  cta={result.cta}
                />
                {!result.passed && (
                  <p className="text-[10px] text-[#FF6B6B]">
                    {[
                      !result.gates.swap.pass ? result.gates.swap.reason : "",
                      !result.gates.groundedness.pass ? result.gates.groundedness.reason : "",
                      !result.gates.platformFit.pass ? result.gates.platformFit.reason : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                <div className="border-t border-white/[0.07] pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8892A4] mb-1">
                    Why this ad
                  </p>
                  {result.sourcesUsed.slice(0, 5).map((s, i) => (
                    <p key={i} className="text-[11px] text-[#F0F4FF]/70">
                      <Quote className="w-3 h-3 inline mr-1 text-[#5A6478]" />"{s.quote}
                      {s.quote.length >= 200 ? "…" : ""}"
                      <span className="text-[#5A6478]">
                        {" "}
                        — {s.author ?? "audience"} ({KIND_LABEL[s.kind] ?? s.kind})
                      </span>
                    </p>
                  ))}
                </div>
                <p className="text-[10px] text-[#5A6478]">
                  Saved as a draft in your ad library below — attach imagery or edit it there.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
