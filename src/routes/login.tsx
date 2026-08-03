import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DevQuickLogin } from "@/components/DevQuickLogin";
import { DEV_LOGIN_ENABLED } from "@/lib/devAuth";
import AspenLogin from "@/aspen/AspenLogin";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const routeAfterAuth = (u: { role?: string | null; onboarded?: boolean }) => {
    if (u.role === "admin") return navigate({ to: "/admin" });
    navigate({ to: u.onboarded ? "/app" : "/onboarding" });
  };

  useEffect(() => {
    if (user) routeAfterAuth(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // AspenLogin owns the markup and the field state; this route owns auth.
  // Failures render in the design's own notice block instead of a toast —
  // the Aspen card has a slot for exactly that, directly under the button.
  const submit = async (email: string, password: string) => {
    setBusy(true);
    setNotice("");
    const { error, user: u } = await signIn(email, password);
    setBusy(false);
    if (error || !u) {
      setNotice(error ?? "Sign in failed");
      return;
    }
    routeAfterAuth(u);
  };

  return (
    <>
      <AspenLogin onSubmit={submit} busy={busy} notice={notice} />
      {/* Carried over from the previous login screen. The button styles itself
          for a dark surface, so it keeps one here rather than sitting on cream.
          The flag check is repeated so the panel itself disappears too. */}
      {DEV_LOGIN_ENABLED ? (
        <div className="fixed bottom-4 right-4 z-50 w-[280px] rounded-[14px] bg-dark p-3">
          <DevQuickLogin />
        </div>
      ) : null}
    </>
  );
}
