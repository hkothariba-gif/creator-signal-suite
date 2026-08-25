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
  /** Aspen is the safe default. Dark surfaces must opt in explicitly. */
  variant?: "aspen" | "dark";
  className?: string;
  children: ReactNode;
};


/* The retry control every failed panel offers. Hand-rolled at each call site
   until this existed; it is one component so fifteen screens cannot drift into
   fifteen slightly different buttons. Styled for `.aspen-scope` (all /app
   routes) — the dark screens do not pass an errorAction today. */
export function RetryButton({ onClick, label = "Try again" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="border-0 bg-accent text-cream text-[13.5px] font-bold p-[10px_16px] rounded-[11px] cursor-pointer"
    >
      {label}
    </button>
  );
}

/* A skeleton shaped like the rows it stands in for. A bare spinner on a blank
   panel tells the user nothing about what is coming; these keep the layout
   stable so content does not jump when it lands. */
export function RowsSkeleton({ rows = 3, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-[10px] ${className}`} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-[52px] rounded-[13px] bg-sand animate-pulse" />
      ))}
    </div>
  );
}

export function DataGate({
  connected,
  empty,
  loading,
  label,
  emptyTitle,
  emptyHint,
  emptyAction,
  error,
  errorTitle,
  errorHint,
  errorAction,
  variant = "aspen",
  className,
  children,
}: DataGateProps) {
  const mutedText = variant === "dark" ? "text-brand-muted" : "text-subtle";
  const titleText = variant === "dark" ? "text-brand-muted" : "text-dark";
  const hintText = variant === "dark" ? "text-brand-dim" : "text-subtle";

  if (loading) {
    return (
      <div className={panelClass(variant, className)}>
        <span className={`text-sm ${mutedText}`}>Loading</span>
      </div>
    );
  }
  // A failed request is not an empty result. It gets its own state so the user
  // can tell "nothing here yet" apart from "we could not reach the data".
  if (error) {
    return (
      <div className={panelClass(variant, className)}>
        <span className={`text-[15px] font-bold ${titleText}`}>
          {errorTitle ?? "Could not load this panel"}
        </span>
        {errorHint ? (
          <span className={`mt-2 max-w-[380px] text-[13px] leading-[1.5] ${hintText}`}>
            {errorHint}
          </span>
        ) : null}
        {errorAction ? <div className="mt-4">{errorAction}</div> : null}
      </div>
    );
  }
  if (!connected) {
    return (
      <div className={panelClass(variant, className)}>
        <span className={`text-sm font-semibold ${mutedText}`}>{WAITING_COPY}</span>
        {label ? <span className={`mt-1 text-xs ${hintText}`}>{label}</span> : null}
      </div>
    );
  }

  if (empty) {
    // An empty panel with nothing to click is a dead end, so every screen that
    // can name its next step passes one in. The bare copy stays the default for
    // panels where there is nothing useful to offer.
    return (
      <div className={panelClass(variant, className)}>
        <span className={`text-[15px] font-bold ${titleText}`}>
          {emptyTitle ?? EMPTY_COPY}
        </span>
        {emptyHint ? (
          <span className={`mt-2 max-w-[380px] text-[13px] leading-[1.5] ${hintText}`}>
            {emptyHint}
          </span>
        ) : null}
        {emptyAction ? <div className="mt-4">{emptyAction}</div> : null}
      </div>
    );
  }
  return <>{children}</>;
}

function panelClass(variant: "aspen" | "dark", extra?: string) {
  const treatment =
    variant === "dark"
      ? "rounded-xl border border-white/[0.07] bg-bg-surface"
      : "rounded-[20px] border-[1.5px] border-sand-line bg-surface";

  return [
    `datagate-panel flex flex-col items-center justify-center px-6 py-10 text-center ${treatment}`,
    extra ?? "",
  ].join(" ");
}
