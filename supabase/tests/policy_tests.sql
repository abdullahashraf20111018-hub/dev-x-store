-- Dev-X Store · Phase 6 step 1 · policy tests.
-- Two customers + one admin hit the real policies/functions. Every check must print PASS; any FAIL aborts.
\set ON_ERROR_STOP on
\set QUIET on
create or replace function pg_temp.as_user(uid uuid, r text default 'authenticated') returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', coalesce(uid::text,''), false); execute format('set role %I', r); end $$;
create or replace function pg_temp.reset() returns void language plpgsql as $$ begin reset role; perform set_config('request.jwt.claim.sub','',false); end $$;
create or replace function pg_temp.check(name text, ok boolean) returns void language plpgsql as $$
begin if ok then raise notice 'PASS  %', name; else raise exception 'FAIL  %', name; end if; end $$;
create or replace function pg_temp.fails(name text, stmt text, expect text default null) returns void language plpgsql as $$
begin
  begin execute stmt; exception when others then
    if expect is null or sqlerrm like '%'||expect||'%' then raise notice 'PASS  % (blocked: %)', name, left(sqlerrm,50); return; end if;
    raise exception 'FAIL  % (wrong error: %)', name, sqlerrm;
  end;
  raise exception 'FAIL  % (statement was allowed!)', name;
end $$;
-- valid cart line for product pid (first colour / first size when the product has them)
create or replace function pg_temp.it(pid int, q int) returns jsonb language sql stable as $$
  select jsonb_build_object('product_id',pid,'quantity',q,
    'color',(select c->>'n' from jsonb_array_elements(colors) c limit 1),
    'size',(select z from jsonb_array_elements_text(sizes) z limit 1)) from public.products where id=pid $$;
create or replace function pg_temp.mk(items jsonb, coupon text default null, phone text default '01012345678', branch text default 'The Best', pay text default 'InstaPay') returns jsonb
language plpgsql as $$ begin return public.create_order(branch,pay,'Alice Test',phone,'القاهرة','شارع 1','ملاحظة',coupon,items); end $$;

insert into auth.users (id, email, raw_user_meta_data) values
 ('11111111-1111-1111-1111-111111111111','alice@test.dev','{"full_name":"Alice","phone":"+201012345678"}'),
 ('22222222-2222-2222-2222-222222222222','bob@test.dev','{}'),
 ('99999999-9999-9999-9999-999999999999','admin@test.dev','{}');
insert into public.admins (user_id) values ('99999999-9999-9999-9999-999999999999');

\echo --- 0. signup trigger
select pg_temp.check('profile auto-created with name + normalised phone', (select full_name='Alice' and phone='01012345678' from public.profiles where id='11111111-1111-1111-1111-111111111111'));

\echo --- 1. anonymous visitor
select pg_temp.as_user(null,'anon');
select pg_temp.check('anon sees 38 active products', (select count(*) from public.products)=38);
select pg_temp.check('anon sees 14 branches', (select count(*) from public.branches)=14);
select pg_temp.fails('anon cannot read orders','select * from public.orders');
select pg_temp.fails('anon cannot read coupons','select * from public.coupons');
select pg_temp.fails('anon cannot read profiles','select * from public.profiles');
select pg_temp.fails('anon cannot read contact messages','select * from public.contact_messages');
select pg_temp.fails('anon cannot create order',$$select pg_temp.mk('[{"product_id":1,"quantity":1}]'::jsonb)$$);
select pg_temp.fails('anon cannot call create_order directly',$$select public.create_order('The Best','InstaPay','Ali Test','01012345678',null,null,null,null,'[{"product_id":1,"quantity":1}]'::jsonb)$$,'permission denied');
select pg_temp.fails('anon cannot update products','update public.products set price=1');
select pg_temp.fails('anon cannot insert products',$$insert into public.products (slug,name,category,price) values ('x','xx','كتب',1)$$);
select pg_temp.fails('anon cannot validate coupons','select public.validate_coupon(''DEVX10'')','permission denied');
select pg_temp.reset();

