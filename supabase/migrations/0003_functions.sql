-- Dev-X Store · 0003 · server-side business rules (RPC). The browser never writes orders directly.

-- ---------- coupon check (customers can't read the coupons table) ----------
create or replace function public.validate_coupon(p_code text) returns int
language sql stable security definer set search_path = public as
$$ select percent from public.coupons where code = upper(trim(p_code)) and active $$;

-- ---------- create_order: one atomic transaction (order + items + stock + first event) ----------
create or replace function public.create_order(
  p_branch text, p_payment text, p_name text, p_phone text,
  p_governorate text, p_address text, p_notes text, p_coupon text, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public as
$$
declare
  uid   uuid := auth.uid();
  ph    text;
  nm    text := trim(coalesce(p_name, ''));
  v_pct int := 0;
  v_code text := null;
  v_sub numeric := 0;
  v_total numeric;
  v_order public.orders;
  v_email text;
  e     jsonb;
  pr    public.products;
  q     int;
  c     text;
  z     text;
  used  jsonb := '{}'::jsonb;
  n_lines int;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  perform pg_advisory_xact_lock(hashtext('create_order:' || uid::text));   -- serialises one user's orders (rate limit is race-free)

  if (select count(*) from public.orders where user_id = uid and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited';
  end if;

  if char_length(nm) < 3 or char_length(nm) > 80 then raise exception 'invalid_name'; end if;
  ph := translate(coalesce(p_phone, ''), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
  ph := regexp_replace(ph, '[\s\-+()]', '', 'g');
  ph := regexp_replace(ph, '^(00)?20', '0');
  if ph !~ '^01[0125][0-9]{8}$' then raise exception 'invalid_phone'; end if;
  if not exists (select 1 from public.branches where name = p_branch and active) then raise exception 'invalid_branch'; end if;
  if p_payment is null or p_payment not in ('InstaPay','فودافون كاش','أورنج كاش','e& money','فوري') then raise exception 'invalid_payment'; end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'empty_cart'; end if;
  n_lines := jsonb_array_length(p_items);
  if n_lines = 0 then raise exception 'empty_cart'; end if;
  if n_lines > 30 then raise exception 'too_many_items'; end if;

  if p_coupon is not null and trim(p_coupon) <> '' then
    v_code := upper(trim(p_coupon));
    select percent into v_pct from public.coupons where code = v_code and active;
    if v_pct is null then raise exception 'invalid_coupon'; end if;
  end if;

  select email into v_email from public.profiles where id = uid;

  -- lock the products in a fixed order (no deadlocks between concurrent orders)
  perform 1 from public.products
   where id in (select (x->>'product_id')::int from jsonb_array_elements(p_items) x where jsonb_typeof(x->'product_id') = 'number')
   order by id for update;

  insert into public.orders (user_id, customer_name, customer_phone, customer_email, governorate, address, notes,
                             branch, payment_method, coupon_code, discount_percent, subtotal, total)
  values (uid, nm, ph, v_email, left(nullif(trim(p_governorate), ''), 80), left(nullif(trim(p_address), ''), 300),
          left(nullif(trim(p_notes), ''), 500), p_branch, p_payment, v_code, coalesce(v_pct, 0), 0, 0)
  returning * into v_order;

  for e in select * from jsonb_array_elements(p_items) loop
    if jsonb_typeof(e->'product_id') <> 'number' or jsonb_typeof(e->'quantity') <> 'number' then raise exception 'invalid_item'; end if;
    q := (e->>'quantity')::numeric::int;
    if (e->>'quantity')::numeric <> q or q < 1 or q > 100 then raise exception 'invalid_quantity'; end if;

    select * into pr from public.products where id = (e->>'product_id')::int and active;
    if not found then raise exception 'product_unavailable'; end if;

    used := jsonb_set(used, array[pr.id::text], to_jsonb(coalesce((used->>pr.id::text)::int, 0) + q));
    if (used->>pr.id::text)::int > pr.stock then
      raise exception 'insufficient_stock' using detail = pr.name;
    end if;

    c := nullif(trim(coalesce(e->>'color', '')), '');
    z := nullif(trim(coalesce(e->>'size', '')), '');
    if jsonb_array_length(pr.colors) > 0 then
      if c is null then raise exception 'color_required' using detail = pr.name; end if;
      if not exists (select 1 from jsonb_array_elements(pr.colors) k where k->>'n' = c) then raise exception 'invalid_color' using detail = pr.name; end if;
    else c := null; end if;
    if jsonb_array_length(pr.sizes) > 0 then
      if z is null then raise exception 'size_required' using detail = pr.name; end if;
      if not (pr.sizes ? z) then raise exception 'invalid_size' using detail = pr.name; end if;
    else z := null; end if;

    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, color, size)
    values (v_order.id, pr.id, pr.name, pr.price, q, c, z);       -- price comes from the DB, never from the browser
    update public.products set stock = stock - q where id = pr.id;
    v_sub := v_sub + pr.price * q;
  end loop;

  v_total := round(v_sub * (100 - coalesce(v_pct, 0)) / 100.0, 2);
  update public.orders set subtotal = v_sub, total = v_total where id = v_order.id;
  insert into public.order_events (order_id, status, note, actor) values (v_order.id, 'new', 'تم استلام الطلب', uid);

  return jsonb_build_object('id', v_order.id, 'order_no', v_order.order_no, 'subtotal', v_sub,
                            'discount_percent', coalesce(v_pct, 0), 'total', v_total, 'status', 'new');
end $$;

-- put reserved stock back (used by cancel flows)
create or replace function public.restore_order_stock(p_order uuid) returns void
language sql security definer set search_path = public as
$$ update public.products p set stock = p.stock + s.q
     from (select product_id, sum(quantity) q from public.order_items where order_id = p_order and product_id is not null group by 1) s
    where p.id = s.product_id $$;

-- ---------- customer cancels own order (only while it is still new / being prepared) ----------
create or replace function public.cancel_my_order(p_order uuid) returns void
language plpgsql security definer set search_path = public as
$$
declare o public.orders;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into o from public.orders where id = p_order and user_id = auth.uid() for update;
  if not found then raise exception 'not_found'; end if;
  if o.status not in ('new', 'preparing') then raise exception 'cannot_cancel'; end if;
  perform public.restore_order_stock(o.id);
  update public.orders set status = 'cancelled' where id = o.id;
  insert into public.order_events (order_id, status, note, actor) values (o.id, 'cancelled', 'ألغاه العميل', auth.uid());
end $$;

-- ---------- admin moves an order along the allowed path ----------
create or replace function public.admin_set_order_status(p_order uuid, p_status text, p_note text default null) returns void
language plpgsql security definer set search_path = public as
$$
declare o public.orders; ok boolean;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'not_found'; end if;
  ok := case o.status
    when 'new'       then p_status in ('preparing', 'cancelled')
    when 'preparing' then p_status in ('contacted', 'cancelled')
    when 'contacted' then p_status in ('confirmed', 'cancelled')
    when 'confirmed' then p_status in ('delivered', 'cancelled')
    else false end;
  if not ok then raise exception 'invalid_transition' using detail = o.status || ' -> ' || coalesce(p_status, 'null'); end if;
  if p_status = 'cancelled' then perform public.restore_order_stock(o.id); end if;
  update public.orders set status = p_status where id = o.id;
  insert into public.order_events (order_id, status, note, actor) values (o.id, p_status, left(p_note, 300), auth.uid());
end $$;

-- ---------- customer deletes own account (orders stay, detached from the user) ----------
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as
$$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- ---------- contact form: max 5 messages / hour / user ----------
create or replace function public.contact_rate_limit() returns trigger language plpgsql security definer set search_path = public as
$$
begin
  if (select count(*) from public.contact_messages where user_id = new.user_id and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited';
  end if;
  return new;
end $$;
drop trigger if exists trg_contact_rate on public.contact_messages;
create trigger trg_contact_rate before insert on public.contact_messages for each row execute function public.contact_rate_limit();

-- ---------- who may call what (deny everything first, then open exactly what is needed) ----------
revoke all on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;            -- used inside RLS policies
grant execute on function public.validate_coupon(text) to authenticated;
grant execute on function public.create_order(text,text,text,text,text,text,text,text,jsonb) to authenticated;
grant execute on function public.cancel_my_order(uuid) to authenticated;
grant execute on function public.admin_set_order_status(uuid,text,text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
