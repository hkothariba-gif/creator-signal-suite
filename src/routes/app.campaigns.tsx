import { createFileRoute, Outlet } from "@tanstack/react-router";
import type { SearchSchemaInput } from "@tanstack/react-router";

/* `?new=1` opens the create-campaign drawer on the index screen. It lives on
   this layout route rather than the index so the shell's "+ New campaign"
   button — which is in the /app header, not on the campaigns screen — can link
   straight to it from anywhere in the app. The Aspen design has no create
   affordance on the campaigns screen itself; the header button is it. */
export const Route = createFileRoute("/app/campaigns")({
  validateSearch: (search: { new?: boolean | string } & SearchSchemaInput) => ({
    new: search.new === true || search.new === "1" || search.new === "true" ? true : undefined,
  }),
  component: () => <Outlet />,
});
