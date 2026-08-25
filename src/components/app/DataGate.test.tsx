import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/connectors.functions", () => ({
  getConnectorStatus: vi.fn(),
}));

import { DataGate } from "./DataGate";

describe("DataGate", () => {
  it("renders a shaped loading state with Aspen as the default treatment", () => {
    const { container } = render(
      <DataGate connected loading>
        <div>Live content</div>
      </DataGate>,
    );

    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("bg-surface", "border-sand-line");
    expect(screen.queryByText("Live content")).not.toBeInTheDocument();
  });

  it("keeps an empty result distinct from a failed query", () => {
    const { rerender } = render(
      <DataGate
        connected
        empty
        emptyTitle="No creators yet"
        emptyHint="Run discovery to add your first creator."
      >
        <div>Live content</div>
      </DataGate>,
    );

    expect(screen.getByText("No creators yet")).toBeInTheDocument();
    expect(screen.getByText("Run discovery to add your first creator.")).toBeInTheDocument();

    rerender(
      <DataGate
        connected
        empty
        error
        errorTitle="Could not load creators"
        errorHint="The saved creators are temporarily unavailable."
      >
        <div>Live content</div>
      </DataGate>,
    );

    expect(screen.getByText("Could not load creators")).toBeInTheDocument();
    expect(screen.queryByText("No creators yet")).not.toBeInTheDocument();
  });

  it("requires an explicit opt-in for the dark treatment", () => {
    const { container } = render(
      <DataGate connected empty variant="dark">
        <div>Live content</div>
      </DataGate>,
    );

    expect(container.firstChild).toHaveClass("bg-bg-surface", "border-white/[0.07]");
    expect(container.firstChild).not.toHaveClass("bg-surface");
  });
});
