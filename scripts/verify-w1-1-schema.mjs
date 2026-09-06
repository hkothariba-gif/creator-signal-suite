import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const migrationDirectory = join(process.cwd(), "supabase", "migrations");
const migrationNames = [
  "20260831210000_w1_1_ownership_preflight.sql",
  "20260831211000_w1_1_org_scope.sql",
  "20260831212000_w1_1_identity_events.sql",
  "20260831213000_w1_1_attribution.sql",
  "20260831214000_w1_1_money.sql",
  "20260831215000_w1_1_platform_imports.sql",
  "20260831216000_w1_1_lifecycle.sql",
  "20260831217000_w1_1_creator_portal.sql",
  "20260831218000_w1_1_creative_intelligence.sql",
  "20260831219000_w1_1_actions_automation.sql",
  "20260831220000_w1_1_ai_citations_and_contract_checks.sql",
];

const migrations = new Map(
  migrationNames.map((name) => [name, readFileSync(join(migrationDirectory, name), "utf8")]),
);
const allSql = [...migrations.values()].join("\n");

const businessTables = [
  "visitors",
  "identities",
  "persons",
  "accounts",
  "events",
  "event_receipts",
  "event_definitions",
  "touchpoints",
  "conversions",
  "channels",
  "attribution_models",
  "model_defaults",
  "attributions",
  "claim_conflicts",
  "tracking_health",
  "channel_daily",
  "cost_items",
  "plan_costs",
  "budget_plans",
  "budget_recommendations",
  "revenue_recognition",
  "ad_accounts",
  "platform_campaigns",
  "platform_ad_groups",
  "asset_groups",
  "platform_ads",
  "keywords",
  "audiences",
  "platform_sync_log",
  "import_jobs",
  "external_campaign_refs",
  "journeys",
  "journey_steps",
  "journey_runs",
  "messages",
  "message_sends",
  "sending_domains",
  "esp_connections",
  "suppressions",
  "consents",
  "landing_pages",
  "creator_brand_links",
  "deliverables",
  "review_events",
  "threads",
  "thread_messages",
  "deal_terms",
  "payouts",
  "brand_assets",
  "creative_tags",
  "diversity_snapshots",
  "action_invocations",
  "automation_rules",
  "approvals",
  "ai_citations",
];

const contractChecks = migrations.get("20260831220000_w1_1_ai_citations_and_contract_checks.sql");
for (const table of businessTables) {
  assert.match(allSql, new RegExp(`CREATE TABLE public\\.${table}\\s*\\(`));
  assert.match(contractChecks, new RegExp(`'${table}'`));
}

const ownershipTables = [
  "campaigns",
  "hotlist",
  "ad_corpus",
  "brand_docs",
  "creator_contacts",
  "channel_connections",
  "outreach_threads",
  "outreach_messages",
  "outreach_sequences",
  "outreach_sequence_steps",
  "sequence_enrollments",
];
const preflight = migrations.get("20260831210000_w1_1_ownership_preflight.sql");
const orgScope = migrations.get("20260831211000_w1_1_org_scope.sql");
for (const table of ownershipTables) {
  assert.match(preflight, new RegExp(`'${table}'`));
  assert.match(orgScope, new RegExp(`'${table}'`));
  assert.match(contractChecks, new RegExp(`'${table}'`));
}

assert.match(preflight, /ownership_backfill_quarantine/);
assert.match(orgScope, /resolved_at IS NULL/);
assert.match(orgScope, /ALTER COLUMN organization_id SET NOT NULL/);
assert.match(orgScope, /FORCE ROW LEVEL SECURITY/);

const identitySql = migrations.get("20260831212000_w1_1_identity_events.sql");
assert.match(identitySql, /PARTITION BY RANGE \(occurred_at\)/);
assert.match(identitySql, /UNIQUE \(organization_id, source, external_event_id\)/);
assert.match(identitySql, /plan_viewed/);
assert.match(identitySql, /seat_added/);
assert.match(identitySql, /version INTEGER NOT NULL DEFAULT 1/);
assert.match(identitySql, /'org_editors_select_' \|\| table_name/);
assert.match(identitySql, /visitors_redacted/);

const attributionSql = migrations.get("20260831213000_w1_1_attribution.sql");
assert.match(attributionSql, /Attribution credits must total 1/);
assert.match(attributionSql, /DEFERRABLE INITIALLY DEFERRED/);
assert.match(attributionSql, /'unattributed'/);
assert.match(attributionSql, /attribution_models are immutable/);

const moneySql = migrations.get("20260831214000_w1_1_money.sql");
assert.match(moneySql, /amount_minor BIGINT/);
assert.match(moneySql, /cadence IN \('daily', 'monthly'\)/);
assert.doesNotMatch(moneySql, /GRANT UPDATE \(status, decided_by, decided_at\)/);

const importSql = migrations.get("20260831215000_w1_1_platform_imports.sql");
assert.match(importSql, /ownership_mode TEXT NOT NULL DEFAULT 'read_only'/);
assert.doesNotMatch(importSql, /CREATE POLICY org_editors_adopt_external_campaign/);
assert.doesNotMatch(
  importSql.replace(/^--.*$/gm, ""),
  /\b(access_token|refresh_token|api_key|client_secret|private_key)\b/i,
);

const portalSql = migrations.get("20260831217000_w1_1_creator_portal.sql");
assert.match(portalSql, /is_creator_link_participant/);
assert.doesNotMatch(portalSql, /USING \(public\.has_creator_brand_access\(organization_id\)\)/);

const actionSql = migrations.get("20260831219000_w1_1_actions_automation.sql");
assert.match(actionSql, /action_invocations is append-only/);
assert.match(actionSql, /BEFORE UPDATE OR DELETE/);
assert.match(actionSql, /FUNCTION public\.decide_approval/);
assert.doesNotMatch(actionSql, /GRANT UPDATE \(status, decision_reason, decided_by, decided_at\)/);

const lifecycleSql = migrations.get("20260831216000_w1_1_lifecycle.sql");
assert.doesNotMatch(lifecycleSql, /'push'/);
assert.match(lifecycleSql, /status = ''draft''/);

assert.match(contractChecks, /w1_1_force_existing_rls/);

for (const [name, sql] of migrations) {
  const dollarTags = sql.match(/\$[A-Za-z0-9_]*\$/g) ?? [];
  const tagCounts = new Map();
  for (const tag of dollarTags) {
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  for (const [tag, count] of tagCounts) {
    assert.equal(count % 2, 0, `${name} has an unclosed ${tag} block`);
  }
}

console.log(
  `W1-1 schema contract verified: ${migrationNames.length} ordered migrations, ${businessTables.length} new business tables, ${ownershipTables.length} legacy ownership targets.`,
);
