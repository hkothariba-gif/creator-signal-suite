import { createFileRoute, Outlet } from "@tanstack/react-router";
import type { SearchSchemaInput } from "@tanstack/react-router";

/* `?new=1` opens the create-campaign drawer on the index screen. It lives on
   this layout route rather than the index so the shell's "+ New campaign"
   button — which is in the /app header, not on the campaigns screen — can link
   straight to it from anywhere in the app. The Aspen design has no create
   affordance on the campaigns screen itself; the header button is it. */
export const Route = createFileRoute("/app/campaigns")({
  // TanStack parses search values, so ?new=1 arrives as the number 1 and
  // ?new=true as the boolean — not as strings. All four forms are accepted so a
  // hand-typed URL behaves the same as the shell's Link.
  validateSearch: (search: { new?: boolean | string | number } & SearchSchemaInput) => ({
    new:
      search.new === true || search.new === 1 || search.new === "1" || search.new === "true"
        ? true
        : undefined,
  }),
  component: () => <Outlet />,
});
