import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSlack, setNotifSlack] = useState(false);

  return (
    <AppShell title="Settings">
      <div className="max-w-2xl space-y-6">
        <Card className="p-6">
          <h3 className="font-semibold text-[#F0F4FF] mb-1">Account</h3>
          <p className="text-sm text-[#8892A4] mb-4">Manage your profile and login details</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#4B5563]">Email</label>
              <div className="mt-1 text-sm text-[#F0F4FF]">{user?.email ?? "—"}</div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#4B5563]">Role</label>
              <div className="mt-1 text-sm text-[#F0F4FF] capitalize">{user?.role ?? "user"}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-[#F0F4FF] mb-1">Notifications</h3>
          <p className="text-sm text-[#8892A4] mb-4">Choose how you want to be alerted</p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifEmail}
                onChange={(e) => setNotifEmail(e.target.checked)}
                className="w-4 h-4 accent-[#00D97E]"
              />
              <span className="text-sm text-[#F0F4FF]">Email notifications for campaign updates</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifSlack}
                onChange={(e) => setNotifSlack(e.target.checked)}
                className="w-4 h-4 accent-[#00D97E]"
              />
              <span className="text-sm text-[#F0F4FF]">Slack alerts for new creator matches</span>
            </label>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-[#F0F4FF] mb-1">Danger Zone</h3>
          <p className="text-sm text-[#8892A4] mb-4">Irreversible account actions</p>
          <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors">
            Delete Account
          </button>
        </Card>
      </div>
    </AppShell>
  );
}
