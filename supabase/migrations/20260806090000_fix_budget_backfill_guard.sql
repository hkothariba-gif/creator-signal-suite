-- Tighten the budget backfill guard from 20260805120000.
--
-- That migration's WHERE clause tested the *stripped* string, not the original:
--
--   regexp_replace(budget, '[^0-9.]', '', 'g') ~ '^[0-9]+(\.[0-9]{1,2})?$'
--
-- Stripping happens first, so a range or an abbreviation survives as a plain
-- number and converts to a wrong value. Confirmed against the live database:
--
--   '$24,000'      -> 2400000      correct
--   '500'          -> 50000        correct
--   'TBD'          -> NULL         correct
--   '10-15k'       -> 101500       WRONG (spec says ignore; $1,015)
--   '$1,000-2,000' -> 1000200000   WRONG ($10,002,000)
--   '~$5k'         -> 500          WRONG ($5, not $5,000)
--
-- SPEC-spend-and-attribution.md §2a says these should be ignored and left NULL;
-- only the SQL disagreed. No row in this database was affected — the one row
-- carrying budget text was '500' — but the bug would bite any org whose budget
-- was typed as a range or with a k/m suffix.
--
-- The fix rejects the original text if it contains a letter (k, m, "TBD", "to")
-- or a range separator, before the strip-and-parse test runs at all.

-- Undo any wrong conversion. Safe to scope this way because nothing writes
-- budget_minor yet except that backfill — the numeric budget input ships with
-- this same change set, so any non-null value here came from the backfill.
UPDATE public.campaigns
SET budget_minor = NULL
WHERE budget_minor IS NOT NULL
  AND budget IS NOT NULL
  AND (budget ~ '[A-Za-z]' OR budget ~ '[-–—/]');

-- Re-run the backfill for anything still unconverted, with the stricter guard.
UPDATE public.campaigns
SET budget_minor = (regexp_replace(budget, '[^0-9.]', '', 'g'))::numeric * 100
WHERE budget IS NOT NULL
  AND budget_minor IS NULL
  AND budget !~ '[A-Za-z]'
  AND budget !~ '[-–—/]'
  AND regexp_replace(budget, '[^0-9.]', '', 'g') ~ '^[0-9]+(\.[0-9]{1,2})?$';
