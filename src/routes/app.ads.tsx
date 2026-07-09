import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/AppShell";
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
import { RefreshCw, Wand2, Image as ImageIcon, Save, Share2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/ads")({
  component: AdStudioPage,
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

const PLATFORMS = ["reddit", "x", "youtube"] as const;
const TONES = ["confident", "direct", "playful", "expert"] as const;
const AFFILIATE_LABEL = "Not informed by affiliate performance";

function AdStudioPage() {
  const { user, canEdit } = useAuth();
  const status = useConnectorStatus();
  const p = status.data?.platform;
  const orgId = user?.organization?.id;

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
      const result = await getAdIntelligence({ data: { organizationId: orgId } });
      setIntel(result);
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

  // ── Selection feeding generation ────────────────────────────────────────────
  const [selThemes, setSelThemes] = useState<string[]>([]);
  const [selHooks, setSelHooks] = useState<string[]>([]);
  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  // ── Editor state ────────────────────────────────────────────────────────────
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("confident");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("reddit");
  const [draft, setDraft] = useState<AdRow | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Saved and shared ads ────────────────────────────────────────────────────
  const [ads, setAds] = useState<AdRow[]>([]);

  const loadAds = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from("ads")
      .select(
        "id,name,headline,body,cta,image_path,image_prompt,target_platform,informed_by_affiliate,status,shared,created_by,insights",
      )
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false });
    setAds((data ?? []) as AdRow[]);
  }, [orgId]);

  useEffect(() => {
    void loadAds();
  }, [loadAds]);

  const signedUrl = useCallback(async (path: string | null): Promise<string | null> => {
    if (!path) return null;
    const { data } = await supabase.storage.from("ad-images").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  }, []);

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
          themes: selThemes,
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
          informed_by_affiliate: false,
          status: "draft",
          insights: { themes: selThemes, hooks: selHooks },
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
      await loadAds();
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
      await loadAds();
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
      await loadAds();
      toast.success(share ? "Saved and shared with the team" : "Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const editAd = async (ad: AdRow) => {
    setDraft(ad);
    setImagePrompt(ad.image_prompt ?? "");
    setImageUrl(await signedUrl(ad.image_path));
  };

  if (!user) {
    return (
      <AppShell title="Ad Studio">
        <Card className="p-8 text-center text-[#8892A4]">Sign in to open Ad Studio.</Card>
      </AppShell>
    );
  }

  if (!orgId) {
    return (
      <AppShell title="Ad Studio">
        <Card className="p-8 text-center">
          <h2 className="text-lg font-bold text-white">Set up your brand first</h2>
          <p className="mt-2 text-sm text-[#8892A4]">
            Ad Studio works inside a brand organization. Finish onboarding to create one.
          </p>
          <Link
            to="/onboarding"
            className="mt-4 inline-block px-5 py-2 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold"
          >
            Go to onboarding
          </Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Ad Studio">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Ad intelligence and creation</h2>
        <p className="text-[#8892A4] mt-1">
          Signals rank the hooks, phrases, and themes that earn attention, then feed copy and imagery.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
        {/* ── Left: signals and intelligence ── */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-wider text-[#8892A4] font-semibold mb-3">
              Signal sources
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {p &&
                (
                  [
                    ["Brand24", p.listening],
                    ["Phyllo", p.creatorPerformance],
                    ["YouTube", p.youtube],
                    ["X", p.x],
                    ["Reddit", p.reddit],
                    ["Trends", p.trends],
                  ] as const
                ).map(([label, on]) => (
                  <span
                    key={label}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      on
                        ? "bg-[#00D97E]/15 text-[#00D97E] border-[#00D97E]/30"
                        : "bg-white/[0.03] text-[#5A6478] border-white/10"
                    }`}
                  >
                    {label}
                  </span>
                ))}
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runCollect()}
                  placeholder="Topic to listen for"
                  className="flex-1 h-10 px-3 rounded-lg bg-[#05080F] border border-white/10 text-sm focus:outline-none focus:border-[#00D97E]"
                />
                <button
                  onClick={runCollect}
                  disabled={collecting || !anySource || !query.trim()}
                  className="px-3 h-10 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold disabled:opacity-40 inline-flex items-center gap-1.5"
                >
                  {collecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Refresh
                </button>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-wider text-[#8892A4] font-semibold mb-3">
              Ranked intelligence
            </div>
            <DataGate
              connected={anySource}
              loading={status.isLoading || intelLoading}
              empty={!intel || intel.total === 0}
              label="Ranks once a signal source is configured and signals are stored"
            >
              {intel && (
                <div className="space-y-4">
                  <p className="text-xs text-[#8892A4]">
                    From {intel.total} signals. Select terms to feed generation.
                  </p>
                  <TermGroup
                    title="Hooks"
                    terms={intel.hooks}
                    selected={selHooks}
                    onToggle={(t) => setSelHooks((a) => toggle(a, t))}
                  />
                  <TermGroup
                    title="Phrases"
                    terms={intel.phrases}
                    selected={selThemes}
                    onToggle={(t) => setSelThemes((a) => toggle(a, t))}
                  />
                  <TermGroup
                    title="Themes"
                    terms={intel.themes}
                    selected={selThemes}
                    onToggle={(t) => setSelThemes((a) => toggle(a, t))}
                  />
                </div>
              )}
            </DataGate>
          </Card>
        </div>

        {/* ── Right: generation and editor ── */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-wider text-[#8892A4] font-semibold mb-3">
              Generate copy
            </div>
            <DataGate
              connected={llmReady}
              loading={status.isLoading}
              label="Copy generation runs through the LLM connection"
            >
              <div className="space-y-3">
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="What are you advertising? Product, offer, and audience."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-[#05080F] border border-white/10 text-sm focus:outline-none focus:border-[#00D97E]"
                />
                <div className="flex flex-wrap gap-3">
                  <label className="text-xs text-[#8892A4] flex items-center gap-2">
                    Platform
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as (typeof PLATFORMS)[number])}
                      className="h-9 px-2 rounded-lg bg-[#05080F] border border-white/10 text-sm text-white"
                    >
                      {PLATFORMS.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-[#8892A4] flex items-center gap-2">
                    Tone
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
                      className="h-9 px-2 rounded-lg bg-[#05080F] border border-white/10 text-sm text-white"
                    >
                      {TONES.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {canEdit ? (
                  <button
                    onClick={generateCopy}
                    disabled={generatingCopy || !brief.trim()}
                    className="px-4 h-10 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold disabled:opacity-40 inline-flex items-center gap-1.5"
                  >
                    {generatingCopy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Generate copy
                  </button>
                ) : (
                  <p className="text-xs text-[#8892A4]">Reviewer access is read only.</p>
                )}
              </div>
            </DataGate>
          </Card>

          {draft && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] uppercase tracking-wider text-[#8892A4] font-semibold">Editor</div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/30">
                  {AFFILIATE_LABEL}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <Field label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} disabled={!canEdit} />
                  <Field label="Headline" value={draft.headline ?? ""} onChange={(v) => setDraft({ ...draft, headline: v })} disabled={!canEdit} />
                  <Field label="Body" value={draft.body ?? ""} onChange={(v) => setDraft({ ...draft, body: v })} disabled={!canEdit} multiline />
                  <Field label="Call to action" value={draft.cta ?? ""} onChange={(v) => setDraft({ ...draft, cta: v })} disabled={!canEdit} />
                  {canEdit && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => saveDraft(false)}
                        disabled={saving}
                        className="px-4 h-10 rounded-lg border border-white/15 text-sm font-bold text-white hover:bg-white/5 disabled:opacity-40 inline-flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" /> Save
                      </button>
                      <button
                        onClick={() => saveDraft(true)}
                        disabled={saving}
                        className="px-4 h-10 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold disabled:opacity-40 inline-flex items-center gap-1.5"
                      >
                        <Share2 className="w-4 h-4" /> Save and share
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-[11px] uppercase tracking-wider text-[#8892A4] font-semibold">Imagery</div>
                  <div className="aspect-square rounded-xl border border-white/10 bg-[#05080F] overflow-hidden flex items-center justify-center">
                    {imageUrl ? (
                      <img src={imageUrl} alt={draft.headline ?? "Ad image"} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-[#5A6478]">No image yet</span>
                    )}
                  </div>
                  <DataGate
                    connected={imageReady}
                    loading={status.isLoading}
                    label="Imagery runs through the image connection"
                  >
                    <div className="space-y-2">
                      <textarea
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        rows={2}
                        disabled={!canEdit}
                        placeholder="Describe the image"
                        className="w-full px-3 py-2 rounded-lg bg-[#05080F] border border-white/10 text-sm focus:outline-none focus:border-[#00D97E] disabled:opacity-60"
                      />
                      {canEdit && (
                        <button
                          onClick={regenerateImage}
                          disabled={generatingImage || !imagePrompt.trim()}
                          className="px-4 h-10 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold disabled:opacity-40 inline-flex items-center gap-1.5"
                        >
                          {generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                          Generate image
                        </button>
                      )}
                    </div>
                  </DataGate>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-wider text-[#8892A4] font-semibold mb-3">
              Saved ads
            </div>
            {ads.length === 0 ? (
              <p className="text-sm text-[#8892A4]">Generated ads you save appear here. Shared ads are visible to the team.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ads.map((ad) => (
                  <SavedAdCard key={ad.id} ad={ad} signedUrl={signedUrl} canEdit={canEdit} onEdit={() => editAd(ad)} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function TermGroup({
  title,
  terms,
  selected,
  onToggle,
}: {
  title: string;
  terms: RankedTerm[];
  selected: string[];
  onToggle: (t: string) => void;
}) {
  if (terms.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[#5A6478] font-semibold mb-1.5">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {terms.map((t) => {
          const on = selected.includes(t.text);
          return (
            <button
              key={t.text}
              onClick={() => onToggle(t.text)}
              title={`score ${t.score} across ${t.sources.join(", ")}`}
              className={`px-2 py-1 rounded-lg text-[11px] border text-left ${
                on
                  ? "bg-[#00D97E]/15 text-[#00D97E] border-[#00D97E]/40"
                  : "bg-white/[0.03] text-[#B8C0CE] border-white/10 hover:border-white/25"
              }`}
            >
              {t.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-[#5A6478] font-semibold">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          className="mt-1 w-full px-3 py-2 rounded-lg bg-[#05080F] border border-white/10 text-sm focus:outline-none focus:border-[#00D97E] disabled:opacity-60"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="mt-1 w-full h-9 px-3 rounded-lg bg-[#05080F] border border-white/10 text-sm focus:outline-none focus:border-[#00D97E] disabled:opacity-60"
        />
      )}
    </label>
  );
}

function SavedAdCard({
  ad,
  signedUrl,
  canEdit,
  onEdit,
}: {
  ad: AdRow;
  signedUrl: (p: string | null) => Promise<string | null>;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void signedUrl(ad.image_path).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
  }, [ad.image_path, signedUrl]);

  return (
    <div className="rounded-xl border border-white/10 bg-[#05080F] overflow-hidden flex flex-col">
      <div className="aspect-video bg-[#0C1222] flex items-center justify-center overflow-hidden">
        {url ? (
          <img src={url} alt={ad.headline ?? ad.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[11px] text-[#5A6478]">No image</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-white/5 text-[#8892A4] border border-white/10">
            {ad.status}
          </span>
          {ad.shared && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#00D97E]/15 text-[#00D97E] border border-[#00D97E]/30">
              Shared
            </span>
          )}
          {ad.target_platform && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-white/5 text-[#8892A4] border border-white/10">
              {ad.target_platform}
            </span>
          )}
        </div>
        <div className="text-sm font-bold text-white line-clamp-2">{ad.headline || ad.name}</div>
        {ad.body && <div className="text-xs text-[#8892A4] line-clamp-3">{ad.body}</div>}
        {ad.cta && <div className="text-xs font-semibold text-[#00D97E]">{ad.cta}</div>}
        <div className="text-[9px] text-[#5A6478] mt-auto pt-1">
          {ad.informed_by_affiliate ? "Informed by affiliate performance" : AFFILIATE_LABEL}
        </div>
        {canEdit && (
          <button
            onClick={onEdit}
            className="mt-1 h-8 rounded-lg border border-white/15 text-xs font-bold text-white hover:bg-white/5"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
