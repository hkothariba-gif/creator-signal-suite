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
  /** Headline for the empty state. Falls back to the flat "No data to display". */
  emptyTitle?: string;
  /** One line explaining what lives in this panel once it has data. */
  emptyHint?: string;
  /** The next step out of the empty state — a button or link. */
  emptyAction?: ReactNode;
  /** True when the query behind this panel failed. Takes priority over `empty`
   *  so a backend failure never renders as "no data". */
  error?: boolean;
  /** Headline for the error state. */
  errorTitle?: string;
  /** What went wrong, in the user's words. */
  errorHint?: string;
  /** Retry control for the error state. */
  errorAction?: ReactNode;
  className?: string;
  children: ReactNode;
};


export function DataGate({
  connected,
  empty,
  loading,
  label,
  emptyTitle,
  emptyHint,
  emptyAction,
  className,
  children,
}: DataGateProps) {
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
    // An empty panel with nothing to click is a dead end, so every screen that
    // can name its next step passes one in. The bare copy stays the default for
    // panels where there is nothing useful to offer.
    return (
      <div className={panelClass(className)}>
        <span className="datagate-empty-title text-[15px] font-bold text-[#8892A4]">
          {emptyTitle ?? EMPTY_COPY}
        </span>
        {emptyHint ? (
          <span className="datagate-empty-hint mt-2 max-w-[380px] text-[13px] leading-[1.5] text-[#5A6478]">
            {emptyHint}
          </span>
        ) : null}
        {emptyAction ? <div className="mt-4">{emptyAction}</div> : null}
      </div>
    );
  }
  return <>{children}</>;
}


// The `datagate-panel` hook lets the Aspen pages repaint this placeholder for a
// cream surface without every call site passing a variant — see the
// `.aspen-scope .datagate-panel` block in src/styles.css. The dark utilities
// below stay the default for /admin and the not-yet-redesigned screens.
function panelClass(extra?: string) {
  return [
    "datagate-panel flex flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-[#0C1222] px-6 py-10 text-center",
    extra ?? "",
  ].join(" ");
}
