-- Kitabi security hardening for the existing Supabase project.
-- Run this migration once in Supabase SQL Editor.

-- Guests may browse only non-contact seller fields through this limited view.
drop policy if exists "profiles public read" on public.profiles;
create policy "profiles authenticated read"
on public.profiles
for select
to authenticated
using (true);

drop view if exists public.public_profile_directory;
create view public.public_profile_directory as
select
  id,
  name,
  avatar,
  wilaya_code,
  municipality,
  rating,
  reviews_count,
  is_verified,
  is_bookstore,
  bookstore_name,
  joined_date
from public.profiles;

grant select on public.public_profile_directory to anon, authenticated;

-- A participant must never be able to replace requester/owner identity during an update.
create or replace function public.protect_exchange_participants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.requester_id <> old.requester_id
       or new.owner_id <> old.owner_id
       or new.target_listing_id <> old.target_listing_id then
      raise exception 'exchange participant identity cannot be changed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_exchange_participants_trigger on public.exchange_requests;
create trigger protect_exchange_participants_trigger
before update on public.exchange_requests
for each row execute function public.protect_exchange_participants();

-- Prevent non-admin notification inserts from forging another actor.
drop policy if exists "notifications authenticated insert" on public.notifications;
create policy "notifications authenticated insert"
on public.notifications
for insert
to authenticated
with check (
  public.is_admin()
  or (
    actor_id = auth.uid()
    and type in ('favorite', 'message', 'exchange')
  )
);

-- Increment views without exposing a general listings UPDATE operation to browsers.
create or replace function public.increment_listing_views(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set views = views + 1
  where id = p_listing_id and status = 'active';
end;
$$;

revoke all on function public.increment_listing_views(uuid) from public;
grant execute on function public.increment_listing_views(uuid) to anon, authenticated;
