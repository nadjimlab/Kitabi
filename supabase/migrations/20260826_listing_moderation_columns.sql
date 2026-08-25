-- Add moderation metadata to the existing listings table without deleting data.
alter table public.listings add column if not exists moderation_note text;
alter table public.listings add column if not exists reviewed_at timestamptz;
alter table public.listings add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
