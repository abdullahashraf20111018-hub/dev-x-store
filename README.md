# Dev-X Book Store — من Demo إلى متجر حقيقي

تحويل `DEV-X-BOOK-STORE_v12.html` إلى متجر متكامل بتكلفة صفر: **Cloudflare Pages + Supabase + Resend**، بنفس الشكل والهوية (خلفية بيضاء ← نص كحلي، خلفية كحلية ← نص أبيض).

## هيكل المشروع
```
index.html            واجهة المتجر (الزائر/العميل)
admin.html            لوحة الأدمن (صفحة منفصلة، محمية بالدخول الحقيقي + RLS)
assets/css|js|img|fonts|products   الأنماط والسكريبتات والصور (WebP) والخط
  js/config.js        ← الإعدادات العامة (رابط Supabase + anon key) — الملف الوحيد الذي تعدّله
  js/api.js           كل الاتصال بـSupabase
  js/app.js           واجهة المتجر
  js/admin.js         لوحة الأدمن
data/                 products.json / branches.json (مصدر البيانات الأصلي + بديل للعرض)
supabase/migrations   0001 جداول · 0002 RLS · 0003 دوال الطلب · 0004 بيانات أولية
supabase/functions/order-confirm-email   إيميل التأكيد (Resend)
supabase/tests        اختبار السياسات (Postgres حقيقي) — 78 فحص
tests/e2e             اختبارات المتصفح للمتجر والأدمن (Playwright)
archive/              النسخة الأصلية v12 (baseline) — لا تُعدَّل
scripts/optimize_products.py   تحويل صور 4K إلى WebP
_headers · robots.txt · .github/workflows   النشر والأمان والـCI
docs/                 SETUP.md · ADMIN_GUIDE.md · TEST_REPORT.md
```

## ما الذي اتغيّر عن الـDemo
| قبل (v12) | بعد |
|---|---|
| OTP وهمي `123456` ودخول Google/Facebook تمثيلي | دخول Google حقيقي + رمز على الإيميل (Supabase Auth)؛ حُذف Facebook وكلمات المرور |
| كلمة سر الأدمن في الواجهة | الأدمن = حساب حقيقي موجود في جدول `admins` + RLS |
| الطلبات والمنتجات في localStorage | قاعدة بيانات Postgres؛ الطلب يُنشأ بدالة `create_order` واحدة (سعر/مخزون/كوبون من الخادم) |
| `/api/v1/...` غير موجودة | حُذفت — لا توجد استدعاءات لواجهات غير موجودة |

## تشغيل سريع
اتبع `docs/SETUP.md` (≈ 30–45 دقيقة). باختصار: ارفع على GitHub ← أنشئ مشروع Supabase وشغّل الـ4 migrations ← ضع الرابط والـanon key في `config.js` ← فعّل Google/Email Auth ← أضف نفسك في `admins` ← اربط المستودع بـCloudflare Pages (بدون Build).

## الاختبار
```
sudo bash supabase/tests/run_local.sh            # قاعدة البيانات + RLS (يحتاج postgresql)
cd tests/e2e && node e2e_store.js && node e2e_admin.js   # المتصفح (يحتاج playwright)
```
