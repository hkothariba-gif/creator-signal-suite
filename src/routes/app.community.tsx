import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";

/* COMMUNITY SIGNALS — the `v.isCommunity` block of src/aspen/AspenApp.tsx, on
   the live connector gate the dark version used. Shell, header and title come
   from the /app layout route.

   Signals have no store of their own yet — the listening connection feeds the
   Ads Center's ranked intelligence, not a per-signal feed — so each tab waits
   on that connection rather than showing the design's sample quotes. */

export const Route = createFileRoute("/app/community")({
  component: CommunityPage,
});

const TABS = ["Buyer intent", "Brand mentions", "Competitor mentions", "Trending topics"];

function CommunityPage() {
  const status = useConnectorStatus();
  const [tab, setTab] = useState(0);

  const listeningReady = status.data ? status.data.platform.listening : undefined;

  return (
    <div className="aspen-scope">
      <div className="flex gap-[26px] border-b-[1.5px] border-border mb-[22px] overflow-x-auto">
        {TABS.map((label, i) => (
          <button
            key={label}
            onClick={() => setTab(i)}
            className="border-0 bg-transparent cursor-pointer p-[0_0_13px] text-[14.5px] font-bold whitespace-nowrap mb-[-1.5px]"
            style={{
              color: tab === i ? "#17141E" : "#8A8494",
              borderBottom: `2.5px solid ${tab === i ? "#F2542D" : "transparent"}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="max-w-[920px]">
        <DataGate
          connected={listeningReady}
          empty
          loading={status.isLoading}
          label="Signals load from the social listening connection"
        >
          <></>
        </DataGate>
      </div>
    </div>
  );
}
