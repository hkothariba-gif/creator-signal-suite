import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AspenEarlyAccess from "@/aspen/AspenEarlyAccess";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Shown when Supabase requires email confirmation: no session comes back, so
  // there is nothing to navigate to. The design's "You're on the list" panel
  // is the right screen for that wait, and it links on to /onboarding.
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: user.onboarded ? "/app" : "/onboarding" });
  }, [user, navigate]);

  // AspenEarlyAccess owns the markup and field state; this route owns signup.
  const submit = async ({
    company,
    email,
    password,
    brief,
    segment,
  }: {
    company: string;
    email: string;
    password: string;
    brief: string;
    segment: string | null;
  }) => {
    setBusy(true);
    setError("");
    try {
      localStorage.setItem("aspen_tester_email", email);
      // The design asks two questions the old form didn't. Onboarding reads
      // aspen_hero_prompt to prefill the brief, so the answers carry forward
      // instead of being dropped on the floor at signup.
      const prefill = [segment, brief.trim()].filter(Boolean).join(" — ");
      if (prefill) localStorage.setItem("aspen_hero_prompt", prefill);
    } catch {}

    const { error: signUpError, user: u } = await signUp(email, password, company);
    setBusy(false);
    if (signUpError) {
      setError(signUpError);
      return;
    }
    if (!u) {
      setDone(true);
      return;
    }
    // Email confirmations disabled: the session is live, go straight through.
    navigate({ to: "/onboarding" });
  };

  return <AspenEarlyAccess onSubmit={submit} busy={busy} error={error} done={done} />;
}
