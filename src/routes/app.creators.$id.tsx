// Creator Profile Page
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/AppShell";
import { ArrowLeft, Mail, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";
import { OutreachComposer } from "@/components/app/OutreachComposer";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/creators/$id")({
  component: CreatorProfilePage,
});

type Row = Tables<"hotlist">;

const STAGES: { key: string; label: string }[] = [
  { key: "saved", label: "Saved" },
  { key: "contacted", label: "Contacted" },
  { key: "negotiating", label: "Negotiating" },
  { key: "contracted", label: "Contracted" },
  { key: "live", label: "Live / Posted" },
];

const platColor = (p: string | null | undefined) => {
  const v = (p ?? "").toLowerCase();
  return v === "youtube" ? "#FF0000" : v === "reddit" ? "#FF4500" : v === "x" ? "#1A1A1A" : v === "linkedin" ? "#0A66C2" : "#7C3AED";
};

function CreatorProfilePage() {
  const { id } = useParams({ from: "/app/creators/$id" });
  const { user } = useAuth();
  const status = useConnectorStatus();
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Try external_id first, then creator_name slug match
      const { data: byExt } = await supabase
        .from("hotlist")
        .select("*")
        .eq("user_id", user.id)
        .eq("external_id", id)
        .maybeSingle();
      let found = byExt;
      if (!found) {
        const { data: all } = await supabase
          .from("hotlist")
          .select("*")
          .eq("user_id", user.id);
        found =
          all?.find(
            (r) => r.creator_name.toLowerCase().replace(/\s+/g, "-") === id.toLowerCase(),
          ) ?? null;
      }
      if (!cancelled) {
        setRow(found ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, id]);

  const addHotlist = async () => {
    if (!user || !row) return;
    toast.success("Already in your hotlist!");
  };

  const moveTo = async (stage: string) => {
    if (!row) return;
    const prev = row;
    setRow({ ...row, stage });
    const { error } = await supabase.from("hotlist").update({ stage }).eq("id", row.id);
    if (error) {
      toast.error(error.message);
      setRow(prev);
    } else {
      toast.success(`Moved to ${STAGES.find((s) => s.key === stage)?.label ?? stage}`);
    }
  };

  if (loading) {
    return (
      <AppShell title="">
        <div className="text-sm text-[#8892A4] py-12 text-center">Loading…</div>
      </AppShell>
    );
  }

  if (!row) {
    return (
      <AppShell
        title=""
        right={
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-white/10 hover:bg-white/5 text-sm text-[#8892A4] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      >
        <DataGate connected={true} empty>
          <></>
        </DataGate>
      </AppShell>
    );
  }

  const platform = row.platform ?? "";
  const platKey = platform.toLowerCase();
  const p = status.data?.platform;
  const platformConnected = status.data
    ? platKey === "youtube"
      ? p!.youtube
      : platKey === "reddit"
        ? p!.reddit
        : platKey === "x"
          ? p!.x
          : false
    : undefined;
  const profile = (row.profile_data ?? {}) as { description?: string; thumbnail?: string };

  return (
    <AppShell
      title=""
      right={
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-white/10 hover:bg-white/5 text-sm text-[#8892A4] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      }
    >
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          {row.avatar_url ? (
            <img
              src={row.avatar_url}
              alt={row.creator_name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full bg-white/5 border border-white/10 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 shrink-0 flex items-center justify-center text-xl font-bold text-[#8892A4]">
              {row.creator_name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-[#F0F4FF]">{row.creator_name}</h1>
              {platform && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: platColor(platform) }}
                >
                  {platform}
                </span>
              )}
              {row.stage && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#8892A4]">
                  {row.stage}
                </span>
              )}
            </div>
            {row.cpm || typeof row.score === "number" ? (
              <div className="text-sm text-[#8892A4] mt-1.5">
                {typeof row.score === "number" && (
                  <>
                    <span className="font-semibold text-[#F0F4FF]">{row.score}%</span> fit
                  </>
                )}
                {row.cpm && (
                  <>
                    {typeof row.score === "number" ? " · " : ""}
                    <span className="font-semibold text-[#F0F4FF]">{row.cpm}</span> CPM
                  </>
                )}
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setComposing(true)}
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold hover:brightness-110"
            >
              <Mail className="w-4 h-4" /> Contact Creator
            </button>
            <button
              onClick={addHotlist}
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg border border-[#00D97E] text-[#00D97E] text-sm font-bold hover:bg-[#00D97E]/10"
            >
              <Star className="w-4 h-4" /> In Hotlist
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="text-lg font-bold text-[#F0F4FF] mb-3">Stage</h3>
        <div className="flex gap-2 flex-wrap">
          {STAGES.map((s) => {
            const active = (row.stage ?? "saved").toLowerCase() === s.key;
            return (
              <button
                key={s.key}
                onClick={() => !active && moveTo(s.key)}
                className={
                  active
                    ? "px-3 h-8 rounded-full text-xs font-bold bg-[#00D97E] text-[#05080F]"
                    : "px-3 h-8 rounded-full text-xs font-bold border border-white/10 text-[#8892A4] hover:text-white hover:border-[#00D97E]/50"
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="text-lg font-bold text-[#F0F4FF] mb-2">About</h3>
        <p className="text-sm text-[#F0F4FF]/80 leading-relaxed">
          {profile.description || "No description available."}
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Platform Metrics</h3>
        <DataGate
          connected={platformConnected}
          empty
          loading={status.isLoading}
          label={platform ? `Metrics load from the ${platform} connection` : "Metrics load once this platform is connected"}
        >
          <></>
        </DataGate>
      </Card>

      {/* Outreach composer modal */}
      {composing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setComposing(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0C1222] p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end -mt-2 -mr-2">
              <button
                onClick={() => setComposing(false)}
                className="p-1.5 rounded-lg text-[#8892A4] hover:text-white hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <OutreachComposer
              hotlistId={row.id}
              campaignId={row.campaign_id}
              creatorName={row.creator_name}
              onSent={() => setComposing(false)}
              onClose={() => setComposing(false)}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
