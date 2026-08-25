-- Kitabi Supabase schema
-- Run this file in Supabase SQL Editor before enabling the new frontend.

create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'admin');
create type public.listing_status as enum ('active', 'reserved', 'completed', 'flagged');
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
  is_verified boolean not null default true,
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