\echo --- 2. alice (customer) orders
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select pg_temp.check('alice validates coupon devx10 = 10%', public.validate_coupon('devx10')=10);
select pg_temp.check('bad coupon returns null', public.validate_coupon('NOPE') is null);
select pg_temp.check('alice sees 0 coupons (RLS)', (select count(*) from public.coupons)=0);
select pg_temp.fails('alice cannot add coupons',$$insert into public.coupons (code,percent) values ('FREE100',100)$$);
create temp table t_order as select pg_temp.mk(jsonb_build_array(pg_temp.it(1,2), pg_temp.it(3,1)),'DEVX10','+201012345678') as r;
grant select on t_order to public;
select pg_temp.check('total = (195*2 + 240) * 0.9 = 567', (select (r->>'total')::numeric from t_order)=567.00);
select pg_temp.check('alice sees exactly her order', (select count(*) from public.orders)=1);
select pg_temp.check('2 item rows with server prices', (select count(*) from public.order_items where unit_price in (195,240))=2);
select pg_temp.check('phone normalised to 01…', (select customer_phone from public.orders)='01012345678');
select pg_temp.check('order_no starts at 1001', (select order_no from public.orders)=1001);
select pg_temp.fails('alice cannot insert order directly',$$insert into public.orders (user_id,customer_name,customer_phone,branch,payment_method,subtotal,total) values ('11111111-1111-1111-1111-111111111111','xxx','01012345678','The Best','InstaPay',0,0)$$);
select pg_temp.fails('alice cannot insert order_items directly',$$insert into public.order_items (order_id,product_name,unit_price,quantity) select id,'x',0,1 from public.orders$$);
select pg_temp.fails('alice cannot edit order status directly',$$update public.orders set status='delivered'$$);
select pg_temp.fails('alice cannot self-promote to admin',$$insert into public.admins values ('11111111-1111-1111-1111-111111111111')$$);
update public.products set price = 1;
select pg_temp.check('alice cannot change a price (0 rows touched)', (select min(price) from public.products) > 1);
select pg_temp.fails('unknown product rejected',$$select pg_temp.mk('[{"product_id":9999,"quantity":1}]'::jsonb)$$,'product_unavailable');
select pg_temp.fails('quantity > stock rejected',$$select pg_temp.mk(jsonb_build_array(pg_temp.it(1,26)))$$,'insufficient_stock');
select pg_temp.fails('duplicate lines cannot bypass stock',$$select pg_temp.mk(jsonb_build_array(pg_temp.it(1,13), pg_temp.it(1,13)))$$,'insufficient_stock');
select pg_temp.fails('negative quantity rejected',$$select pg_temp.mk('[{"product_id":1,"quantity":-1}]'::jsonb)$$,'invalid_quantity');
select pg_temp.fails('fractional quantity rejected',$$select pg_temp.mk('[{"product_id":1,"quantity":1.5}]'::jsonb)$$,'invalid_quantity');
select pg_temp.fails('string quantity rejected',$$select pg_temp.mk('[{"product_id":1,"quantity":"1"}]'::jsonb)$$,'invalid_item');
select pg_temp.fails('bad phone rejected',$$select pg_temp.mk(jsonb_build_array(pg_temp.it(1,1)),null,'12345')$$,'invalid_phone');
select pg_temp.fails('size required for apparel',$$select pg_temp.mk(jsonb_build_array(jsonb_build_object('product_id',3,'quantity',1,'color','أسود فاحم')))$$,'size_required');
select pg_temp.fails('unknown size rejected',$$select pg_temp.mk(jsonb_build_array(jsonb_build_object('product_id',3,'quantity',1,'color','أسود فاحم','size','XXXL')))$$,'invalid_size');
select pg_temp.fails('unknown colour rejected',$$select pg_temp.mk(jsonb_build_array(jsonb_build_object('product_id',3,'quantity',1,'color','وردي','size','M')))$$,'invalid_color');
select pg_temp.fails('fake coupon rejected',$$select pg_temp.mk(jsonb_build_array(pg_temp.it(1,1)),'HACK')$$,'invalid_coupon');
select pg_temp.fails('unknown branch rejected',$$select pg_temp.mk(jsonb_build_array(pg_temp.it(1,1)),null,'01012345678','Nowhere')$$,'invalid_branch');
select pg_temp.fails('unknown payment rejected',$$select pg_temp.mk(jsonb_build_array(pg_temp.it(1,1)),null,'01012345678','The Best','Bitcoin')$$,'invalid_payment');
select pg_temp.fails('empty cart rejected',$$select pg_temp.mk('[]'::jsonb)$$,'empty_cart');
select pg_temp.fails('client-sent price field is ignored (not even accepted as a column)',$$select pg_temp.mk('[{"product_id":1,"quantity":1,"price":0.01}]'::jsonb)$$,'color_required');
select pg_temp.fails('alice cannot call admin status function',$$select public.admin_set_order_status((select id from public.orders limit 1),'preparing')$$,'forbidden');
select pg_temp.reset();
select pg_temp.check('stock decreased atomically (25→23)', (select stock from public.products where id=1)=23);
select pg_temp.check('failed attempts left no half-orders', (select count(*) from public.orders)=1);

