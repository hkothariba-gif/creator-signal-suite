import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
    DEV_LOGIN_ENABLED,
    DEV_TEST_EMAIL,
    DEV_TEST_PASSWORD,
    hasDevTestCredentials,
} from "@/lib/devAuth";

// One-click sign-in for the shared test account. Renders nothing unless the
// dev flag is on, so it never appears in a normal production build.
export function DevQuickLogin() {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);

  if (!DEV_LOGIN_ENABLED) return null;

  const routeAfterAuth = (u: { role?: string | null; onboarded?: boolean }) => {
        if (u.role === "admin") return navigate({ to: "/admin" });
        navigate({ to: u.onboarded ? "/app" : "/onboarding" });
  };

  const quickLogin = async () => {
        if (!hasDevTestCredentials()) {
                toast.error("Set VITE_DEV_TEST_EMAIL and VITE_DEV_TEST_PASSWORD to use quick login.");
                return;
        }
        setBusy(true);
        const { error, user: u } = await signIn(DEV_TEST_EMAIL, DEV_TEST_PASSWORD);
        setBusy(false);
        if (error || !u) {
                toast.error(error ?? "Dev quick login failed");
                return;
        }
        routeAfterAuth(u);
  };

  const label = busy ? "Signing in..." : "Dev quick login (test account)";

  return (
        <div className="mt-4">
              <button type="button" onClick={quickLogin} disabled={busy} className="w-full h-10 rounded-lg text-xs font-semibold text-[#8892A4] border border-dashed border-white/15 hover:text-white hover:border-white/30 transition-colors disabled:opacity-60">{label}</button>button>
        </div>div>
      );
}
</div>
