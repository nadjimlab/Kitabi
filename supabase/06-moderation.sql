-- Kitabi moderation workflow
alter type public.listing_status add value if not exists 'pending';

alter table public.listings add column if not exists moderation_note text not null default '';
alter table public.listings add column if not exists reviewed_at timestamptz;
alter table public.listings add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;

-- Replace the public read policy so only approved active listings are visible to guests.
drop policy if exists "listings public read active" on public.listings;
create policy "listings public read active"
on public.listings for select to anon, authenticated
using (status = 'active' or seller_id = auth.uid() or public.is_admin());

-- Only the owner can create a pending listing; admin can moderate all listings.
drop policy if exists "listings authenticated create" on public.listings;
create policy "listings authenticated create"
on public.listings for insert to authenticated
with check (seller_id = auth.uid() and status = 'pending');

drop policy if exists "listings moderation update" on public.listings;
create policy "listings moderation update"
on public.listings for update to authenticated
using (seller_id = auth.uid() or public.is_admin())
with check ((seller_id = auth.uid() and status in ('pending','completed','reserved')) or public.is_admin());

create index if not exists listings_moderation_status_idx on public.listings(status, created_at desc);
