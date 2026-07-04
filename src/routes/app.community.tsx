import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";

export const Route = createFileRoute("/app/community")({
  component: CommunityPage,
});

const TABS = ["Brand Mentions", "Buyer Intent", "Competitor Mentions", "Trending Topics"];

function CommunityPage() {
  const status = useConnectorStatus();
  const [tab, setTab] = useState(0);

  const listeningReady = status.data ? status.data.platform.listening : undefined;

  return (
    <AppShell title="Community Signals">
      <p className="text-[#8892A4] mb-6">Reddit and X conversations about your product and category</p>

      <div className="flex gap-6 border-b border-white/[0.07] mb-5 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
              tab === i ? "border-[#00D97E] text-[#00D97E]" : "border-transparent text-[#8892A4] hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <DataGate
        connected={listeningReady}
        empty
        loading={status.isLoading}
        label="Signals load from the social listening connection"
      >
        <></>
      </DataGate>
    </AppShell>
  );
}