\echo --- 3. bob (another customer) cannot reach alice data
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select pg_temp.check('bob sees 0 orders', (select count(*) from public.orders)=0);
select pg_temp.check('bob sees 0 order_items', (select count(*) from public.order_items)=0);
select pg_temp.check('bob sees 0 order_events', (select count(*) from public.order_events)=0);
select pg_temp.check('bob cannot read alice profile', (select count(*) from public.profiles where id='11111111-1111-1111-1111-111111111111')=0);
select pg_temp.fails('bob cannot cancel alice order',$$select public.cancel_my_order((select r->>'id' from t_order)::uuid)$$,'not_found');
update public.profiles set full_name='Hacked' where id='11111111-1111-1111-1111-111111111111';
select pg_temp.reset();
select pg_temp.check('bob update of alice profile touched 0 rows', (select full_name from public.profiles where id='11111111-1111-1111-1111-111111111111')='Alice');

\echo --- 4. admin
select pg_temp.as_user('99999999-9999-9999-9999-999999999999');
select pg_temp.check('admin sees alice order', (select count(*) from public.orders)=1);
select pg_temp.check('admin reads coupons', (select count(*) from public.coupons)=1);
select pg_temp.check('admin reads profiles', (select count(*) from public.profiles)>=3);
select pg_temp.fails('cannot skip steps new→confirmed',$$select public.admin_set_order_status((select id from public.orders limit 1),'confirmed')$$,'invalid_transition');
select pg_temp.fails('unknown status rejected',$$select public.admin_set_order_status((select id from public.orders limit 1),'shipped')$$,'invalid_transition');
select public.admin_set_order_status((select id from public.orders limit 1),'preparing');
select public.admin_set_order_status((select id from public.orders limit 1),'contacted');
select public.admin_set_order_status((select id from public.orders limit 1),'confirmed','تم التأكيد');
select public.admin_set_order_status((select id from public.orders limit 1),'delivered');
select pg_temp.fails('delivered is final',$$select public.admin_set_order_status((select id from public.orders limit 1),'cancelled')$$,'invalid_transition');
select pg_temp.check('5 events logged (new + 4 moves)', (select count(*) from public.order_events)=5);
select pg_temp.check('events record the admin as actor', (select count(*) from public.order_events where actor='99999999-9999-9999-9999-999999999999')=4);
update public.products set stock = 5 where id = 2;
select pg_temp.check('admin can edit products', (select stock from public.products where id=2)=5);
insert into public.coupons (code, percent) values ('SALE20',20);
select pg_temp.check('admin can add coupon', (select count(*) from public.coupons)=2);
insert into public.order_messages (order_id, channel, body, sent_by) select id,'whatsapp','hello','99999999-9999-9999-9999-999999999999' from public.orders;
select pg_temp.check('admin logs a contact attempt', (select count(*) from public.order_messages)=1);
select pg_temp.fails('admin cannot log contact as someone else',$$insert into public.order_messages (order_id, channel, sent_by) select id,'email','11111111-1111-1111-1111-111111111111' from public.orders$$);
insert into public.products (slug,name,category,price,stock) values ('dx-test','منتج تجريبي','كتب',10,3);
select pg_temp.check('admin can add a product', (select count(*) from public.products where slug='dx-test')=1);
update public.products set active=false where slug='dx-test';
select pg_temp.reset();
select pg_temp.as_user(null,'anon');
select pg_temp.check('hidden product invisible to visitors', (select count(*) from public.products where slug='dx-test')=0);
select pg_temp.reset();

