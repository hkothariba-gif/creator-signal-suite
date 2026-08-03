import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataGate } from "@/components/app/DataGate";
import { useAuth } from "@/hooks/useAuth";
import {
  getAccountConnections,
  getAffiliatePerformance,
  listAffiliateLinks,
  createAffiliateLink,
  connectSalesProvider,
  type AffiliatePerformance,
  type AffiliateLink,
} from "@/lib/affiliate.functions";

/* AFFILIATE & PAYOUTS — the `v.isAffiliate` block of src/aspen/AspenApp.tsx, on
   the live hooks the dark version used. Shell, header and title come from the
   /app layout route.

   The design's "PAYOUTS DUE" tile has nothing behind it — there is no payout
   ledger in the schema, only clicks, conversions and attributed revenue — so it
   shows a dash rather than a number we cannot compute. */

export const Route = createFileRoute("/app/affiliate")({
  component: AffiliatePage,
});

const PROVIDERS = ["stripe", "shopify", "paddle", "lemonsqueezy", "manual"] as const;

function money(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}

function AffiliatePage() {
  const { user } = useAuth();
  const orgId = user?.organization?.id;

  const [salesConnected, setSalesConnected] = useState<boolean | undefined>(undefined);
  const [perf, setPerf] = useState<AffiliatePerformance | null>(null);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [conn, performance, linkList] = await Promise.all([
        getAccountConnections({ data: { organizationId: orgId } }),
        getAffiliatePerformance({ data: { organizationId: orgId } }),
        listAffiliateLinks({ data: { organizationId: orgId } }),
      ]);
      setSalesConnected(conn.sales);
      setPerf(performance);
      setLinks(linkList);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load affiliate data");
      setSalesConnected(false);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Connect a sales provider ───────────────────────────────────────────────
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>("stripe");
  const [connecting, setConnecting] = useState(false);
  const connect = async () => {
    if (!orgId) return;
    setConnecting(true);
    try {
      await connectSalesProvider({ data: { organizationId: orgId, provider } });
      toast.success(`Connected ${provider}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not connect");
    } finally {
      setConnecting(false);
    }
  };

  // ── Create a tracking link ─────────────────────────────────────────────────
  const [dest, setDest] = useState("");
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const create = async () => {
    if (!orgId || !dest.trim()) return;
    setCreating(true);
    try {
      await createAffiliateLink({
        data: { organizationId: orgId, destinationUrl: dest.trim(), label: label.trim() || undefined },
      });
      setDest("");
      setLabel("");
      toast.success("Tracking link created");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create link");
    } finally {
      setCreating(false);
    }
  };

  const perfByLink = useMemo(() => {
    const m = new Map<string, { clicks: number; conversions: number; revenueMinor: number; conversionRate: number }>();
    for (const l of perf?.byLink ?? []) if (l.linkId) m.set(l.linkId, l);
    return m;
  }, [perf]);

  const currency = perf?.currency ?? "USD";
  const dash = "—";

  if (!user) {
    return <div className="aspen-scope text-[14px] text-subtle p-[48px_0] text-center">Sign in to view affiliate tracking.</div>;
  }
  if (!orgId) {
    return <div className="aspen-scope text-[14px] text-subtle p-[48px_0] text-center">Finish onboarding to create a brand organization.</div>;
  }

  return (
    <div className="aspen-scope">
      <div className="flex items-center justify-between gap-[14px] bg-surface border-[1.5px] border-border rounded-[20px] p-[18px_22px] mb-[16px] flex-wrap">
        <div>
          <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle">SALES CONNECTION</div>
          <div className="text-[14.5px] font-semibold mt-[5px]">
            {salesConnected
              ? "Connected — conversions post in through the ingest endpoint."
              : "Not connected. Pick a provider to start attributing revenue."}
          </div>
        </div>
        {salesConnected ? (
          <span className="text-[12px] font-bold text-success-ink bg-success-wash p-[7px_13px] rounded-[9px]">✓ Live</span>
        ) : (
          <div className="flex gap-[8px] items-center">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as (typeof PROVIDERS)[number])}
              className="h-[42px] p-[0_12px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14px] capitalize"
            >
              {PROVIDERS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <button
              onClick={connect}
              disabled={connecting}
              className="border-0 bg-accent text-cream text-[13.5px] font-bold p-[0_16px] h-[42px] rounded-[11px] cursor-pointer ah21 disabled:opacity-40"
            >
              {connecting ? "Connecting…" : "Connect"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[16px] mb-[16px]">
        <div className="bg-dark text-cream rounded-[20px] p-[22px]">
          <div className="text-[12px] font-bold tracking-[0.1em] text-subtle">ATTRIBUTED REVENUE</div>
          <div className="font-heading font-extrabold text-[36px] tracking-[-0.03em] mt-[8px]">
            {perf ? money(perf.totals.revenueMinor, currency) : dash}
          </div>
        </div>
        <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
          <div className="text-[12px] font-bold tracking-[0.1em] text-subtle">CONVERSIONS</div>
          <div className="font-heading font-extrabold text-[36px] tracking-[-0.03em] mt-[8px]">
            {perf ? perf.totals.conversions.toLocaleString() : dash}
          </div>
        </div>
        <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
          <div className="text-[12px] font-bold tracking-[0.1em] text-subtle">CLICKS</div>
          <div className="font-heading font-extrabold text-[36px] tracking-[-0.03em] mt-[8px]">
            {perf ? perf.totals.clicks.toLocaleString() : dash}
          </div>
        </div>
        <div className="bg-tint rounded-[20px] p-[22px]">
          <div className="text-[12px] font-bold tracking-[0.1em] text-accent-ink">PAYOUTS DUE</div>
          <div className="font-heading font-extrabold text-[36px] tracking-[-0.03em] mt-[8px] text-accent-ink">{dash}</div>
          <div className="text-[12px] text-accent-ink-soft mt-[4px]">No payout ledger yet</div>
        </div>
      </div>

      <div className="flex gap-[10px] items-end bg-surface border-[1.5px] border-border rounded-[20px] p-[20px_22px] mb-[16px] flex-wrap">
        <div className="flex-[1_1_260px] min-w-[220px]">
          <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle mb-[7px]">DESTINATION URL</div>
          <input
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            placeholder="https://example.com/pricing"
            className="w-full box-border h-[44px] p-[0_13px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14px] outline-none"
          />
        </div>
        <div className="flex-[0_1_180px] min-w-[150px]">
          <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle mb-[7px]">LABEL</div>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Optional"
            className="w-full box-border h-[44px] p-[0_13px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14px] outline-none"
          />
        </div>
        <button
          onClick={create}
          disabled={!dest.trim() || creating}
          className="border-0 bg-accent text-cream text-[14px] font-bold h-[44px] p-[0_20px] rounded-[11px] cursor-pointer ah42 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {creating ? "Creating…" : "Create link"}
        </button>
      </div>

      <DataGate connected={true} loading={loading} empty={links.length === 0}>
        <div className="bg-surface border-[1.5px] border-border rounded-[20px] overflow-hidden">
          <div className="flex gap-[12px] p-[14px_22px] border-b-[1.5px] border-border-soft text-[10.5px] font-bold tracking-[0.12em] text-subtle">
            <span className="flex-[2]">CREATOR / LINK</span>
            <span className="flex-1 text-right">CLICKS</span>
            <span className="flex-1 text-right">CONV.</span>
            <span className="flex-1 text-right">REVENUE</span>
            <span className="flex-1 text-right">RATE</span>
          </div>
          {links.map((l) => {
            const stat = perfByLink.get(l.id);
            return (
              <div key={l.id} className="flex gap-[12px] items-center p-[15px_22px] border-b-[1px] border-sand">
                <div className="flex-[2] min-w-0">
                  <div className="text-[14.5px] font-bold">{l.label || "Untitled link"}</div>
                  <div className="text-[12.5px] text-subtle mt-[2px] truncate">{l.trackingUrl}</div>
                </div>
                <span className="flex-1 text-right text-[14px] font-semibold text-muted">{stat ? stat.clicks.toLocaleString() : dash}</span>
                <span className="flex-1 text-right text-[14px] font-semibold text-muted">{stat ? stat.conversions.toLocaleString() : dash}</span>
                <span className="flex-1 text-right text-[14px] font-bold">{stat ? money(stat.revenueMinor, currency) : dash}</span>
                <span className="flex-1 text-right text-[14px] font-bold text-accent">{stat ? `${(stat.conversionRate * 100).toFixed(1)}%` : dash}</span>
              </div>
            );
          })}
        </div>
      </DataGate>
    </div>
  );
}
