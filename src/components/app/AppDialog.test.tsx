import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppDialog, AppDialogClose, AppDialogContent, AppDialogTrigger } from "./AppDialog";

function DialogHarness() {
  const [open, setOpen] = useState(false);

  return (
    <AppDialog open={open} onOpenChange={setOpen}>
      <AppDialogTrigger asChild>
        <button type="button">Open campaign dialog</button>
      </AppDialogTrigger>
      <AppDialogContent title="Create campaign" description="Set the campaign details.">
        <input aria-label="Campaign name" />
        <AppDialogClose asChild>
          <button type="button">Cancel</button>
        </AppDialogClose>
      </AppDialogContent>
    </AppDialog>
  );
}

describe("AppDialog", () => {
  it("provides dialog semantics, closes on Escape and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const trigger = screen.getByRole("button", { name: "Open campaign dialog" });
    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Create campaign" });
    expect(dialog).toHaveAccessibleDescription("Set the campaign details.");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
