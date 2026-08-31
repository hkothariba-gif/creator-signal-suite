# Aspen — external access checklist

Updated 2026-08-23. This tracks applications, accounts and materials that Harish must obtain.

**Never store API keys, client secrets, access tokens, private keys or passwords in this
file or anywhere committed to Git.** Record only status, account owner, request date, approval
date, scopes and the secret-manager/environment-variable name used by the application.

Status values: `not-started` · `researching` · `applied` · `test-access` · `approved` ·
`blocked` · `not-needed`.

## Paid media

| Platform | Priority | Status | Access needed | Harish's next action | Blocks |
| --- | --- | --- | --- | --- | --- |
| Google Ads API | Tier 1 | not-started | Manager account, developer token, OAuth app; test then basic access | Create/confirm manager account and request developer token | Google import, reporting, budgets and management |
| Meta Marketing API | Tier 1 | not-started | Meta Business verification, app, OAuth, advanced `ads_management`/reporting access | Begin business verification and create the app | Meta import, reporting and management |
| LinkedIn Marketing API | Tier 1 | not-started | Marketing Developer Platform approval, OAuth and advertising/reporting products | Submit partner/application request | LinkedIn import, reporting and management |
| Reddit Ads API | Tier 2 / feasibility | not-started | Ads API/partner access and reporting/write scopes | Contact Reddit and confirm current access route | Reddit import and management |
| TikTok Marketing API | Research | not-started | Developer app, advertiser authorization and relevant scopes | Validate demand with design partners first | Parked until demand is proven |

## Affiliate

Aspen is building and operating its own native affiliate program. The vendors below are
optional import/migration sources for customers with existing programs, not dependencies and
not accounts Harish needs for the core product. Universal CSV/manual import is first.

| Platform | Priority | Status | Access needed | Harish's next action | Blocks |
| --- | --- | --- | --- | --- | --- |
| PartnerStack | Optional after CSV | not-needed | Production API credentials and webhook configuration | No action now; obtain design-partner authorization only if migration demand is proven | Optional partner, deal, customer, reward and transaction migration |
| Rewardful | Optional after CSV | not-needed | Merchant API secret and webhook access | No action now; obtain design-partner authorization only if migration demand is proven | Optional campaign, affiliate, link and commission migration |
| impact.com | Tier 2 / feasibility | not-started | Brand/partner API access and commercial-plan confirmation | Confirm API availability and design-partner demand | Enterprise affiliate/creator import |
| FirstPromoter | CSV first | not-started | Export sample; API access only if justified | Obtain anonymised sample export | CSV mapping and native-adapter decision |
| Tapfiliate | CSV first | not-started | Export sample; API access only if justified | Obtain anonymised sample export | CSV mapping and native-adapter decision |

## Creator marketing

| Platform | Priority | Status | Access needed | Harish's next action | Blocks |
| --- | --- | --- | --- | --- | --- |
| Universal creator CSV | Tier 1 | not-started | Anonymised exports from real users | Obtain 2–3 representative campaign/creator/payment exports | Import schema and mapping UX |
| GRIN | Tier 1 after CSV | not-started | REST API access or authorised customer account; export samples | Find a GRIN design partner and confirm API entitlement | Native creator/campaign migration |
| CreatorIQ | Feasibility | not-started | API/export entitlement and commercial terms | Confirm demand and contact vendor | Enterprise connector decision |
| Aspire | Feasibility | not-started | API/export entitlement and commercial terms | Confirm demand and contact vendor | Connector decision |

## Retention and lifecycle

| Platform | Priority | Status | Access needed | Harish's next action | Blocks |
| --- | --- | --- | --- | --- | --- |
| HubSpot | Tier 1 | not-started | Developer account/app, OAuth scopes, test account | Create developer account/app | Campaign and performance import |
| Customer.io | Tier 1 | not-started | App/API credentials, reporting/export access, webhook options | Create/obtain test workspace access | Campaign/journey import and handoff |
| Klaviyo | Tier 2 | not-started | Developer app/private API test access and reporting scopes | Validate customer demand | Campaign/reporting import |
| Braze | Later enterprise | not-started | REST API/export access and commercial entitlement | Defer until enterprise demand exists | Enterprise campaign/journey import |

## Sending, legal and product materials

| Item | Priority | Status | Harish's next action | Blocks |
| --- | --- | --- | --- | --- |
| Dedicated sending domain | Before Wave 5 | not-started | Choose a domain/subdomain and retain DNS access | Email sending and warmup |
| Email provider account | Before Wave 5 | not-started | Select provider after volume/region requirements are known | Journey delivery |
| SPF/DKIM/DMARC | Before Wave 5 | not-started | Configure after provider/domain choice | Deliverability |
| GDPR/CAN-SPAM/DPA review | Before Wave 5 | not-started | Engage qualified counsel/reviewer | Lifecycle and identity-stitching release |
| Google ad-craft guide | Before Wave 3 generation | not-started | Supply approved source material | Grounded Google ad generation |
| Meta ad-craft guide | Before Wave 3 generation | not-started | Supply approved source material | Grounded Meta ad generation |
| Podcast transcript | Optional | not-started | Re-upload if a second extraction pass is wanted | Additional idea reconciliation only |

## Update log

Add one line whenever status changes. Do not include credentials.

| Date | Item | Old status | New status | Note |
| --- | --- | --- | --- | --- |
