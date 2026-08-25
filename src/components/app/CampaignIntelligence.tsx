import { X } from "lucide-react";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";
import { AppDialog, AppDialogClose, AppDialogContent } from "@/components/app/AppDialog";

// Ad and brief drafts are generated on the server from live campaign
// signals. Each panel gates on the connectors it depends on, so nothing
// renders until those pipes are open.

export function CampaignIntelligence({
  campaignName,
  onClose,
}: {
  campaignId: string;
  campaignName: string;
  onClose: () => void;
}) {
  const status = useConnectorStatus();
  const p = status.data?.platform;

  const redditReady = status.data ? p!.llm && p!.youtube && p!.reddit : undefined;
  const linkedinReady = status.data ? p!.llm && p!.youtube : undefined;
  const xReady = status.data ? p!.llm && p!.youtube && p!.x : undefined;

  return (
    <AppDialog open onOpenChange={(open) => !open && onClose()}>
      <AppDialogContent
        title={`${campaignName} intelligence`}
        description="Generated channel intelligence and draft readiness for this campaign."
        variant="right"
        overlayClassName="bg-black/60"
        contentClassName="w-full max-w-[680px] bg-bg-surface border-l border-white/[0.07] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-bg-surface flex items-center justify-between p-6 border-b border-white/[0.07]">
          <div>
            <div className="text-xs uppercase tracking-wider text-brand-green font-bold">
              Intelligence
            </div>
            <h3 className="font-bold text-lg mt-0.5">{campaignName}</h3>
          </div>
          <AppDialogClose asChild>
            <button
              type="button"
              aria-label={`Close ${campaignName} intelligence`}
              className="text-brand-muted hover:text-white"
            >
              <X aria-hidden="true" className="w-5 h-5" />
            </button>
          </AppDialogClose>
        </div>

        <div className="p-6 space-y-6">
          <Panel title="Reddit Ad Draft" accent="var(--color-reddit)">
            <DataGate
              connected={redditReady}
              loading={status.isLoading}
              label="Needs the LLM, YouTube, and Reddit connections"
            >
              <p className="text-sm text-brand-muted">
                Reddit ad drafts appear here once generated from your campaign signals.
              </p>
            </DataGate>
          </Panel>

          <Panel title="LinkedIn Brief" accent="var(--color-linkedin)">
            <DataGate
              connected={linkedinReady}
              loading={status.isLoading}
              label="Needs the LLM and YouTube connections"
            >
              <p className="text-sm text-brand-muted">
                LinkedIn collaboration briefs appear here once generated from your campaign signals.
              </p>
            </DataGate>
          </Panel>

          <Panel title="X Amplification" accent="#FFFFFF">
            <DataGate
              connected={xReady}
              loading={status.isLoading}
              label="Needs the LLM, YouTube, and X connections"
            >
              <p className="text-sm text-brand-muted">
                X amplification drafts appear here once generated from your campaign signals.
              </p>
            </DataGate>
          </Panel>
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}

function Panel({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-bg-elevated p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
        <h4 className="font-bold text-brand-ink">{title}</h4>
      </div>
      {children}
    </div>
  );
}
