import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";
import { OutreachComposer } from "@/components/app/OutreachComposer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

/* CREATOR PROFILE — the `v.isCreator` block of src/aspen/AspenApp.tsx, on the
   live hooks the dark version used. Shell, header and title come from the /app
   layout route.

   `$id` is the hotlist row's UUID and nothing else. The dark version also
   accepted an external_id or a name slug, which meant two creators with the
   same name resolved to whichever row came back first, and a slug link could
   resolve to no row at all. Discovery and the Hotlist board both link with the
   row id now, so the lookup is a single primary-key read. */

export const Route = createFileRoute("/app/creators/$id")({
  component: CreatorProfilePage,
});

type Row = Tables<"hotlist">;

const STAGES: { key: string; label: string }[] = [
  { key: "saved", label: "Saved" },
  { key: "contacted", label: "Contacted" },
  { key: "negotiating", label: "Negotiating" },
  { key: "contracted", label: "Contracted" },
  { key: "live", label: "Live / posted" },
];

const platMark = (p: string | null | undefined) => {
  const v = (p ?? "").toLowerCase();
  if (v === "youtube") return { glyph: "▶", color: "var(--color-youtube)" };
  if (v === "reddit") return { glyph: "r/", color: "var(--color-reddit)" };
  if (v === "linkedin") return { glyph: "in", color: "var(--color-linkedin)" };
  if (v === "x") return { glyph: "X", color: "var(--color-dark)" };
  return { glyph: "·", color: "var(--color-subtle)" };
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
      const { data } = await supabase
        .from("hotlist")
        .select("*")
        .eq("user_id", user.id)
        .eq("id", id)
        .maybeSingle();
      if (!cancelled) {
        setRow(data ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, id]);

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

  const back = (
    <Link
      to="/app/discovery"
      search={{ campaign: undefined }}
      className="self-start border-0 bg-transparent text-[13.5px] font-bold text-subtle cursor-pointer p-0 ah32"
    >
      ← Back to discovery
    </Link>
  );

  if (loading) {
    return (
      <div className="aspen-scope flex flex-col gap-[16px] max-w-[920px]">
        {back}
        <div className="text-[14px] text-subtle p-[48px_0] text-center">Loading…</div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="aspen-scope flex flex-col gap-[16px] max-w-[920px]">
        {back}
        <DataGate connected={true} empty>
          <></>
        </DataGate>
      </div>
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
  const mark = platMark(platform);
  const stage = (row.stage ?? "saved").toLowerCase();

  return (
    <div className="aspen-scope flex flex-col gap-[16px] max-w-[920px]">
      {back}

      <div className="bg-surface border-[1.5px] border-border rounded-[22px] p-[26px] flex gap-[22px] items-start flex-wrap">
        {row.avatar_url ? (
          <img
            src={row.avatar_url}
            alt=""
            className="w-[76px] h-[76px] rounded-[22px] shrink-0 object-cover"
          />
        ) : (
          <div
            className="w-[76px] h-[76px] rounded-[22px] text-surface grid place-items-center font-extrabold text-[22px] shrink-0"
            style={{ background: mark.color }}
          >
            {mark.glyph}
          </div>
        )}
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-[10px] flex-wrap">
            <h2 className="font-heading font-extrabold text-[30px] tracking-[-0.025em] m-0">
              {row.creator_name}
            </h2>
            {platform ? (
              <span
                className="text-[11px] font-bold text-surface p-[4px_9px] rounded-[7px]"
                style={{ background: mark.color }}
              >
                {platform}
              </span>
            ) : null}
            <span className="text-[11px] font-bold bg-sand text-muted p-[4px_9px] rounded-[7px]">
              {STAGES.find((s) => s.key === stage)?.label ?? stage}
            </span>
          </div>
          {typeof row.score === "number" || row.cpm ? (
            <div className="text-[14.5px] text-muted mt-[8px]">
              {typeof row.score === "number" ? (
                <>
                  <strong className="text-dark">{row.score}%</strong> brand fit
                </>
              ) : null}
              {row.cpm ? (
                <>
                  {typeof row.score === "number" ? " · " : ""}
                  <strong className="text-dark">{row.cpm}</strong> CPM
                </>
              ) : null}
            </div>
          ) : (
            <div className="text-[14.5px] text-muted mt-[8px]">
              Not scored yet — run “Score creators” on the hotlist.
            </div>
          )}
        </div>
        <div className="flex gap-[10px]">
          <button
            onClick={() => setComposing(true)}
            className="border-0 bg-accent text-cream text-[14px] font-bold p-[12px_18px] rounded-[12px] cursor-pointer ah33"
          >
            Contact creator
          </button>
          <span className="border-[1.5px] border-accent text-accent text-[14px] font-bold p-[11px_16px] rounded-[12px]">
            ★ In hotlist
          </span>
        </div>
      </div>

      <div className="bg-surface border-[1.5px] border-border rounded-[22px] p-[24px]">
        <h3 className="font-heading font-bold text-[17px] m-[0_0_14px]">Stage</h3>
        <div className="flex gap-[8px] flex-wrap">
          {STAGES.map((s) => {
            const on = stage === s.key;
            return (
              <button
                key={s.key}
                onClick={() => !on && moveTo(s.key)}
                className="text-[13px] font-bold p-[9px_15px] rounded-[11px] cursor-pointer"
                style={{
                  border: `1.5px solid ${on ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: on ? "var(--color-accent)" : "transparent",
                  color: on ? "var(--color-cream)" : "var(--color-muted)",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[16px]">
        <div className="bg-surface border-[1.5px] border-border rounded-[22px] p-[24px]">
          <h3 className="font-heading font-bold text-[17px] m-[0_0_10px]">About</h3>
          <p className="text-[14.5px] leading-[1.6] text-muted m-0">
            {profile.description || "No description available."}
          </p>
        </div>
        <div className="bg-surface border-[1.5px] border-border rounded-[22px] p-[24px]">
          <h3 className="font-heading font-bold text-[17px] m-[0_0_14px]">Platform metrics</h3>
          <DataGate
            connected={platformConnected}
            empty
            loading={status.isLoading}
            label={
              platform
                ? `Metrics load from the ${platform} connection`
                : "Metrics load once this platform is connected"
            }
          >
            <></>
          </DataGate>
        </div>
      </div>

      {composing ? (
        <div
          className="aspen-scope fixed inset-0 z-50 flex items-center justify-center p-[16px]"
          onClick={() => setComposing(false)}
        >
          <div className="absolute inset-0 bg-[rgba(23,20,30,0.55)]" />
          <div
            className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto bg-surface border-[1.5px] border-border rounded-[22px] p-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                onClick={() => setComposing(false)}
                className="border-0 bg-transparent text-[18px] text-subtle cursor-pointer ah20"
                aria-label="Close"
              >
                ✕
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
      ) : null}
    </div>
  );
}
