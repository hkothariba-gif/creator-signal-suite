import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

function hasTesterBypass() {
  if (typeof window === "undefined") return false;
  try {
    return (
      !!localStorage.getItem("aspen_tester_email") &&
      localStorage.getItem("aspen_onboarded") === "true"
    );
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

// TESTING-PHASE CLIENT-SIDE BYPASS:
// Allow /app when either (a) a real authenticated user exists, or (b) the tester
// localStorage flags from signup + onboarding are present. Otherwise redirect to /login.
function AppLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const allowed = !!user || hasTesterBypass();

  useEffect(() => {
    if (!allowed) navigate({ to: "/login" });
  }, [allowed, navigate]);

  if (!allowed) return null;
  return <Outlet />;
}
