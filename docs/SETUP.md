# دليل الإعداد خطوة بخطوة

> الأسرار (service_role، مفتاح Resend، كلمة سر قاعدة البيانات، Google Client Secret) **لا توضع في أي ملف أو Commit** — فقط في Supabase/Cloudflare.

## 1) GitHub (المرحلة 1)
1. أنشئ مستودعًا **Private** وارفع محتوى هذا المجلد. أول Commit: `baseline v12` (النسخة الأصلية موجودة في `archive/`).
2. فعّل GitHub Actions: سيشغّل اختبارات قاعدة البيانات وفحص الأسرار (gitleaks) تلقائيًا.

## 2) Supabase (المرحلة 2)
1. supabase.com ← New project باسم `devx-store` في أقرب منطقة. احفظ كلمة سر القاعدة في مدير كلمات السر.
2. SQL Editor: شغّل بالترتيب محتوى `supabase/migrations/0001…0004`. (أو `supabase db push` عبر الـCLI.)
3. تحقق: Table Editor يعرض 38 منتجًا و14 فرعًا وكوبون `DEVX10`.
4. Settings ← API: انسخ `Project URL` و`anon public key` إلى `assets/js/config.js`. **لا تنسخ `service_role`.**
5. Storage: يوجد bucket `products` (أُنشئ تلقائيًا بالـmigration 0002) — عام للقراءة، الكتابة للأدمن فقط.

## 3) تسجيل الدخول (المرحلة 3)
**Google:** Google Cloud Console ← APIs & Services ← Credentials ← OAuth client (Web). Authorized redirect URI = `https://<project>.supabase.co/auth/v1/callback`. انسخ Client ID/Secret إلى Supabase ← Authentication ← Providers ← Google ← Enable.
**الإيميل:** Authentication ← Providers ← Email ← فعّل. (الرمز المرسل 6 أرقام؛ عدّل قالب الرسالة من Auth ← Email Templates وأضف `{{ .Token }}`.)
**الروابط:** Authentication ← URL Configuration: `Site URL` = رابط موقعك على pages.dev (ثم نطاقك لاحقًا) وأضفه أيضًا في Redirect URLs.
**الحد المجاني للإيميل:** خدمة Supabase المدمجة محدودة جدًا؛ اربط Resend كـSMTP (Auth ← SMTP Settings: `smtp.resend.com`, المستخدم `resend`, كلمة السر = مفتاح Resend) لإرسال رموز الدخول بثبات.

## 4) أول أدمن (المرحلة 5)
سجّل دخولك مرة واحدة في المتجر بإيميلك ثم نفّذ في SQL Editor:
```sql
insert into public.admins (user_id) select id from auth.users where email = 'your@email.com';
```
بعدها افتح `/admin.html` وسجّل الدخول بنفس الحساب. لا توجد طريقة لإضافة أدمن من المتصفح.

## 5) إيميل التأكيد (Resend)
1. resend.com ← أضف نطاقك وتحقق منه (أو استخدم `onboarding@resend.dev` للتجربة فقط) ← أنشئ API key.
2. ```
   supabase functions deploy order-confirm-email
   supabase secrets set RESEND_API_KEY=re_xxx MAIL_FROM="Dev-X <orders@yourdomain.com>"
   ```
3. من لوحة الأدمن: افتح الطلب ← «إرسال إيميل تأكيد» (أو بعد تحويل الحالة إلى «مؤكد»).

## 6) الحماية من الرسائل المزعجة (المرحلة 6)
1. Cloudflare ← Turnstile ← أضف موقعًا ← انسخ **Site key** إلى `config.js` (`TURNSTILE_SITE_KEY`) و**Secret key** إلى Supabase ← Authentication ← Attack Protection ← Enable CAPTCHA (Turnstile).
2. الحدود داخل قاعدة البيانات تعمل دائمًا: 5 طلبات/ساعة و5 رسائل تواصل/ساعة لكل مستخدم.
3. افحص المستودع: `gitleaks detect` (يعمل أيضًا في GitHub Actions).

## 7) النشر (المرحلة 7)
Cloudflare Pages ← Connect to Git ← اختر المستودع ← **Framework: None، Build command: فارغ، Output directory: `/`**. ملف `_headers` يطبّق CSP وبقية رؤوس الأمان تلقائيًا. فعّل Web Analytics من لوحة Pages.
بعد النشر حدّث `Site URL` في Supabase بالرابط النهائي.

## 8) النسخ الاحتياطي
الخطة المجانية لا تتضمن نسخًا مجدولة: نفّذ أسبوعيًا `supabase db dump -f backup.sql` (أو Dashboard ← Database ← Backups إن توفّر) واحفظه خارج المستودع. صور المنتجات المرفوعة في Storage تُنسخ يدويًا.

## 9) قبل الإطلاق (قائمة)
- [ ] طلب تجريبي كامل من حساب غير الأدمن، ثم تأكيده وإرسال واتساب وإيميل.
- [ ] تشغيل `supabase/tests/run_local.sh` → `ALL CHECKS PASSED`.
- [ ] Lighthouse على الموبايل (الهدف ≥ 90) واختبار الوضعين الفاتح/الداكن وRTL.
- [ ] مراجعة صفحات أسعار Supabase/Resend/Cloudflare (الحدود المجانية قد تتغير).
