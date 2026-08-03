import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// The scroll-through tour is a standalone static page in public/tour/, not a
// router route, and both landing CTAs link to it as /tour.
//
// This is a dev-only gap. In production Cloudflare's asset handler already
// resolves /tour -> /tour/ -> index.html by itself, so the request never
// reaches this worker. Vite's dev server does no such directory-index
// resolution, so /tour fell through to the router and rendered its 404.
//
// It redirects rather than returning the file's bytes at /tour, because the
// tour's markup uses relative references ("scrub-engine.js",
// "assets/vid/conn1.mp4"). Served at /tour those resolve against the site
// root and every one 404s; they only resolve with the document under /tour/.
//
// Only the bare path is matched. Redirecting /tour/ as well would be a latent
// loop in production, where the asset handler sends /tour/index.html back to
// /tour/. Left alone, /tour/ is served directly in production, and in dev the
// router's trailing-slash redirect lands it here and it terminates.
function tourRedirect(request: Request): Response | null {
  const { pathname, search } = new URL(request.url);
  if (pathname !== "/tour") return null;
  return Response.redirect(new URL(`/tour/index.html${search}`, request.url), 308);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const tour = tourRedirect(request);
      if (tour) return tour;
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
