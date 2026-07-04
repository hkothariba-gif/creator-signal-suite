import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";

export const Route = createFileRoute("/app/affiliate")({
  component: AffiliatePage,
});

function AffiliatePage() {
  const status = useConnectorStatus();
  const salesReady = status.data ? status.data.account.sales : undefined;

  return (
    <AppShell title="Affiliate & Payouts">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {["Total Revenue", "Total Conversions", "Total Clicks"].map((label) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-[#8892A4] mb-2">{label}</p>
            <DataGate
              connected={salesReady}
              empty
              loading={status.isLoading}
              label="Loads from your sales connection"
            >
              <></>
            </DataGate>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#F0F4FF]">Affiliate Links</h2>
      </div>

      <DataGate
        connected={salesReady}
        empty
        loading={status.isLoading}
        label="Link tracking loads from your sales connection"
      >
        <></>
      </DataGate>
    </AppShell>
  );
}
