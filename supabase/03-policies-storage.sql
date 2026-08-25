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
