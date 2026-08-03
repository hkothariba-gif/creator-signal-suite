import { createFileRoute } from "@tanstack/react-router";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";

/* EXPANSION & UPSELL — the `v.isExpansion` block of src/aspen/AspenApp.tsx, on
   the live connector gates the dark version used. Shell, header and title come
   from the /app layout route.

   Nothing on this screen has a data source yet — performance scores, lookalike
   recommendations and budget suggestions all wait on connections — so it is the
   design's three panels around DataGate rather than the design's sample rows. */

export const Route = createFileRoute("/app/expansion")({
  component: ExpansionPage,
});

function ExpansionPage() {
  const status = useConnectorStatus();
  const p = status.data?.platform;

  const perfReady = status.data ? p!.creatorPerformance : undefined;
  const trendsReady = status.data ? p!.trends : undefined;
  const insightReady = status.data ? p!.llm && p!.creatorPerformance : undefined;

  return (
    <div className="aspen-scope flex flex-col gap-[16px] max-w-[1020px]">
      <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
        <h3 className="font-heading font-bold text-[17px] m-[0_0_16px]">Creator performance</h3>
        <DataGate
          connected={perfReady}
          empty
          loading={status.isLoading}
          label="Scores load from the creator performance connection"
        >
          <></>
        </DataGate>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[16px]">
        <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
          <h3 className="font-heading font-bold text-[17px] m-[0_0_3px]">Recommended creators</h3>
          <div className="text-[13px] text-subtle mb-[16px]">Audiences that look like your top performers.</div>
          <DataGate
            connected={trendsReady}
            empty
            loading={status.isLoading}
            label="Recommendations load from the trends connection"
          >
            <></>
          </DataGate>
        </div>
        <div className="bg-dark text-cream rounded-[20px] p-[22px]">
          <h3 className="font-heading font-bold text-[17px] m-[0_0_3px]">Budget reallocation</h3>
          <div className="text-[13px] text-on-dark mb-[16px]">Based on the last 30 days of attribution.</div>
          {insightReady ? null : (
            <div className="text-[13.5px] text-on-dark leading-[1.55]">
              Waiting for API connection — suggestions need the model and creator performance connections.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
