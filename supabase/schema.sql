-- Kitabi Supabase schema
-- Run this file in Supabase SQL Editor before enabling the new frontend.

create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'admin');
create type public.listing_status as enum ('active', 'reserved', 'completed', 'sold', 'unavailable', 'flagged', 'pending');
create type public.deal_type as enum ('sale', 'exchange', 'free');
create type public.report_status as enum ('pending', 'resolved', 'dismissed');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'مستخدم كتابي',
  email text not null default '',
  phone text not null default '',
  whatsapp text,
  avatar text not null default '',
  wilaya_code integer not null default 16,
  municipality text not null default 'الجزائر الوسطى',
  rating numeric(3,2) not null default 5,
  reviews_count integer not null default 0,
  is_verified boolean not null default false,
  is_bookstore boolean not null default false,
  bookstore_name text,
  joined_date text not null default '',
  bio text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  author text,
  publisher text,
  publication_year integer,
  level text not null,
  grade text not null default '',
  grade_code text not null default '',
  stream text,
  subject text not null default '',
  condition text not null default 'good',
  deal_type public.deal_type not null default 'sale',
  price numeric(12,2) not null default 0,
  original_price numeric(12,2),
  exchange_for text,
  description text not null default '',
  photos text[] not null default '{}',
  wilaya_code integer not null default 16,
  wilaya_name_ar text not null default '',
  wilaya_name_fr text not null default '',
  municipality text not null default '',
  delivery_available boolean not null default false,
  hand_delivery_only boolean not null default false,
  has_pencil_marks boolean not null default false,
  has_answers_included boolean not null default false,
  includes_cd boolean not null default false,
  views integer not null default 0,
  favorites_count integer not null default 0,
  is_featured boolean not null default false,
  status public.listing_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  participant_ids uuid[] not null,
  last_message text not null default '',
  last_message_time timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  text text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.exchange_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  target_listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  offered_listing_id uuid references public.listings(id) on delete set null,
  offered_book_title text not null default '',
  message text not null default '',
  wilaya_name_ar text not null default '',
  municipality text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text not null default '',
  status public.report_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists listings_status_created_idx on public.listings(status, created_at desc);
create index if not exists listings_seller_idx on public.listings(seller_id);
create index if not exists messages_chat_created_idx on public.messages(chat_id, created_at asc);
create index if not exists reports_status_created_idx on public.reports(status, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar, joined_date)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'مستخدم كتابي'),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'avatar', ''),
    to_char(now(), 'YYYY-MM-DD')
  )
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.exchange_requests enable row level security;
alter table public.reports enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles public read" on public.profiles for select using (true);
create policy "profiles self update" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "profiles self insert" on public.profiles for insert with check (id = auth.uid());
create policy "profiles admin delete" on public.profiles for delete using (public.is_admin());

create policy "listings public read active" on public.listings for select using (status = 'active' or seller_id = auth.uid() or public.is_admin());
create policy "listings authenticated create" on public.listings for insert to authenticated with check (seller_id = auth.uid());
create policy "listings owner update" on public.listings for update to authenticated using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());
create policy "listings owner delete" on public.listings for delete to authenticated using (seller_id = auth.uid() or public.is_admin());

create policy "favorites self access" on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "chats participant read" on public.chats for select to authenticated using (auth.uid() = any(participant_ids) or public.is_admin());
create policy "chats participant write" on public.chats for insert to authenticated with check (auth.uid() = any(participant_ids));
create policy "chats participant update" on public.chats for update to authenticated using (auth.uid() = any(participant_ids) or public.is_admin()) with check (auth.uid() = any(participant_ids) or public.is_admin());
create policy "messages participant read" on public.messages for select to authenticated using (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin());
create policy "messages sender insert" on public.messages for insert to authenticated with check (sender_id = auth.uid());
create policy "messages receiver update" on public.messages for update to authenticated using (receiver_id = auth.uid() or public.is_admin()) with check (receiver_id = auth.uid() or public.is_admin());
create policy "exchange participants read" on public.exchange_requests for select to authenticated using (requester_id = auth.uid() or owner_id = auth.uid() or public.is_admin());
create policy "exchange requester insert" on public.exchange_requests for insert to authenticated with check (requester_id = auth.uid());
create policy "exchange participants update" on public.exchange_requests for update to authenticated using (requester_id = auth.uid() or owner_id = auth.uid() or public.is_admin()) with check (requester_id = auth.uid() or owner_id = auth.uid() or public.is_admin());
create policy "reports admin read" on public.reports for select to authenticated using (public.is_admin() or reporter_id = auth.uid());
create policy "reports user insert" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports admin update" on public.reports for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public) values ('book-images', 'book-images', true) on conflict (id) do nothing;
create policy "book images public read" on storage.objects for select using (bucket_id = 'book-images');
create policy "book images authenticated upload" on storage.objects for insert to authenticated with check (bucket_id = 'book-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "book images owner update" on storage.objects for update to authenticated using (bucket_id = 'book-images' and owner_id = auth.uid()::text) with check (bucket_id = 'book-images' and owner_id = auth.uid()::text);
create policy "book images owner delete" on storage.objects for delete to authenticated using (bucket_id = 'book-images' and (owner_id = auth.uid()::text or public.is_admin()));
