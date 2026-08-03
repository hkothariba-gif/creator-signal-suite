import { createFileRoute, Link } from "@tanstack/react-router";
import type { SearchSchemaInput } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  collectSignals,
  getAdIntelligence,
  generateAdCopy,
  generateAdImage,
} from "@/lib/ads.functions";
import type { AdIntelligence, RankedTerm } from "@/lib/intelligence";
import { useAspenCampaign } from "@/routes/app";

/* ADS CENTER — the `v.isAds` block of src/aspen/AspenApp.tsx, on the live hooks
   the dark version used. Shell, header and title come from the /app layout
   route. Campaign scope comes from the sidebar switcher; the `campaign` search
   param still overrides it.

   Only the Generate view exists now. The design's Library and Intelligence tabs
   both rendered the Generate layout — they were chrome with nothing behind them
   — so they are gone rather than left as dead affordances. The ranked
   intelligence panel is still here in the left column, which is where the
   design puts it; what is no longer reachable is the saved-ads browser that the
   dark version had behind the Library tab (components/app/AdsLibrary.tsx is
   still in the tree, unrendered, waiting for a screen of its own). */

export const Route = createFileRoute("/app/ads")({
  validateSearch: (search: { campaign?: string } & SearchSchemaInput) => ({
    campaign: typeof search.campaign === "string" ? search.campaign : undefined,
  }),
  component: AdsCenterPage,
});

type AdRow = {
  id: string;
  name: string;
  headline: string | null;
  body: string | null;
  cta: string | null;
  image_path: string | null;
  image_prompt: string | null;
  target_platform: string | null;
  informed_by_affiliate: boolean;
  status: string;
  shared: boolean;
  created_by: string;
  insights: unknown;
};

const PLATFORMS = ["reddit", "x", "youtube", "linkedin"] as const;
const TONES = ["confident", "direct", "playful", "expert"] as const;

