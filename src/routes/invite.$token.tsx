import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<"idle" | "accepting" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (loading || !user || started.current) return;
    started.current = true;
    setState("accepting");
    supabase.functions
      .invoke("accept-invite", { body: { token } })
      .then(async ({ data, error }) => {
        if (error || data?.error) {
          setState("error");
          setMessage(error?.message ?? data?.error ?? "Could not accept the invitation");
          return;
        }
        await refresh();
        setState("done");
        setMessage(`You joined ${data?.organization?.name ?? "the workspace"} as ${data?.role}.`);
        // A brand-new member has no brand profile yet, so the shell would bounce
        // them straight back out. Send them through onboarding first.
        const next = user?.onboarded ? "/app" : "/onboarding";
        setTimeout(() => navigate({ to: next }), 1500);
      });
  }, [loading, user, token, navigate, refresh]);

  return (
    <div className="aspen-scope min-h-screen bg-cream text-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[22px] bg-surface border-[1.5px] border-border p-[30px] text-center">
        <span className="font-heading font-extrabold text-[19px] tracking-[-0.02em]">
          aspen
        </span>
        <div className="mt-6">
          {loading ? (
            <p className="text-[13.5px] text-subtle">Loading</p>
          ) : !user ? (
            <>
              <h1 className="font-heading font-extrabold text-[22px] tracking-[-0.02em] m-0">
                You have been invited
              </h1>
              <p className="mt-2 text-[13.5px] text-muted leading-[1.55]">
                Sign in or create an account with the email address the invitation was sent to, then
                open this link again.
              </p>
              <div className="mt-6 flex gap-3 justify-center">
                <Link
                  to="/login"
                  className="p-[11px_18px] rounded-[12px] bg-accent text-cream text-[14px] font-bold no-underline"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="p-[11px_18px] rounded-[12px] border-[1.5px] border-border text-[14px] font-bold no-underline text-muted"
                >
                  Create account
                </Link>
              </div>
            </>
          ) : state === "accepting" ? (
            <p className="text-[13.5px] text-subtle">Accepting your invitation</p>
          ) : state === "done" ? (
            <>
              <h1 className="font-heading font-extrabold text-[22px] tracking-[-0.02em] m-0 text-accent">
                Welcome aboard
              </h1>
              <p className="mt-2 text-[13.5px] text-muted leading-[1.55]">{message}</p>
            </>
          ) : (
            <>
              <h1 className="font-heading font-extrabold text-[22px] tracking-[-0.02em] m-0">
                Invitation problem
              </h1>
              <p className="mt-2 text-[13.5px] text-muted leading-[1.55]">{message}</p>
              <Link
                to={user?.onboarded ? "/app" : "/onboarding"}
                className="mt-6 inline-block p-[11px_18px] rounded-[12px] bg-accent text-cream text-[14px] font-bold no-underline"
              >
                {user?.onboarded ? "Go to the app" : "Finish setting up"}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

