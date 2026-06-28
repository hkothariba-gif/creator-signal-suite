import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, StatCard } from "@/components/app/AppShell";

export const Route = createFileRoute("/app/affiliate")({
  component: AffiliatePage,
});

const ROWS = [
  { name: "TechWithMarcus", plat: "YT", pc: "#FF0000", commission: "10%", convs: 143, earned: "$2,860", status: "paid", action: "View Receipt" },
  { name: "r/homelab mod", plat: "Reddit", pc: "#FF4500", commission: "8%", convs: 89, earned: "$1,424", status: "paid", action: "View Receipt" },
  { name: "@buildinpublic_sara", plat: "X", pc: "#1A1A1A", commission: "12%", convs: 67, earned: "$1,608", status: "pending", action: "Pay Now" },
  { name: "CodeWithChris", plat: "YT", pc: "#FF0000", commission: "15%", convs: 210, earned: "$6,300", status: "paid", action: "View Receipt" },
  { name: "NightOwlTech", plat: "YT", pc: "#FF0000", commission: "10%", convs: 52, earned: "$1,040", status: "pending", action: "Pay Now" },
  { name: "r/entrepreneur", plat: "Reddit", pc: "#FF4500", commission: "8%", convs: 178, earned: "$2,848", status: "processing", action: "View" },
];

function AffiliatePage() {
  const [modal, setModal] = useState<null | string>(null);

  return (
    <AppShell title="Affiliate & Payouts">
      <p className="text-[#8892A4] mb-4">Track conversions, manage commissions, process payments</p>

      <div className="flex items-center justify-between p-4 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/[0.06] mb-6">
        <span className="text-sm text-[#FCD34D]">⚠ Connect Stripe or your store to enable real-time conversion tracking.</span>
        <button onClick={() => setModal("integration")} className="px-4 h-9 rounded-lg border border-[#F59E0B]/50 text-[#F59E0B] text-xs font-bold hover:bg-[#F59E0B]/10">
          Set Up Integration →
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Paid Out" value="$24,300" />
        <StatCard label="Pending Payments" value="$8,750" trendColor="amber" />
        <StatCard label="Active Affiliates" value="18" />
        <StatCard label="Avg Commission Rate" value="12%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-white/[0.07]">
            <h3 className="font-bold">Creator Payout Tracker</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-[#8892A4]">
                <th className="px-5 py-3">Creator</th>
                <th className="px-2 py-3">Plat</th>
                <th className="px-2 py-3">Comm</th>
                <th className="px-2 py-3">Conv</th>
                <th className="px-2 py-3">Earned</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.name} className={i % 2 ? "bg-[#131D2E]" : "bg-[#0C1222]"}>
                  <td className="px-5 py-3 font-semibold">{r.name}</td>
                  <td className="px-2 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: r.pc }}>{r.plat}</span></td>
                  <td className="px-2 py-3 text-[#8892A4]">{r.commission}</td>
                  <td className="px-2 py-3 text-[#8892A4]">{r.convs}</td>
                  <td className="px-2 py-3 font-semibold">{r.earned}</td>
                  <td className="px-2 py-3">
                    {r.status === "paid" && <span className="text-xs text-[#00D97E]">✅ Paid</span>}
                    {r.status === "pending" && <span className="text-xs text-[#F59E0B]">🟡 Pending</span>}
                    {r.status === "processing" && <span className="text-xs text-[#60A5FA]">🔵 Processing</span>}
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => setModal(r.action)} className="text-xs text-[#00D97E] hover:underline">{r.action}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold">Tracked Links</h3>
          <ul className="mt-4 space-y-4">
            {[
              { url: "aspenreach.com/ref/marcus", clicks: "2,340", cvr: "6.1%" },
              { url: "aspenreach.com/ref/homelab", clicks: "1,876", cvr: "4.7%" },
              { url: "aspenreach.com/ref/sara", clicks: "1,102", cvr: "6.1%" },
            ].map((l) => (
              <li key={l.url} className="border-b border-white/[0.05] pb-3 last:border-0">
                <div className="text-sm font-mono text-[#00D97E] truncate">{l.url}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-[#8892A4]">
                  <span>{l.clicks} clicks • {l.cvr} CVR</span>
                  <svg width="60" height="20" viewBox="0 0 60 20">
                    <polyline points="0,15 10,12 20,14 30,8 40,10 50,5 60,3" stroke="#00D97E" strokeWidth="1.5" fill="none" />
                  </svg>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={() => setModal("link")} className="mt-4 w-full h-10 rounded-lg border border-[#00D97E]/50 text-[#00D97E] text-sm font-semibold hover:bg-[#00D97E]/10">
            Generate New Link
          </button>
        </Card>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-[420px] p-7 rounded-2xl bg-[#0C1222] border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">
              {modal === "Pay Now" && "Set up payouts"}
              {modal === "View Receipt" && "Receipts coming soon"}
              {modal === "View" && "Receipts coming soon"}
              {modal === "integration" && "Stripe integration coming soon"}
              {modal === "link" && "Link generation coming soon"}
            </h3>
            <p className="mt-3 text-sm text-[#8892A4]">
              {modal === "Pay Now" && "Connect a payout method to process payments. Set up Stripe Connect or bank transfer in Settings."}
              {(modal === "View Receipt" || modal === "View") && "Receipt download coming soon."}
              {modal === "integration" && "We're finalizing Stripe Connect. You'll be able to attribute creator-driven conversions directly here."}
              {modal === "link" && "Custom affiliate link generation coming soon."}
            </p>
            <button onClick={() => setModal(null)} className="mt-5 w-full h-11 rounded-lg bg-[#00D97E] text-[#05080F] font-bold">Got it</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
