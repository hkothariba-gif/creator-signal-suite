-- Campaign spend rolls up org-wide, through a security-definer function.
--
-- The bug: a teammate who did not author a campaign's ads saw "No spend
-- recorded" instead of the real total. ad_daily is already readable by any org
-- member (20260805120000), but useCampaignPerformance reached it by first
-- selecting ads for the campaign and then filtering ad_daily on those ids. The
-- ads read policy is
--
--   is_org_member(organization_id) AND (shared OR created_by = auth.uid())
--
-- so a reader who authored none of the ads got an empty id list, an empty
-- ad_daily filter, and a total that was absent rather than zero.
--
-- Why a definer function and not a wider ads policy: dropping the
-- shared/created_by clause would expose every unshared draft ad in full —
-- headline, body, insights, image path — to the whole organization, to fix a
-- number. Ads are private until shared on purpose, and Ads Center is built
-- around that. This function exposes only what ad_daily's own policy already
-- grants org members: summed spend, by day and currency, plus a count of the
-- ads carrying it. No ad id, name or creative crosses the boundary, so a
-- reader learns nothing about unshared ads beyond what the money says.
--
-- Absent still is not zero. The function returns no rows when nothing was
-- recorded, and a row with spend_minor = 0 when a zero genuinely was, so the
-- caller can keep telling "No spend recorded" apart from "$0.00".
--
-- Currencies are not converted, matching the rest of the spend work: the
-- grouping keeps them apart and the caller decides what a mixed campaign
-- displays.

CREATE OR REPLACE FUNCTION public.campaign_spend_daily(p_org uuid, p_campaign uuid)
RETURNS TABLE (day date, currency text, spend_minor bigint, ads_with_spend integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- RLS is bypassed below, so membership is checked here and nowhere else.
  -- Raising beats returning zero rows: a caller who is refused must not be
  -- able to read the refusal as "this campaign has no spend".
  IF NOT public.is_org_member(p_org) THEN
    RAISE EXCEPTION 'not a member of organization %', p_org
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  WITH campaign_rows AS (
    SELECT d.ad_id, d.day, d.currency, d.spend_minor
    FROM public.ad_daily d
    JOIN public.ads a ON a.id = d.ad_id
    WHERE d.organization_id = p_org
      -- Both sides pinned to p_org: a campaign id borrowed from another
      -- organization joins to nothing rather than reading across the tenant.
      AND a.organization_id = p_org
      AND a.campaign_id = p_campaign
  )
  SELECT
    r.day,
    r.currency,
    SUM(r.spend_minor)::bigint,
    -- Campaign-wide, so the "across N ads" note counts every ad carrying
    -- spend, not just the ones this reader can see. Same value on every row;
    -- one round trip is worth the repetition.
    (SELECT COUNT(DISTINCT c.ad_id) FROM campaign_rows c)::integer
  FROM campaign_rows r
  GROUP BY r.day, r.currency
  ORDER BY r.day;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.campaign_spend_daily(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.campaign_spend_daily(uuid, uuid) TO authenticated;
-- Not granted to service_role on purpose. The gate reads auth.uid(), which is
-- null there, so the call would only ever raise; service_role reads ad_daily
-- directly instead. Granting it would imply a path that does not work.

-- No new index: idx_ads_campaign drives the ads side and idx_ad_daily_ad the
-- join back into spend.
