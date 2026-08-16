import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { checkSupabaseHealth } from "@/lib/health.functions";
import { Link } from "@tanstack/react-router";
import { Activity, ArrowLeft, CheckCircle2, XCircle, Clock, Server } from "lucide-react";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [
      { title: "Health Check | AspenReach" },
      { name: "description", content: "Supabase connection health check." },
    ],
  }),
  component: HealthPage,
});

function HealthPage() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["supabase-health"],
    queryFn: checkSupabaseHealth,
    refetchInterval: 30000,
  });

  const status = isLoading
    ? "checking"
    : isError || !data?.ok
      ? "error"
      : "ok";

  const checkedAt = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleString()
    : "N/A";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-bg-base">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-white/5">
              <Activity className="w-5 h-5 text-brand-green" />
            </div>
            <h1 className="text-xl font-bold text-brand-ink">System Health</h1>
          </div>

          <div className="space-y-4">
            {/* Supabase row */}
            <div
              className="flex items-center justify-between rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-brand-muted" />
                <div>
                  <p className="text-sm font-medium text-brand-ink">Supabase</p>
                  <p className="text-xs text-brand-muted">Database connection</p>
                </div>
              </div>
              <StatusBadge status={status} />
            </div>

            {/* Latency row */}
            <div
              className="flex items-center justify-between rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-brand-muted" />
                <div>
                  <p className="text-sm font-medium text-brand-ink">Latency</p>
                  <p className="text-xs text-brand-muted">Round-trip time</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-brand-ink">
                {data?.latency != null ? `${data.latency} ms` : isLoading ? "..." : "N/A"}
              </span>
            </div>

            {/* Last checked row */}
            <div
              className="flex items-center justify-between rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-brand-muted" />
                <div>
                  <p className="text-sm font-medium text-brand-ink">Last checked</p>
                  <p className="text-xs text-brand-muted">Auto-refresh every 30s</p>
                </div>
              </div>
              <span className="text-sm text-brand-muted">{checkedAt}</span>
            </div>
          </div>

          {isError && (
            <div className="mt-4 rounded-lg p-3 text-sm bg-red-500/10 text-red-400 border border-red-500/20">
              {error instanceof Error ? error.message : "Health check failed"}
            </div>
          )}

          {data && !data.ok && data.message && (
            <div className="mt-4 rounded-lg p-3 text-sm bg-red-500/10 text-red-400 border border-red-500/20">
              {data.message}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-bg-base hover:bg-brand-green-dark transition-colors disabled:opacity-60"
            >
              {isLoading ? "Checking…" : "Check now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "ok" | "error" | "checking" }) {
  if (status === "ok") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/10 px-2.5 py-1 text-xs font-semibold text-brand-green border border-brand-green/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Connected
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 border border-red-500/20">
        <XCircle className="w-3.5 h-3.5" />
        Disconnected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-semibold text-yellow-400 border border-yellow-500/20">
      <Activity className="w-3.5 h-3.5 animate-spin" />
      Checking…
    </span>
  );
}
