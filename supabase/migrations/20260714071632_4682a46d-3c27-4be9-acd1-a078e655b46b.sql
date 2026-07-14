-- Remove rows that used the old external-network providers; the product now uses in-house tracking only.
DELETE FROM public.affiliate_events
WHERE provider IN ('impact', 'partnerstack', 'rakuten', 'cj', 'amazon', 'generic');

DELETE FROM public.affiliate_connections
WHERE provider IN ('impact', 'partnerstack', 'rakuten', 'cj', 'amazon', 'generic');

-- Drop defaults that reference the old enum so the column type can be changed.
ALTER TABLE public.affiliate_connections ALTER COLUMN provider DROP DEFAULT;
ALTER TABLE public.affiliate_events ALTER COLUMN provider DROP DEFAULT;

-- Recreate the enum with the in-house sales/checkout providers.
ALTER TYPE public.affiliate_provider RENAME TO affiliate_provider_old;

CREATE TYPE public.affiliate_provider AS ENUM (
  'stripe',
  'shopify',
  'paddle',
  'lemonsqueezy',
  'manual'
);

ALTER TABLE public.affiliate_connections
  ALTER COLUMN provider TYPE public.affiliate_provider
  USING provider::text::public.affiliate_provider;

ALTER TABLE public.affiliate_events
  ALTER COLUMN provider TYPE public.affiliate_provider
  USING provider::text::public.affiliate_provider;

DROP TYPE public.affiliate_provider_old;