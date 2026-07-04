import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";

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
    <AppShell title="Expansion & Upsell">
      <p className="text-[#8892A4] mb-6">Identify your top performers and scale what works</p>

      <Card className="mb-6">
        <div className="p-5 border-b border-white/[0.07]">
          <h3 className="font-bold">Creator Performance Scores</h3>
        </div>
        <div className="p-5">
          <DataGate
            connected={perfReady}
            empty
            loading={status.isLoading}
            label="Scores load from the creator performance connection"
          >
            <></>
          </DataGate>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-bold mb-1">Recommended New Creators</h3>
          <p className="text-xs text-[#8892A4] mb-4">Based on your top performers</p>
          <DataGate
            connected={trendsReady}
            empty
            loading={status.isLoading}
            label="Recommendations load from the trends connection"
          >
            <></>
          </DataGate>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold mb-4">Budget Reallocation Suggestions</h3>
          <DataGate
            connected={insightReady}
            empty
            loading={status.isLoading}
            label="Suggestions need the LLM and creator performance connections"
          >
            <></>
          </DataGate>
        </Card>
      </div>
    </AppShell>
  );
}
