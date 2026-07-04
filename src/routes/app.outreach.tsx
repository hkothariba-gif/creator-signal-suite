import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";

export const Route = createFileRoute("/app/outreach")({
  component: OutreachPage,
});

function OutreachPage() {
  const status = useConnectorStatus();
  const emailReady = status.data ? status.data.platform.email : undefined;

  return (
    <AppShell title="Outreach Sequences">
      <p className="text-[#8892A4] mb-6">Multi step outreach sent through your connected email account</p>

      <Card className="p-6 mb-6">
        <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Sequences</h3>
        <DataGate
          connected={emailReady}
          empty
          loading={status.isLoading}
          label="Sequences load from your email connection"
        >
          <></>
        </DataGate>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Delivery Metrics</h3>
        <DataGate
          connected={emailReady}
          empty
          loading={status.isLoading}
          label="Send, open, and reply counts load from your email connection"
        >
          <></>
        </DataGate>
      </Card>
    </AppShell>
  );
}
