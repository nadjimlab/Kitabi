-- Kitabi interaction hardening
-- Run once in the Supabase SQL Editor after 20260826_security_hardening.sql.

-- A chat must always contain exactly two distinct participants, and its participant
-- list cannot be replaced by a participant after the chat has been created.
create or replace function public.validate_chat_participants()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.participant_ids is null
     or coalesce(array_length(new.participant_ids, 1), 0) <> 2
     or new.participant_ids[1] = new.participant_ids[2]
     or (not public.is_admin() and auth.uid() <> any(new.participant_ids)) then
    raise exception 'invalid chat participants';
  end if;
  if tg_op = 'UPDATE' and not public.is_admin() and new.participant_ids <> old.participant_ids then
    raise exception 'chat participants cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_chat_participants_trigger on public.chats;
create trigger validate_chat_participants_trigger
before insert or update on public.chats
for each row execute function public.validate_chat_participants();

-- Messages can only be created inside a chat containing both sender and receiver.
-- After creation, only the read flag may be changed by the receiver.
create or replace function public.validate_message_membership()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  participants uuid[];
begin
  select c.participant_ids into participants
  from public.chats c
  where c.id = new.chat_id;

  if participants is null
     or new.sender_id <> auth.uid()
     or new.receiver_id = new.sender_id
     or not (new.sender_id = any(participants))
     or not (new.receiver_id = any(participants)) then
    raise exception 'message participants are not valid';
  end if;

  if tg_op = 'UPDATE' and not public.is_admin()
     and (new.chat_id <> old.chat_id
       or new.sender_id <> old.sender_id
       or new.receiver_id <> old.receiver_id
       or new.listing_id is distinct from old.listing_id
       or new.text <> old.text
       or new.created_at <> old.created_at) then
    raise exception 'message identity cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_message_membership_trigger on public.messages;
create trigger validate_message_membership_trigger
before insert or update on public.messages
for each row execute function public.validate_message_membership();

drop policy if exists "messages sender insert" on public.messages;
create policy "messages sender insert"
on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and receiver_id <> auth.uid()
  and exists (
    select 1 from public.chats c
    where c.id = chat_id
      and auth.uid() = any(c.participant_ids)
      and receiver_id = any(c.participant_ids)
  )
);

-- The owner of the target listing is derived from the listing itself, not from
-- a client-provided owner_id value.
drop policy if exists "exchange requester insert" on public.exchange_requests;
create policy "exchange requester insert"
on public.exchange_requests for insert to authenticated
with check (
  requester_id = auth.uid()
  and requester_id <> owner_id
  and exists (
    select 1 from public.listings l
    where l.id = target_listing_id
      and l.seller_id = owner_id
      and l.status = 'active'
  )
  and (
    offered_listing_id is null
    or exists (
      select 1 from public.listings offered
      where offered.id = offered_listing_id
        and offered.seller_id = auth.uid()
    )
  )
);

-- Ratings must refer to the actual seller of the selected listing. The trigger
-- also prevents changing the identities after a rating has been created.
create or replace function public.validate_rating_ownership()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  listing_seller uuid;
begin
  select l.seller_id into listing_seller
  from public.listings l
  where l.id = new.listing_id;
  if listing_seller is null
     or new.seller_id <> listing_seller
     or new.reviewer_id = new.seller_id then
    raise exception 'rating ownership is not valid';
  end if;
  if tg_op = 'INSERT' and not public.is_admin() and new.reviewer_id <> auth.uid() then
    raise exception 'rating reviewer must be the current user';
  end if;
  if tg_op = 'UPDATE' and not public.is_admin()
     and (new.reviewer_id <> old.reviewer_id
       or new.seller_id <> old.seller_id
       or new.listing_id <> old.listing_id) then
    raise exception 'rating identity cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_rating_ownership_trigger on public.ratings;
create trigger validate_rating_ownership_trigger
before insert or update on public.ratings
for each row execute function public.validate_rating_ownership();

drop policy if exists "ratings authenticated create" on public.ratings;
create policy "ratings authenticated create"
on public.ratings for insert to authenticated
with check (
  reviewer_id = auth.uid()
  and reviewer_id <> seller_id
  and exists (
    select 1 from public.listings l
    where l.id = listing_id and l.seller_id = seller_id
  )
);