\echo --- 5. cancel returns stock
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
create temp table t2 as select pg_temp.mk(jsonb_build_array(pg_temp.it(2,2))) as r;
grant select on t2 to public;
select pg_temp.reset();
select pg_temp.check('stock 5→3 after order', (select stock from public.products where id=2)=3);
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select public.cancel_my_order((select (r->>'id')::uuid from t2));
select pg_temp.fails('cannot cancel a delivered order',$$select public.cancel_my_order((select r->>'id' from t_order)::uuid)$$,'cannot_cancel');
select pg_temp.reset();
select pg_temp.check('stock restored 3→5 after cancel', (select stock from public.products where id=2)=5);
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
create temp table t3 as select pg_temp.mk(jsonb_build_array(pg_temp.it(2,1))) as r;
grant select on t3 to public;
select pg_temp.reset();
select pg_temp.as_user('99999999-9999-9999-9999-999999999999');
select public.admin_set_order_status((select (r->>'id')::uuid from t3),'cancelled','نفد');
select pg_temp.reset();
select pg_temp.check('admin cancel also restores stock', (select stock from public.products where id=2)=5);

\echo --- 6. rate limit (5 orders / hour)
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
do $$ begin for i in 1..5 loop perform pg_temp.mk(jsonb_build_array(pg_temp.it(13,1))); end loop; end $$;
select pg_temp.fails('6th order within the hour is blocked',$$select pg_temp.mk(jsonb_build_array(pg_temp.it(13,1)))$$,'rate_limited');
select pg_temp.reset();

\echo --- 7. contact form
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
insert into public.contact_messages (user_id,name,phone,topic,message) values ('11111111-1111-1111-1111-111111111111','Alice','01012345678','استفسار','hello there');
select pg_temp.fails('cannot post contact as someone else',$$insert into public.contact_messages (user_id,name,phone,topic,message) values ('22222222-2222-2222-2222-222222222222','Alice','01012345678','x','hello there')$$);
select pg_temp.check('customer sees 0 contact messages (RLS)', (select count(*) from public.contact_messages)=0);
do $$ begin for i in 1..4 loop insert into public.contact_messages (user_id,name,phone,topic,message) values ('11111111-1111-1111-1111-111111111111','Alice','01012345678','x','hello there'); end loop; end $$;
select pg_temp.fails('6th contact message in an hour is blocked',$$insert into public.contact_messages (user_id,name,phone,topic,message) values ('11111111-1111-1111-1111-111111111111','Alice','01012345678','x','hello there')$$,'rate_limited');
select pg_temp.reset();
select pg_temp.as_user('99999999-9999-9999-9999-999999999999');
select pg_temp.check('admin reads contact messages', (select count(*) from public.contact_messages)=5);
select pg_temp.reset();

\echo --- 8. profile self-service + account deletion keeps order records
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
update public.profiles set full_name='Alice B', addresses='[{"t":"البيت","a":"شارع 1"}]'::jsonb where id=auth.uid();
select pg_temp.check('alice edits own profile', (select full_name='Alice B' from public.profiles where id=auth.uid()));
select pg_temp.fails('alice cannot change profile email column',$$update public.profiles set email='x@y.z' where id=auth.uid()$$,'permission denied');
select public.delete_my_account();
select pg_temp.reset();
select pg_temp.check('alice user + profile gone', (select count(*) from auth.users where id='11111111-1111-1111-1111-111111111111')=0
   and (select count(*) from public.profiles where id='11111111-1111-1111-1111-111111111111')=0);
select pg_temp.check('her orders remain (user_id null)', (select count(*) from public.orders where user_id is null)=3);
select pg_temp.check('her order items remain', (select count(*) from public.order_items)>=3);
\echo ALL CHECKS PASSED
