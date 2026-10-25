# تقرير الاختبار — 2026-10-25

## 1) قاعدة البيانات والسياسات (Postgres 16 حقيقي) — 78 فحصًا، 0 فشل
عميلان + أدمن + زائر ضد السياسات والدوال الفعلية (`supabase/tests/policy_tests.sql`):
- الزائر: يقرأ المنتجات والفروع فقط؛ لا طلبات/كوبونات/ملفات/رسائل؛ لا يستدعي `create_order`.
- العميل: لا يقرأ طلب غيره ولا يعدّل حالة أو سعر؛ لا يصبح أدمن؛ السعر دائمًا من قاعدة البيانات؛ حقول سعر العميل لا تُقبل.
- التحقق في الخادم: كمية/مخزون (ومحاولة التفاف بتكرار السطور)، كمية سالبة/كسرية/نصية، موبايل، مقاس/لون، كوبون، فرع، دفع، سلة فارغة.
- الحالات: لا قفز بين الحالات، «تم التسليم» نهائي، سجل الأحداث يسجّل المنفّذ، الإلغاء يُرجع المخزون (عميل وأدمن).
- حدود: 5 طلبات/ساعة و5 رسائل/ساعة. حذف الحساب يُبقي الطلبات بلا ربط بالمستخدم.

```
--- 0. signup trigger
PASS  profile auto-created with name + normalised phone
--- 1. anonymous visitor
PASS  anon sees 38 active products
PASS  anon sees 14 branches
PASS  anon cannot read orders (blocked: permission denied for table orders)
PASS  anon cannot read coupons (blocked: permission denied for table coupons)
PASS  anon cannot read profiles (blocked: permission denied for table profiles)
PASS  anon cannot read contact messages (blocked: permission denied for table contact_messages)
PASS  anon cannot create order (blocked: permission denied for function create_order)
PASS  anon cannot call create_order directly (blocked: permission denied for function create_order)
PASS  anon cannot update products (blocked: permission denied for table products)
PASS  anon cannot insert products (blocked: permission denied for table products)
PASS  anon cannot validate coupons (blocked: permission denied for function validate_coupon)
--- 2. alice (customer) orders
PASS  alice validates coupon devx10 = 10%
PASS  bad coupon returns null
PASS  alice sees 0 coupons (RLS)
PASS  alice cannot add coupons (blocked: new row violates row-level security policy for tab)
PASS  total = (195*2 + 240) * 0.9 = 567
PASS  alice sees exactly her order
PASS  2 item rows with server prices
PASS  phone normalised to 01…
PASS  order_no starts at 1001
PASS  alice cannot insert order directly (blocked: permission denied for table orders)
PASS  alice cannot insert order_items directly (blocked: permission denied for table order_items)
PASS  alice cannot edit order status directly (blocked: permission denied for table orders)
PASS  alice cannot self-promote to admin (blocked: permission denied for table admins)
PASS  alice cannot change a price (0 rows touched)
PASS  unknown product rejected (blocked: product_unavailable)
PASS  quantity > stock rejected (blocked: insufficient_stock)
PASS  duplicate lines cannot bypass stock (blocked: insufficient_stock)
PASS  negative quantity rejected (blocked: invalid_quantity)
PASS  fractional quantity rejected (blocked: invalid_quantity)
PASS  string quantity rejected (blocked: invalid_item)
PASS  bad phone rejected (blocked: invalid_phone)
PASS  size required for apparel (blocked: size_required)
PASS  unknown size rejected (blocked: invalid_size)
PASS  unknown colour rejected (blocked: invalid_color)
PASS  fake coupon rejected (blocked: invalid_coupon)
PASS  unknown branch rejected (blocked: invalid_branch)
PASS  unknown payment rejected (blocked: invalid_payment)
PASS  empty cart rejected (blocked: empty_cart)
PASS  client-sent price field is ignored (not even accepted as a column) (blocked: color_required)
PASS  alice cannot call admin status function (blocked: forbidden)
PASS  stock decreased atomically (25→23)
PASS  failed attempts left no half-orders
--- 3. bob (another customer) cannot reach alice data
PASS  bob sees 0 orders
PASS  bob sees 0 order_items
PASS  bob sees 0 order_events
PASS  bob cannot read alice profile
PASS  bob cannot cancel alice order (blocked: not_found)
PASS  bob update of alice profile touched 0 rows
--- 4. admin
PASS  admin sees alice order
PASS  admin reads coupons
PASS  admin reads profiles
PASS  cannot skip steps new→confirmed (blocked: invalid_transition)
PASS  unknown status rejected (blocked: invalid_transition)
PASS  delivered is final (blocked: invalid_transition)
PASS  5 events logged (new + 4 moves)
PASS  events record the admin as actor
PASS  admin can edit products
PASS  admin can add coupon
PASS  admin logs a contact attempt
PASS  admin cannot log contact as someone else (blocked: new row violates row-level security policy for tab)
PASS  admin can add a product
PASS  hidden product invisible to visitors
--- 5. cancel returns stock
PASS  stock 5→3 after order
PASS  cannot cancel a delivered order (blocked: cannot_cancel)
PASS  stock restored 3→5 after cancel
PASS  admin cancel also restores stock
--- 6. rate limit (5 orders / hour)
PASS  6th order within the hour is blocked (blocked: rate_limited)
--- 7. contact form
PASS  cannot post contact as someone else (blocked: new row violates row-level security policy for tab)
PASS  customer sees 0 contact messages (RLS)
PASS  6th contact message in an hour is blocked (blocked: rate_limited)
PASS  admin reads contact messages
--- 8. profile self-service + account deletion keeps order records
PASS  alice edits own profile
PASS  alice cannot change profile email column (blocked: permission denied for table profiles)
PASS  alice user + profile gone
PASS  her orders remain (user_id null)
PASS  her order items remain
ALL CHECKS PASSED
```

