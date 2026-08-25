-- Ratings and direct chat hardening for Kitabi
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (reviewer_id, seller_id, listing_id),
  check (reviewer_id <> seller_id)
);

create index if not exists ratings_seller_created_idx on public.ratings(seller_id, created_at desc);

alter table public.ratings enable row level security;

create policy "ratings public read"
  on public.ratings for select using (true);

create policy "ratings authenticated create"
  on public.ratings for insert to authenticated
  with check (reviewer_id = auth.uid() and reviewer_id <> seller_id);

create policy "ratings reviewer update"
  on public.ratings for update to authenticated
  using (reviewer_id = auth.uid() or public.is_admin())
  with check (reviewer_id = auth.uid() or public.is_admin());

create policy "ratings reviewer delete"
  on public.ratings for delete to authenticated
  using (reviewer_id = auth.uid() or public.is_admin());

create or replace function public.refresh_profile_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles p
  set rating = coalesce((select round(avg(r.rating)::numeric, 2) from public.ratings r where r.seller_id = p.id), 0),
      reviews_count = (select count(*) from public.ratings r where r.seller_id = p.id),
      updated_at = now()
  where p.id = coalesce(new.seller_id, old.seller_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists ratings_refresh_profile on public.ratings;
create trigger ratings_refresh_profile
after insert or update or delete on public.ratings
for each row execute function public.refresh_profile_rating();

alter publication supabase_realtime add table public.ratings;
