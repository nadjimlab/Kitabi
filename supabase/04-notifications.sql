-- Kitabi notifications: run once after the main schema
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  listing_id uuid references public.listings(id) on delete cascade,
  type text not null check (type in ('favorite', 'message', 'exchange', 'report', 'listing_status', 'system')),
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications(recipient_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications recipient read"
  on public.notifications for select to authenticated
  using (recipient_id = auth.uid() or public.is_admin());

create policy "notifications recipient update"
  on public.notifications for update to authenticated
  using (recipient_id = auth.uid() or public.is_admin())
  with check (recipient_id = auth.uid() or public.is_admin());

create policy "notifications authenticated insert"
  on public.notifications for insert to authenticated
  with check (actor_id = auth.uid() or public.is_admin());

alter publication supabase_realtime add table public.notifications;
