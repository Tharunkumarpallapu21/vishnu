-- Run this in Supabase SQL Editor for the existing project.
-- This migration does not delete or recreate public.rolls and does not claim any roll.

alter table public.rolls
  add column if not exists session_token_hash text;

create unique index if not exists rolls_session_token_hash_key
  on public.rolls (session_token_hash)
  where session_token_hash is not null;

create or replace function public.claim_roll(
  p_roll_number text,
  p_session_token_hash text
)
returns table(status text, claimed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_roll text := upper(trim(coalesce(p_roll_number, '')));
  claimed_roll text;
begin
  if normalized_roll = '' or p_session_token_hash is null or length(p_session_token_hash) <> 64 then
    return query select 'invalid'::text, false;
    return;
  end if;

  update public.rolls
     set claimed_at = now(),
         session_token_hash = p_session_token_hash
   where roll_number = normalized_roll
     and claimed_at is null
   returning roll_number into claimed_roll;

  if claimed_roll is not null then
    return query select 'success'::text, true;
  end if;

  if exists (select 1 from public.rolls where roll_number = normalized_roll) then
    return query select 'claimed'::text, false;
  end if;

  return query select 'invalid'::text, false;
end;
$$;

alter table public.rolls enable row level security;
revoke all on table public.rolls from anon, authenticated;
revoke all on function public.claim_roll(text, text) from anon, authenticated;
grant execute on function public.claim_roll(text, text) to service_role;

-- Verify before any live claim:
-- select count(*) as total_rolls,
--        count(*) filter (where claimed_at is null) as available_rolls,
--        count(*) filter (where claimed_at is not null) as claimed_rolls
-- from public.rolls;
-- Expected initially: 66, 66, 0.
