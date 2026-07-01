import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

type TabId = "profile" | "keys" | "integrations" | "billing";

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "keys", label: "API Keys" },
  { id: "integrations", label: "Integrations" },
  { id: "billing", label: "Billing" },
];

function SettingsPage() {
  const [tab, setTab] = useState<TabId>("profile");

  return (
    <AppShell title="Settings">
      <div className="max-w-4xl">
        <div className="flex gap-6 border-b border-white/[0.07] mb-8">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="pb-3 text-sm font-medium transition-colors"
                style={{
                  color: active ? "#00D97E" : "#8892A4",
                  borderBottom: active ? "2px solid #00D97E" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "profile" && <ProfileTab />}
        {tab === "keys" && <KeysTab />}
        {tab === "integrations" && <IntegrationsTab />}
        {tab === "billing" && <BillingTab />}
      </div>
    </AppShell>
  );
}

/* ---------- Profile ---------- */

type UserData = {
  companyName: string;
  website: string;
  industry: string;
  contactEmail: string;
};

const DEFAULT_USER: UserData = {
  companyName: "",
  website: "",
  industry: "SaaS",
  contactEmail: "",
};

function ProfileTab() {
  const [data, setData] = useState<UserData>(DEFAULT_USER);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ar_user");
      if (raw) setData({ ...DEFAULT_USER, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem("ar_user", JSON.stringify(data));
    toast.success("Saved!", { duration: 2000 });
  };

  const update = (k: keyof UserData, v: string) =>
    setData((d) => ({ ...d, [k]: v }));

  return (
    <Card className="p-6 space-y-5">
      <Field label="Company Name">
        <TextInput
          value={data.companyName}
          onChange={(v) => update("companyName", v)}
          placeholder="Acme Inc."
        />
      </Field>
      <Field label="Website URL">
        <TextInput
          value={data.website}
          onChange={(v) => update("website", v)}
          placeholder="https://acme.com"
        />
      </Field>
      <Field label="Industry">
        <select
          value={data.industry}
          onChange={(e) => update("industry", e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none"
          style={{
            background: "#131D2E",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <option>SaaS</option>
          <option>eCommerce</option>
          <option>Agency</option>
          <option>Other</option>
        </select>
      </Field>
      <Field label="Contact Email">
        <TextInput
          value={data.contactEmail}
          onChange={(v) => update("contactEmail", v)}
          placeholder="you@company.com"
          type="email"
        />
      </Field>
      <div>
        <PrimaryButton onClick={save}>Save Changes</PrimaryButton>
      </div>
    </Card>
  );
}

/* ---------- API Keys ---------- */

const PLATFORMS = [
  {
    name: "YouTube Data API v3",
    storageKey: "ar_yt_api_key",
    placeholder: "AIza...",
    color: "#FF0000",
    initials: "YT",
  },
  {
    name: "Reddit API",
    storageKey: "ar_reddit_api_key",
    placeholder: "your-client-id",
    color: "#FF4500",
    initials: "RD",
  },
  {
    name: "X / Twitter API",
    storageKey: "ar_x_api_key",
    placeholder: "Bearer Token...",
    color: "#1A1A1A",
    initials: "X",
    border: true,
  },
  {
    name: "LinkedIn API",
    storageKey: "ar_li_api_key",
    placeholder: "Access Token...",
    color: "#0A66C2",
    initials: "LI",
  },
];

function KeysTab() {
  return (
    <div className="space-y-4">
      {PLATFORMS.map((p) => (
        <KeyRow key={p.storageKey} {...p} />
      ))}
    </div>
  );
}

function KeyRow({
  name,
  storageKey,
  placeholder,
  color,
  initials,
  border,
}: {
  name: string;
  storageKey: string;
  placeholder: string;
  color: string;
  initials: string;
  border?: boolean;
}) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem(storageKey) || "";
    setValue(v);
    setSaved(v);
  }, [storageKey]);

  const save = () => {
    localStorage.setItem(storageKey, value);
    setSaved(value);
    toast.success("Saved!", { duration: 2000 });
  };

  const connected = saved.trim().length > 0;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{
            background: color,
            border: border ? "1px solid rgba(255,255,255,0.2)" : "none",
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2 gap-3">
            <div className="font-medium text-[#F0F4FF]">{name}</div>
            <StatusBadge connected={connected} />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm text-white outline-none"
                style={{
                  background: "#131D2E",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8892A4] hover:text-white p-1"
                aria-label={show ? "Hide" : "Show"}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PrimaryButton onClick={save}>Save Key</PrimaryButton>
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md"
        style={{ background: "rgba(0,217,126,0.12)", color: "#00D97E" }}
      >
        <Check size={12} /> Connected
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-md"
      style={{ background: "rgba(136,146,164,0.12)", color: "#8892A4" }}
    >
      Not connected
    </span>
  );
}

/* ---------- Integrations ---------- */

const INTEGRATIONS = [
  { name: "Shopify", desc: "Connect your store to track conversions", cta: "Connect Shopify", color: "#95BF47", initials: "SH" },
  { name: "WooCommerce", desc: "Connect your store to track conversions", cta: "Connect WooCommerce", color: "#7F54B3", initials: "WC" },
  { name: "Stripe", desc: "Add Stripe to manage affiliate payouts", cta: "Connect Stripe", color: "#635BFF", initials: "ST" },
  { name: "PayPal", desc: "Pay creators via PayPal mass payouts", cta: "Connect PayPal", color: "#003087", initials: "PP" },
  { name: "HubSpot", desc: "Sync creator contacts to your CRM", cta: "Connect HubSpot", color: "#FF7A59", initials: "HS" },
  { name: "Slack", desc: "Get campaign alerts in Slack", cta: "Connect Slack", color: "#4A154B", initials: "SL" },
];

function IntegrationsTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {INTEGRATIONS.map((i) => (
        <Card key={i.name} className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: i.color }}
            >
              {i.initials}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-[#F0F4FF]">{i.name}</div>
              <div className="text-sm text-[#8892A4]">{i.desc}</div>
            </div>
          </div>
          <PrimaryButton
            onClick={() =>
              alert(
                `${i.name} integration coming soon — contact support@aspenreach.com`
              )
            }
          >
            {i.cta}
          </PrimaryButton>
        </Card>
      ))}
    </div>
  );
}

/* ---------- Billing ---------- */

function BillingTab() {
  const usage = [
    { label: "Campaigns", used: 3, max: 10 },
    { label: "Creators in hotlist", used: 47, max: 100 },
    { label: "Outreach emails sent", used: 2400, max: 5000 },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm text-[#8892A4]">Current plan</div>
            <div className="text-xl font-semibold text-[#F0F4FF]">
              Growth Plan — $299/mo
            </div>
          </div>
          <span
            className="text-xs font-medium px-2 py-1 rounded-md"
            style={{ background: "rgba(0,217,126,0.12)", color: "#00D97E" }}
          >
            Active
          </span>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-[#F0F4FF] mb-4">Usage this month</h3>
        <div className="space-y-4">
          {usage.map((u) => {
            const pct = Math.min(100, (u.used / u.max) * 100);
            return (
              <div key={u.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[#F0F4FF]">{u.label}</span>
                  <span className="text-[#8892A4]">
                    {u.used.toLocaleString()} / {u.max.toLocaleString()}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: "#00D97E" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex gap-3">
        <PrimaryButton onClick={() => alert("Upgrade flow coming soon")}>
          Upgrade to Scale — $599/mo
        </PrimaryButton>
        <button
          onClick={() => alert("Invoice download coming soon")}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-[#F0F4FF]"
          style={{
            background: "#131D2E",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          Download Invoice
        </button>
      </div>
    </div>
  );
}

/* ---------- Shared UI ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm text-[#8892A4] mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none"
      style={{
        background: "#131D2E",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    />
  );
}

function PrimaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2.5 rounded-lg text-sm font-semibold text-black hover:opacity-90 transition-opacity"
      style={{ background: "#00D97E" }}
    >
      {children}
    </button>
  );
}
