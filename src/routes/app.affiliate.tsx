import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/AppShell";
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
import { Link2, Plus, Copy, Check, Loader2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/app/affiliate")({
  component: AffiliatePage,
});

const PROVIDERS = ["generic", "impact", "partnerstack", "rakuten", "cj", "amazon"] as const;

function money(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}

function AffiliatePage() {
  const { user, canEdit } = useAuth();
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

  // ── Connect a sales provider ────────────────────────────────────────────────
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>("generic");
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

  // ── Create a tracking link ──────────────────────────────────────────────────
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

  if (!user) {
    return (
      <AppShell title="Affiliate & Payouts">
        <Card className="p-8 text-center text-[#8892A4]">Sign in to view affiliate tracking.</Card>
      </AppShell>
    );
  }
  if (!orgId) {
    return (
      <AppShell title="Affiliate & Payouts">
        <Card className="p-8 text-center text-[#8892A4]">Finish onboarding to create a brand organization.</Card>
      </AppShell>
    );
  }

  const metrics: { label: string; value: string }[] = perf
    ? [
        { label: "Total Revenue", value: money(perf.totals.revenueMinor, currency) },
        { label: "Total Conversions", value: perf.totals.conversions.toLocaleString() },
        { label: "Total Clicks", value: perf.totals.clicks.toLocaleString() },
      ]
    : [
        { label: "Total Revenue", value: "" },
        { label: "Total Conversions", value: "" },
        { label: "Total Clicks", value: "" },
      ];

  const noData = !perf?.hasData;

  return (
    <AppShell
      title="Affiliate & Payouts"
      right={
        <button
          onClick={() => void load()}
          className="text-[#8892A4] hover:text-white inline-flex items-center gap-1.5 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      }
    >
      {/* Connect a sales provider */}
      {canEdit && (
        <Card className="p-5 mb-6">
          <div className="text-[11px] uppercase tracking-wider text-[#8892A4] font-semibold mb-3">
            Sales connection
          </div>
          {salesConnected ? (
            <p className="text-sm text-[#00D97E] flex items-center gap-2">
              <Check className="w-4 h-4" /> A sales provider is connected. Conversions post in through the ingest endpoint.
            </p>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs text-[#8892A4] flex flex-col gap-1">
                Provider
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as (typeof PROVIDERS)[number])}
                  className="h-10 px-2 rounded-lg bg-[#05080F] border border-white/10 text-sm text-white"
                >
                  {PROVIDERS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={connect}
                disabled={connecting}
                className="px-4 h-10 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Connect
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {metrics.map((m) => (
          <Card key={m.label} className="p-5">
            <p className="text-xs text-[#8892A4] mb-2">{m.label}</p>
            <DataGate
              connected={salesConnected}
              empty={noData}
              loading={loading}
              label="Loads from your sales connection"
            >
              <p className="text-3xl font-extrabold tracking-tight text-[#F0F4FF]">{m.value}</p>
            </DataGate>
          </Card>
        ))}
      </div>

      {/* Create tracking link */}
      {canEdit && salesConnected && (
        <Card className="p-5 mb-6">
          <div className="text-[11px] uppercase tracking-wider text-[#8892A4] font-semibold mb-3">
            Create tracking link
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-[#8892A4] flex flex-col gap-1 flex-1 min-w-[220px]">
              Destination URL
              <input
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                placeholder="https://merchant.com/product"
                className="h-10 px-3 rounded-lg bg-[#05080F] border border-white/10 text-sm focus:outline-none focus:border-[#00D97E]"
              />
            </label>
            <label className="text-xs text-[#8892A4] flex flex-col gap-1 min-w-[160px]">
              Label
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Optional"
                className="h-10 px-3 rounded-lg bg-[#05080F] border border-white/10 text-sm focus:outline-none focus:border-[#00D97E]"
              />
            </label>
            <button
              onClick={create}
              disabled={creating || !dest.trim()}
              className="px-4 h-10 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold disabled:opacity-40 inline-flex items-center gap-1.5"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Create
            </button>
          </div>
        </Card>
      )}

      {/* Links table */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#F0F4FF]">Affiliate Links</h2>
      </div>

      <DataGate
        connected={salesConnected}
        empty={links.length === 0}
        loading={loading}
        label="Link tracking loads from your sales connection"
      >
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[#5A6478] border-b border-white/[0.07]">
                  <th className="px-4 py-3 font-semibold">Link</th>
                  <th className="px-4 py-3 font-semibold text-right">Clicks</th>
                  <th className="px-4 py-3 font-semibold text-right">Conversions</th>
                  <th className="px-4 py-3 font-semibold text-right">Revenue</th>
                  <th className="px-4 py-3 font-semibold text-right">Conv. rate</th>
                </tr>
              </thead>
              <tbody>
                {links.map((l) => {
                  const pf = perfByLink.get(l.id);
                  return (
                    <tr key={l.id} className="border-b border-white/[0.04] last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{l.label || l.slug}</div>
                        <TrackingLink url={l.trackingUrl} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#B8C0CE]">
                        {(pf?.clicks ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#B8C0CE]">
                        {(pf?.conversions ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#F0F4FF] font-semibold">
                        {money(pf?.revenueMinor ?? 0, currency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#B8C0CE]">
                        {(((pf?.conversionRate ?? 0) * 100).toFixed(1))}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </DataGate>
    </AppShell>
  );
}

function TrackingLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <button
      onClick={copy}
      className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-[#8892A4] hover:text-[#00D97E] max-w-full"
      title={url}
    >
      <span className="truncate max-w-[260px]">{url}</span>
      {copied ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
    </button>
  );
}
