import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

// Real-auth gating. Access to /app requires an authenticated Supabase user.
// While loading the session we render nothing; once resolved, unauthenticated
// visitors are redirected to /login.
function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

useEffect(() => {
  if (!loading && !user) navigate({ to: "/login" });
}, [loading, user, navigate]);

if (loading || !user) return null;
  return <Outlet />;
}
