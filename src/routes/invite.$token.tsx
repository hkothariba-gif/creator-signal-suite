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
        setTimeout(() => navigate({ to: "/app" }), 1500);
      });
  }, [loading, user, token, navigate, refresh]);

  return (
    <div className="min-h-screen bg-[#05080F] text-[#F0F4FF] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-[#0C1222] border border-white/10 p-8 text-center">
        <span className="text-lg font-extrabold tracking-tight">
          Aspen<span className="text-[#00D97E]">Reach</span>
        </span>
        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-[#8892A4]">Loading</p>
          ) : !user ? (
            <>
              <h1 className="text-xl font-bold">You have been invited</h1>
              <p className="mt-2 text-sm text-[#8892A4]">
                Sign in or create an account with the email address the invitation was sent to, then open this link again.
              </p>
              <div className="mt-6 flex gap-3 justify-center">
                <Link to="/login" className="px-5 py-2.5 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold">
                  Sign in
                </Link>
                <Link to="/signup" className="px-5 py-2.5 rounded-lg border border-white/15 text-sm font-semibold">
                  Create account
                </Link>
              </div>
            </>
          ) : state === "accepting" ? (
            <p className="text-sm text-[#8892A4]">Accepting your invitation</p>
          ) : state === "done" ? (
            <>
              <h1 className="text-xl font-bold text-[#00D97E]">Welcome aboard</h1>
              <p className="mt-2 text-sm text-[#8892A4]">{message}</p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold">Invitation problem</h1>
              <p className="mt-2 text-sm text-[#8892A4]">{message}</p>
              <Link to="/app" className="mt-6 inline-block px-5 py-2.5 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold">
                Go to the app
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
