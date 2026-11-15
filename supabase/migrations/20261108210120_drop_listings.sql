-- Drops `listings`, an empty table that was on the shared project before the
-- app's migrations (id, price, category, description). Nothing uses it. It had
-- row level security off and full grants to anon and authenticated, so anyone
-- with the publishable key could read and write it, and the Security Advisor
-- flagged it ("RLS Disabled in Public").
--
-- `if exists`: the local stack never had it, so there this does nothing.
drop table if exists public.listings;