## 2) المتجر في المتصفح (Chromium + Supabase تجريبي) — 40 فحصًا، 0 فشل، CSP الصارم مفعّل
- logged-out visitor lands on login
- no fake OTP / Facebook / password UI left
- no code leaks into the login page
- browsing without login is blocked
- invalid e-mail rejected before any request
- code requested for lower-cased e-mail
- wrong code keeps user out
- correct code logs in → home
- products rendered from the API (4 cards on home)
- admin link hidden for customers
- catalogue shows all 38 products
- product images are local webp
- apparel needs size before adding
- apparel added with colour+size
- bad coupon rejected by server
- coupon DEVX10 validated through RPC (−10%)
- 14 branches from API
- branch choice stored
- empty checkout form blocked
- bad phone blocked client-side
- order sent as RPC with normalised phone
- browser sends NO price fields to the server
- server total (240×0.9=216) shown on confirmation
- cart cleared + coupon reset after order
- stock decreased in catalogue data
- profile phone saved for next time
- my orders lists the server order (#1001)
- tracking page shows order number
- customer can cancel; stock restored
- profile name saved
- address saved in profile
- contact message stored for the logged-in user
- session survives reload → straight to the store
- logout returns to login & clears orders
- signup validates name first
- signup requires terms
- signup sends name+phone as metadata for the profile trigger
- signup completes and enters the store
- no horizontal scroll on mobile
- no JS errors during the whole run

## 3) لوحة الأدمن — 24 فحصًا، 0 فشل
- visitor sees only a login box (no data)
- logged-in non-admin is denied
- denied page shows no orders
- admin enters dashboard shell
- inbox lists the order
- search filters out non-matches
- details show items + customer
- WhatsApp link is wa.me/20… with order number
- whatsapp contact is logged in order_messages
- only the next step + cancel are offered
- status moved to preparing via RPC
- email button sends via Edge Function
- email function got only the order id
- admin cancel restores stock (3→4)
- realtime: new order appears without reload + toast
- product edit saved (stock 40, price 250)
- image compressed to webp and uploaded to storage
- new product inserted with only the valid colour
- invalid coupon code refused client-side
- coupon added upper-cased
- contact messages visible to admin
- dashboard renders stats
- admin has no horizontal page scroll on mobile
- no JS errors

## 4) حدود هذا الاختبار (للشفافية)
- لم يُختبر ضد مشروع Supabase حي (لا حساب/شبكة في بيئة التطوير): اختبارات المتصفح تستخدم محاكيًا لواجهة supabase-js، واختبارات RLS تعمل على Postgres حقيقي بمحاكاة بسيطة لـ`auth`. **شغّل قائمة «قبل الإطلاق» في SETUP.md على مشروعك الحي.**
- لم يُشغَّل Lighthouse ولا اختبار Resend/Google/Turnstile الحقيقي؛ وكود Edge Function فُحص نحويًا فقط.
- فحص الأسرار: مسح نصي نظيف (لا مفاتيح)؛ شغّل gitleaks على تاريخ المستودع (مُضاف في CI).