function AdsCenterPage() {
  const { user } = useAuth();
  const status = useConnectorStatus();
  const p = status.data?.platform;
  const orgId = user?.organization?.id;
  const { selected: selectedCampaign } = useAspenCampaign();
  const { campaign: campaignParam } = Route.useSearch();
  const campaignId = campaignParam ?? selectedCampaign?.id;

  const anySource: boolean | undefined = p
    ? p.listening || p.creatorPerformance || p.youtube || p.x || p.reddit || p.trends
    : undefined;
  const llmReady = p ? p.llm : undefined;
  const imageReady = p ? p.image : undefined;

  // ── Signals and intelligence ───────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [collecting, setCollecting] = useState(false);
  const [intel, setIntel] = useState<AdIntelligence | null>(null);
  const [intelLoading, setIntelLoading] = useState(false);

  const loadIntel = useCallback(async () => {
    if (!orgId) return;
    setIntelLoading(true);
    try {
      setIntel(await getAdIntelligence({ data: { organizationId: orgId } }));
    } catch {
      setIntel(null);
    } finally {
      setIntelLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void loadIntel();
  }, [loadIntel]);

  const runCollect = async () => {
    if (!orgId || !query.trim()) return;
    setCollecting(true);
    try {
      const res = await collectSignals({ data: { organizationId: orgId, query: query.trim() } });
      if (res.inserted > 0) toast.success(`Stored ${res.inserted} signals`);
      else toast.info("No signals returned for that topic");
      await loadIntel();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not collect signals");
    } finally {
      setCollecting(false);
    }
  };

  // ── Selection feeding generation ───────────────────────────────────────────
  const [selThemes, setSelThemes] = useState<string[]>([]);
  const [selHooks, setSelHooks] = useState<string[]>([]);
  const [selAngles, setSelAngles] = useState<string[]>([]);
  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  // ── Editor state ───────────────────────────────────────────────────────────
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("confident");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("reddit");
  const [draft, setDraft] = useState<AdRow | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const generateCopy = async () => {
    if (!orgId || !brief.trim()) return;
    setGeneratingCopy(true);
    try {
      const copy = await generateAdCopy({
        data: {
          organizationId: orgId,
          brand: user?.company_name ?? user?.organization?.name ?? "the brand",
          brief: brief.trim(),
          tone,
          platform,
          themes: [...selThemes, ...selAngles],
          hooks: selHooks,
        },
      });
      // Persist a draft immediately so imagery has an ad to attach to.
      const { data, error } = await supabase
        .from("ads")
        .insert({
          organization_id: orgId,
          name: copy.headline ? copy.headline.slice(0, 60) : "Untitled ad",
          headline: copy.headline,
          body: copy.body,
          cta: copy.cta,
          target_platform: platform,
          informed_by_affiliate: selAngles.length > 0,
          status: "draft",
          insights: { themes: selThemes, hooks: selHooks, angles: selAngles },
          created_by: user!.id,
        })
        .select(
          "id,name,headline,body,cta,image_path,image_prompt,target_platform,informed_by_affiliate,status,shared,created_by,insights",
        )
        .single();
      if (error) throw new Error(error.message);
      setDraft(data as AdRow);
      setImageUrl(null);
      setImagePrompt(
        `Advertising image for ${user?.company_name ?? "the brand"}. ${copy.headline}. ${selThemes.slice(0, 4).join(", ")}`.trim(),
      );
      toast.success("Draft created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate copy");
    } finally {
      setGeneratingCopy(false);
    }
  };

  const regenerateImage = async () => {
    if (!orgId || !draft || !imagePrompt.trim()) return;
    setGeneratingImage(true);
    try {
      const res = await generateAdImage({
        data: { organizationId: orgId, adId: draft.id, prompt: imagePrompt.trim() },
      });
      setImageUrl(res.url);
      setDraft((d) => (d ? { ...d, image_path: res.path, image_prompt: imagePrompt.trim() } : d));
      toast.success("Image attached");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate image");
    } finally {
      setGeneratingImage(false);
    }
  };

  const saveDraft = async (share: boolean) => {
    if (!orgId || !draft) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("ads")
        .update({
          name: draft.name,
          headline: draft.headline,
          body: draft.body,
          cta: draft.cta,
          status: "saved",
          shared: share ? true : draft.shared,
        })
        .eq("id", draft.id);
      if (error) throw new Error(error.message);
      setDraft((d) => (d ? { ...d, status: "saved", shared: share ? true : d.shared } : d));
      toast.success(share ? "Saved and shared with the team" : "Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="aspen-scope text-[14px] text-subtle p-[48px_0] text-center">
        Sign in to open the Ads Center.
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="aspen-scope bg-surface border-[1.5px] border-border rounded-[22px] p-[36px] text-center max-w-[560px]">
        <h2 className="font-heading font-extrabold text-[22px] tracking-[-0.02em] m-0">
          Create your first campaign
        </h2>
        <p className="text-[14.5px] text-muted leading-[1.6] m-[10px_auto_0] max-w-[400px]">
          Ads are built for a product, on a campaign. Finish the quick setup and your first campaign
          lands right back here.
        </p>
        <Link
          to="/onboarding"
          className="mt-[18px] inline-block border-0 bg-accent text-cream text-[14px] font-bold p-[12px_20px] rounded-[12px] ah21"
        >
          Finish setup
        </Link>
      </div>
    );
  }

  // The design's four intelligence groups, filled from the ranked terms.
  const groups: {
    title: string;
    terms: RankedTerm[];
    sel: string[];
    set: (v: string[]) => void;
  }[] = [
    { title: "HOOKS", terms: intel?.hooks ?? [], sel: selHooks, set: setSelHooks },
    { title: "PHRASES", terms: intel?.phrases ?? [], sel: selThemes, set: setSelThemes },
    { title: "THEMES", terms: intel?.themes ?? [], sel: selThemes, set: setSelThemes },
    { title: "AFFILIATE ANGLES", terms: intel?.angles ?? [], sel: selAngles, set: setSelAngles },
  ];

  const sourceChip = (label: string, on: boolean | undefined) => (
    <span
      key={label}
      className="text-[11.5px] font-bold p-[5px_10px] rounded-[8px]"
      style={
        on
          ? { background: "#DDF3E6", color: "#0E7A3D" }
          : { background: "#F5F1E9", color: "#8A8494" }
      }
    >
      {label}
    </span>
  );

  return (
    <div className="aspen-scope">
      <div className="flex gap-[16px] items-start flex-wrap">
        <div className="flex-[0_1_340px] min-w-[290px] flex flex-col gap-[16px]">
          <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[20px]">
            <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle mb-[12px]">
              SIGNAL SOURCES
            </div>
            <div className="flex gap-[7px] flex-wrap">
              {sourceChip("YouTube", p?.youtube)}
              {sourceChip("Reddit", p?.reddit)}
              {sourceChip("X", p?.x)}
              {/* No LinkedIn connector exists yet, so this chip can only ever
                  read "not configured". Kept because the design lists it as a
                  signal source and its absence is the honest status. */}
              {sourceChip("LinkedIn", undefined)}
              {sourceChip("Affiliate", intel?.affiliateInformed)}
              {sourceChip("Trends", p?.trends)}
            </div>
            <div className="flex gap-[8px] mt-[14px]">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runCollect()}
                placeholder="Topic to listen for"
                className="flex-1 min-w-0 h-[42px] p-[0_13px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14px] outline-none"
              />
              <button
                onClick={runCollect}
                disabled={!query.trim() || collecting}
                className="border-0 bg-dark text-cream text-[13px] font-bold p-[0_15px] rounded-[11px] cursor-pointer ah37 disabled:opacity-40"
              >
                {collecting ? "…" : "Refresh"}
              </button>
            </div>
          </div>

          <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[20px]">
            <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle">
              RANKED INTELLIGENCE
            </div>
            <div className="text-[12.5px] text-subtle m-[8px_0_16px]">
              {intel
                ? `From ${intel.total} signals. Pick the terms that feed the draft.`
                : "Collect signals to rank the language your audience uses."}
            </div>
            <DataGate
              connected={anySource}
              loading={status.isLoading || intelLoading}
              empty={!intel || intel.total === 0}
              label="Signals come from your platform connections"
            >
              <div className="flex flex-col gap-[16px]">
                {groups.map((g) => (
                  <div key={g.title}>
                    <div className="text-[10.5px] font-bold tracking-[0.12em] text-sand-ink mb-[8px]">
                      {g.title}
                    </div>
                    <div className="flex gap-[7px] flex-wrap">
                      {g.terms.length === 0 ? (
                        <span className="text-[12.5px] text-subtle">None yet</span>
                      ) : (
                        g.terms.map((t) => {
                          const on = g.sel.includes(t.text);
                          return (
                            <button
                              key={t.text}
                              onClick={() => g.set(toggle(g.sel, t.text))}
                              title={`${t.count} mention${t.count === 1 ? "" : "s"} · ${t.sources.join(", ")}`}
                              className="text-[12.5px] font-semibold p-[7px_11px] rounded-[10px] cursor-pointer text-left"
                              style={{
                                border: `1.5px solid ${on ? "#F2542D" : "#E8E2D6"}`,
                                background: on ? "#FFECD9" : "#FAF7F1",
                                color: on ? "#B33A12" : "#4A4553",
                              }}
                            >
                              {t.text}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DataGate>
          </div>
        </div>

        <div className="flex-[1_1_420px] min-w-[320px] flex flex-col gap-[16px]">
          <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
            <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle mb-[12px]">
              GENERATE COPY
            </div>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="What are you advertising? Product, offer, and audience."
              rows={3}
              className="w-full box-border p-[14px] rounded-[14px] border-[1.5px] border-border bg-cream text-[14.5px] leading-[1.55] outline-none resize-y"
            />
            <div className="flex gap-[10px] mt-[12px] flex-wrap items-center">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as (typeof PLATFORMS)[number])}
                className="h-[42px] p-[0_12px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14px] capitalize"
              >
                {PLATFORMS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
                className="h-[42px] p-[0_12px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14px] capitalize"
              >
                {TONES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <button
                onClick={generateCopy}
                disabled={!llmReady || !brief.trim() || generatingCopy}
                className="border-0 bg-accent text-cream text-[14px] font-bold p-[0_20px] h-[42px] rounded-[11px] cursor-pointer ah38 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {generatingCopy ? "Generating…" : "Generate copy"}
              </button>
            </div>
            {llmReady === false ? (
              <div className="text-[12.5px] text-subtle mt-[10px]">
                Waiting for API connection — copy generation needs the model connection.
              </div>
            ) : null}
          </div>

          <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
            <div className="flex items-center justify-between gap-[12px] mb-[16px]">
              <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle">EDITOR</div>
              {draft?.informed_by_affiliate ? (
                <span className="text-[11px] font-bold bg-tint text-accent-ink p-[5px_10px] rounded-[8px]">
                  Informed by affiliate performance
                </span>
              ) : null}
            </div>

            {!draft ? (
              <div className="text-[13.5px] text-subtle p-[24px_0] text-center">
                Generate copy to start a draft. It saves as you go, so imagery has something to
                attach to.
              </div>
            ) : (
              <>
                <div className="flex gap-[20px] flex-wrap">
                  <div className="flex-[1_1_260px] min-w-[240px] flex flex-col gap-[12px]">
                    <div>
                      <div className="text-[10.5px] font-bold tracking-[0.12em] text-sand-ink mb-[6px]">
                        HEADLINE
                      </div>
                      <input
                        value={draft.headline ?? ""}
                        onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
                        className="w-full box-border h-[44px] p-[0_13px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14.5px] font-semibold outline-none"
                      />
                    </div>
                    <div>
                      <div className="text-[10.5px] font-bold tracking-[0.12em] text-sand-ink mb-[6px]">
                        BODY
                      </div>
                      <textarea
                        value={draft.body ?? ""}
                        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                        rows={4}
                        className="w-full box-border p-[13px] rounded-[12px] border-[1.5px] border-border bg-cream text-[14px] leading-[1.55] outline-none resize-y"
                      />
                    </div>
                    <div>
                      <div className="text-[10.5px] font-bold tracking-[0.12em] text-sand-ink mb-[6px]">
                        CALL TO ACTION
                      </div>
                      <input
                        value={draft.cta ?? ""}
                        onChange={(e) => setDraft({ ...draft, cta: e.target.value })}
                        className="w-full box-border h-[44px] p-[0_13px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14.5px] outline-none"
                      />
                    </div>
                    <div className="flex gap-[9px] mt-[2px]">
                      <button
                        onClick={() => saveDraft(false)}
                        disabled={saving}
                        className="border-[1.5px] border-border bg-transparent text-[13.5px] font-bold p-[11px_16px] rounded-[11px] cursor-pointer ah39 disabled:opacity-40"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => saveDraft(true)}
                        disabled={saving}
                        className="border-0 bg-dark text-cream text-[13.5px] font-bold p-[12px_17px] rounded-[11px] cursor-pointer ah40 disabled:opacity-40"
                      >
                        Save and share
                      </button>
                    </div>
                  </div>
                  <div className="flex-[0_1_230px] min-w-[200px]">
                    <div className="text-[10.5px] font-bold tracking-[0.12em] text-sand-ink mb-[8px]">
                      IMAGERY
                    </div>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Generated ad creative"
                        className="w-full rounded-[14px] block"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-[14px] bg-sand grid place-items-center text-[12.5px] text-subtle text-center p-[12px]">
                        No image yet
                      </div>
                    )}
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      rows={2}
                      placeholder="Describe the image"
                      className="w-full box-border mt-[10px] p-[11px] rounded-[11px] border-[1.5px] border-border bg-cream text-[13px] leading-[1.5] outline-none resize-y"
                    />
                    <button
                      onClick={regenerateImage}
                      disabled={!imageReady || !imagePrompt.trim() || generatingImage}
                      className="w-full mt-[8px] border-[1.5px] border-border bg-transparent text-[13px] font-bold p-[10px_0] rounded-[11px] cursor-pointer ah41 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {generatingImage ? "Generating…" : "Generate image"}
                    </button>
                  </div>
                </div>

                {selThemes.length || selHooks.length || selAngles.length ? (
                  <div className="text-[12.5px] text-subtle leading-[1.5] mt-[18px] pt-[16px] border-t-[1.5px] border-border-soft">
                    Traced back to:{" "}
                    {[...selHooks, ...selThemes, ...selAngles].map((t, i, arr) => (
                      <span key={t}>
                        <strong className="text-muted">“{t}”</strong>
                        {i < arr.length - 1 ? " · " : ""}
                      </span>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
