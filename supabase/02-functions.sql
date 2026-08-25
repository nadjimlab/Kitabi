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
