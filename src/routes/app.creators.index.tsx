import { createFileRoute, redirect } from "@tanstack/react-router";

// The creators section only has detail pages at /app/creators/$id. The bare
// index used to render an empty Outlet, which showed as a blank screen.
// Discovery is the real list view, so send visitors there.
export const Route = createFileRoute("/app/creators/")({
  beforeLoad: () => {
    throw redirect({ to: "/app/discovery", search: { campaign: undefined } });
  },
});
