import { render, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    loading: false,
    logout: vi.fn(),
    user: {
      id: "test-user",
      email: "owner@aspen.test",
      onboarded: true,
      role: "admin",
      company_name: "Aspen Test",
      organization: { id: "test-org", name: "Aspen Test" },
    },
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    data: queryKey[0] === "shell-campaigns" ? [] : 0,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/components/app/DataGate", () => ({
  useConnectorStatus: () => ({
    data: {
      platform: { youtube: false, reddit: false, x: false, listening: false },
    },
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { Route as ProductionAppRoute } from "./app";

const AppLayout = ProductionAppRoute.options.component;

describe("authenticated app route", () => {
  it("renders the Aspen shell, authenticated account and nested route", async () => {
    const rootRoute = createRootRoute({ component: () => <Outlet /> });
    const appRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "app",
      component: AppLayout!,
    });
    const indexRoute = createRoute({
      getParentRoute: () => appRoute,
      path: "/",
      component: () => <div>Authenticated dashboard content</div>,
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([appRoute.addChildren([indexRoute])]),
      history: createMemoryHistory({ initialEntries: ["/app"] }),
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByText("owner@aspen.test")).toBeInTheDocument();
    expect(screen.getByText("Authenticated dashboard content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /0 of 4 platforms connected/ })).toBeInTheDocument();
  });
});
