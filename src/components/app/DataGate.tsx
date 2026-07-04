import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getConnectorStatus, type ConnectorStatus } from "@/lib/connectors.functions";

// Every data panel renders through this component. It shows one of three
// things: live data (children), "Waiting for API connection" when the
// integration behind the panel is not configured or the account is not
// connected, or "No data to display" when the pipe is open but empty.
// The choice is made from connector status, never from array length alone.

export const WAITING_COPY = "Waiting for API connection";
export const EMPTY_COPY = "No data to display";

export function useConnectorStatus() {
  return useQuery({
    queryKey: ["connector-status"],
    queryFn: () => getConnectorStatus(),
    staleTime: 60_000,
  });
}

type DataGateProps = {
  /** Whether the integration behind this panel is configured (and, for account level integrations, connected). */
  connected: boolean | undefined;
  /** Whether the query behind this panel returned nothing. Only consulted when connected. */
  empty?: boolean;
  /** Show a loading state while connector status or data is loading. */
  loading?: boolean;
  /** Optional label naming the integration the panel waits on. */
  label?: string;
  className?: string;
  children: ReactNode;
};

export function DataGate({ connected, empty, loading, label, className, children }: DataGateProps) {
  if (loading) {
    return (
      <div className={panelClass(className)}>
        <span className="text-sm text-[#8892A4]">Loading</span>
      </div>
    );
  }
  if (!connected) {
    return (
      <div className={panelClass(className)}>
        <span className="text-sm font-semibold text-[#8892A4]">{WAITING_COPY}</span>
        {label ? <span className="mt-1 text-xs text-[#5A6478]">{label}</span> : null}
      </div>
    );
  }
  if (empty) {
    return (
      <div className={panelClass(className)}>
        <span className="text-sm font-semibold text-[#8892A4]">{EMPTY_COPY}</span>
      </div>
    );
  }
  return <>{children}</>;
}

function panelClass(extra?: string) {
  return [
    "flex flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-[#0C1222] px-6 py-10 text-center",
    extra ?? "",
  ].join(" ");
}
