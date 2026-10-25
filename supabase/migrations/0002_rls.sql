-- Dev-X Store · 0002 · Row Level Security + grants (deny by default)

alter table public.admins            enable row level security;
alter table public.categories        enable row level security;
alter table public.branches          enable row level security;
alter table public.products          enable row level security;
alter table public.profiles          enable row level security;
alter table public.coupons           enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.order_events      enable row level security;
alter table public.order_messages    enable row level security;
alter table public.contact_messages  enable row level security;

-- start from zero privileges, then grant only what each role needs
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

-- public catalogue (visitors can browse; login is enforced by the UI + RPCs)
grant select on public.categories, public.branches, public.products to anon, authenticated;
create policy categories_read on public.categories for select using (true);
create policy branches_read   on public.branches   for select using (active or public.is_admin());
create policy products_read   on public.products   for select using (active or public.is_admin());

-- admin writes on the catalogue
grant insert, update, delete on public.categories, public.branches, public.products to authenticated;
grant usage on all sequences in schema public to authenticated;
create policy categories_admin on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy branches_admin   on public.branches   for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_admin   on public.products   for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- admins table: a user may only see their own row (lets the admin page ask "am I admin?")
grant select on public.admins to authenticated;
create policy admins_self on public.admins for select to authenticated using (user_id = auth.uid());

-- profiles: own row only (+ admin read)
grant select, update (full_name, phone, addresses) on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- coupons: only admins read/write the table; customers use validate_coupon()
grant select, insert, update, delete on public.coupons to authenticated;
create policy coupons_admin on public.coupons for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- orders: customers read their own; every write goes through the RPCs in 0003
grant select on public.orders, public.order_items, public.order_events to authenticated;
create policy orders_select on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy order_items_select on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy order_events_select on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

-- order_messages: admin only
grant select, insert on public.order_messages to authenticated;
create policy order_messages_admin on public.order_messages for all to authenticated using (public.is_admin()) with check (public.is_admin() and sent_by = auth.uid());

-- contact form: a logged-in user may post as themselves; only admins read
grant select, insert on public.contact_messages to authenticated;
create policy contact_insert on public.contact_messages for insert to authenticated with check (user_id = auth.uid());
create policy contact_admin_read on public.contact_messages for select to authenticated using (public.is_admin());

-- realtime: admin inbox + customer "my orders" (Realtime respects the policies above)
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.orders; exception when duplicate_object then null; end;
  end if;
end $$;

-- storage bucket for product photos (public read, admin write). Skipped automatically outside Supabase.
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('products', 'products', true, 2097152, array['image/webp','image/jpeg','image/png'])
    on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = excluded.allowed_mime_types;
    drop policy if exists "products_img_admin_write" on storage.objects;
    create policy "products_img_admin_write" on storage.objects for all to authenticated
      using (bucket_id = 'products' and public.is_admin()) with check (bucket_id = 'products' and public.is_admin());
  end if;
end $$;
