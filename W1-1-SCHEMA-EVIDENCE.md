# W1-1 — schema delivery evidence

Updated 2026-09-06. This is the operator and review note for `W1-SCH-001`.
The approved product contract remains `STAGE-C-WAVE-1-CONTRACTS.md`.

## Delivered scope

- Eleven ordered forward migrations cover ownership preflight and the approved 4a–4i
  identity, attribution, money, platform/import, lifecycle, creator, creative, action and
  citation table families.
- Fifty-five new organisation-owned business tables use keys, constraints, supporting
  indexes and forced row-level security.
- Eleven legacy owner-scoped tables keep `user_id` compatibility while gaining a required
  `organization_id`, `created_by`, organisation policies and tenant-safe composite keys.
- Default event definitions, channel definitions and attribution models are seeded for
  existing and newly created organisations.
- Provider-neutral import tables contain references and capabilities, never credentials.
  Imported campaigns begin `read_only`; adoption requires a later registered action.
- Action history is append-only. Approval decisions use a bounded function that rechecks
  actor, assignment, expiry and input hash. Budget/adoption/payout state has no direct
  authenticated update path; provider results remain service-owned.

## Ownership backfill runbook

1. Apply `20260831210000_w1_1_ownership_preflight.sql` by itself.
2. Inspect `ownership_backfill_quarantine` as the service role. A row means the legacy owner
   belongs to zero or multiple organisations.
3. Correct organisation membership or record ownership outside the migration. Never delete,
   move or guess a customer row to make the migration pass.
4. Re-run the preflight. Resolved rows are retained with `resolved_at` evidence.
5. Continue with `20260831211000_w1_1_org_scope.sql` only when no unresolved row remains.

The organisation migration stops before changing ownership if preflight is unresolved. It
does not delete or rename existing columns, so the current application can continue using
its legacy `user_id` paths during Wave 1.

## Verification

Run `npm run test:schema` for the repository contract check. The final migration also fails
inside PostgreSQL when a required business table lacks a non-null organisation key, forced
RLS, seed definitions, or when a provider-neutral table contains a secret-bearing column.

On 2026-09-06, Supabase CLI 2.116.0 and a Docker-only local database replayed the complete
W1-1 set successfully. The replay used an isolated copy with three explicit legacy-only
reconciliation shims: conditionally skip a revoke for the absent `rls_auto_enable()`
function, reconstruct the missing `campaigns`/`hotlist` baseline from generated types, and
disable the later duplicate affiliate-object migration. None of those shims changed the
repository or the live project. They allowed the test to reach W1-1 and exposed one real
issue, use of unsupported `min(uuid)`, which was corrected to a single-element aggregate.

Database verification then passed for:

- all 11 W1-1 migrations, 55 new business tables and 11 legacy ownership targets;
- non-null tenant keys plus enabled and forced RLS on every required table;
- 7 seeded event definitions, 10 channels and 5 attribution models per new organisation;
- admin/editor/reviewer/creator/outsider isolation, raw-versus-redacted identity access,
  portal relationship walls and representative denied writes;
- cross-organisation composite foreign keys, append-only action history, read-only import
  defaults and absence of secret-bearing columns in provider-neutral tables; and
- the ownership-quarantine drill: a two-organisation owner was retained as unresolved and
  the ownership rewrite guard stopped.

After Supabase CLI authentication, a schema-only snapshot was captured from the linked,
healthy `aspenreach` project. It confirmed that live Supabase contains the missing function
and core tables and uses the later affiliate enum. A second blank local database then
applied that trusted snapshot followed by all eleven unmodified W1-1 migrations with no
legacy shims. The full structural, five-role security and quarantine suites passed again.

The authoritative 5,729-line TypeScript schema generated from that trusted replay is now
checked into `src/integrations/supabase/types.ts`; typecheck, tests and production build all
pass against it. The downloaded snapshot remains ignored under `supabase/.temp/`. No live
database data or structure was changed.

## Forward-fix policy

Published migration files are immutable after deployment. If an applied migration needs a
correction, add a new timestamped forward migration. Do not rewrite, squash, rebase or
force-push Lovable-connected history. Before deployment, review changes normally on this
feature branch; no rollback SQL should guess ownership or discard imported/event data.
