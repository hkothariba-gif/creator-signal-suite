import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Archive, CheckCircle2, Quote } from "lucide-react";
import { Card } from "@/components/app/AppShell";
import { AdPreviewFrame } from "@/components/app/AdPreviewFrame";
import { supabase } from "@/integrations/supabase/client";
import { AD_STYLES } from "@/lib/ad-playbooks";

// Ads Center v3: the Library. Every ad generated for a campaign — platform
// previews, style + gate provenance, and a draft → approved → archived flow.

type AdRow = {
  id: string;
  headline: string | null;
  body: string | null;
  cta: string | null;
  target_platform: string | null;
  status: string;
  created_at?: string;
  provenance: {
    mode?: string;
    style?: string | null;
    gates?: Record<string, { pass: boolean; reason: string }>;
    corpus?: Array<{ kind: string; author: string | null; quote: string }>;
  } | null;
};

const STATUS_FLOW: Record<string, string> = { draft: "approved", saved: "approved", approved: "archived" };

export function AdsLibrary({
  organizationId,
  campaignId,
  brand,
  canEdit,
}: {
  organizationId: string;
  campaignId: string;
  brand: string;
  canEdit: boolean;
}) {
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "approved" | "archived">("all");
  const [openProvenance, setOpenProvenance] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ads")
      .select("id,headline,body,cta,target_platform,status,provenance,created_at")
      .eq("organization_id", organizationId)
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setAds((data ?? []) as AdRow[]);
    setLoading(false);
  }, [organizationId, campaignId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setStatus = async (ad: AdRow, status: string) => {
    const { error } = await supabase.from("ads").update({ status }).eq("id", ad.id);
    if (error) toast.error(error.message);
    else await refresh();
  };

  const visible = ads.filter((a) =>
    filter === "all"
      ? true
      : filter === "draft"
        ? a.status === "draft" || a.status === "saved"
        : a.status === filter,
  );

  return (
    <div>
      <div className="flex gap-1.5 mb-4">
        {(["all", "draft", "approved", "archived"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
              filter === f ? "bg-[#00D97E] text-[#05080F]" : "bg-white/[0.05] text-[#8892A4] hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-xs text-[#5A6478]">Loading…</p>
      ) : visible.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-[#8892A4]">
            No ads here yet — generate your first one in the Generate tab.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((ad) => {
            const style = AD_STYLES.find((s) => s.id === ad.provenance?.style);
            const gates = ad.provenance?.gates ?? {};
            const passed = Object.values(gates).length > 0 && Object.values(gates).every((g) => g.pass);
            return (
              <Card key={ad.id} className="p-3 space-y-2">
                <AdPreviewFrame
                  platform={ad.target_platform ?? "reddit"}
                  brand={brand}
                  headline={ad.headline ?? ""}
                  body={ad.body ?? ""}
                  cta={ad.cta ?? ""}
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-[#8892A4] capitalize">
                    {ad.status === "saved" ? "draft" : ad.status}
                  </span>
                  {style && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#8892A4]">
                      {style.emoji} {style.label}
                    </span>
                  )}
                  {Object.keys(gates).length > 0 && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        passed ? "bg-[#00D97E]/15 text-[#00D97E]" : "bg-[#F59E0B]/15 text-[#F59E0B]"
                      }`}
                    >
                      {passed ? "Gates ✓" : "Flagged"}
                    </span>
                  )}
                  <div className="ml-auto flex gap-1.5">
                    {(ad.provenance?.corpus?.length ?? 0) > 0 && (
                      <button
                        onClick={() => setOpenProvenance(openProvenance === ad.id ? null : ad.id)}
                        className="text-[10px] px-2 h-6 rounded-lg border border-white/10 text-[#8892A4] hover:text-white inline-flex items-center gap-1"
                      >
                        <Quote className="w-3 h-3" /> Why
                      </button>
                    )}
                    {canEdit && ad.status !== "archived" && (
                      <button
                        onClick={() => setStatus(ad, STATUS_FLOW[ad.status] ?? "approved")}
                        className="text-[10px] font-bold px-2 h-6 rounded-lg bg-white/[0.08] text-white hover:bg-white/[0.14] inline-flex items-center gap-1"
                      >
                        {ad.status === "approved" ? (
                          <>
                            <Archive className="w-3 h-3" /> Archive
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {openProvenance === ad.id && (
                  <div className="border-t border-white/[0.07] pt-2 space-y-1">
                    {(ad.provenance?.corpus ?? []).slice(0, 4).map((c, i) => (
                      <p key={i} className="text-[10px] text-[#F0F4FF]/70">
                        "{c.quote}" <span className="text-[#5A6478]">— {c.author ?? c.kind}</span>
                      </p>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
