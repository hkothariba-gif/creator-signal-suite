import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

// Tester bypass: dashboard is viewable without an authenticated Supabase session.
// Child routes that query Supabase will simply render empty states when there's no user.
function AppLayout() {
  return <Outlet />;
}
