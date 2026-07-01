import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/creators")({
  component: () => <Outlet />,
});