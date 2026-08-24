# AspenReach — Phase 4E Kickoff (paste into the new chat)

I'm building **AspenReach** (`creator-signal-suite`), a B2B SaaS for brands to run creator/affiliate marketing. Repo: github.com/hkothariba-gif/creator-signal-suite (Lovable-connected, I push from Terminal — a GitHub PAT is cached in my Mac keychain). Supabase project `hjxjukueextjejasaxql`. I'm a non-coder; code it into the app and guide me through any Terminal/Supabase steps.

Phases 0–4 are shipped and deployed. Read `aspenreach-context/conventions.md` and `aspenreach-context/current-status.md` in the project folder before starting (and your saved memory files if present) — they cover the codebase rules, what Phase 4 built, and the deploy process. Don't re-derive; follow them.

## Build next: Phase 4E — Connect your own inbox (Gmail / Outlook)

**Goal:** let each brand connect their own Gmail or Outlook account via OAuth, so outreach emails send **from their real address** instead of the shared Resend platform sender.

**What already exists to build on:**
- `channel_connections` table (RLS user-scoped) already has `provider` values `gmail`/`outlook`, plus `from_address`, `external_account_id`, `status`. No secret material goes in this row.
- `sendOutreachMessage` in `src/lib/outreach.functions.ts` currently always sends email via Resend. This is where per-user sending plugs in.
- `getChannelConnections` server fn already lists active connections.

**Scope for 4E:**
1. OAuth connect flow — start with **Outlook (Microsoft Graph, `Mail.Send` delegated)** first; it's lighter (user-consent, no security audit). Gmail (`gmail.send`) second — note it needs Google OAuth app verification for production.
2. Securely store the OAuth access/refresh tokens **outside** the `channel_connections` row (Supabase Vault or a dedicated secrets table + edge function); the row just records provider + from_address + status.
3. An OAuth callback (edge function or server route) that exchanges the code for tokens, stores them, and upserts the `channel_connections` row.
4. Update `sendOutreachMessage`'s email adapter: if the user has an active gmail/outlook connection, send through that provider's API with their token; otherwise fall back to Resend (current behavior).
5. UI: a "Connect email account" button (Settings or the Outreach page) that starts OAuth and shows connected status. Gate with DataGate conventions.

**Confirm with me before building:** which provider to do first (I lean Outlook), and where the "Connect" button should live.

**Deliver the usual way:** local `npx tsc --noEmit && npx vite build` to verify, then Terminal `git push` (pull/merge first if `main` diverged), then Supabase deploy (migration in SQL editor if any, edge fn via CLI, secrets via CLI on one line with `--project-ref hjxjukueextjejasaxql`).
