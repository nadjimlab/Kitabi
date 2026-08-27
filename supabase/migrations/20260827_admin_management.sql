-- Kitabi admin management hardening
-- Run once in the Supabase SQL Editor after the previous migrations.

-- A normal user may edit their profile fields, but never their role.
-- An already-authorized admin may manage roles through the admin panel.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() and new.role is distinct from old.role then
    raise exception 'cannot change your own role';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
before update on public.profiles
for each row execute function public.protect_profile_role();

-- Make the admin capability explicit and auditable. The existing self-update
-- policy continues to serve a user editing their own profile.
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update"
on public.profiles for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Keep admin deletion of listings explicit while preserving owner deletion.
drop policy if exists "listings admin delete" on public.listings;
create policy "listings admin delete"
on public.listings for delete to authenticated
using (public.is_admin());
