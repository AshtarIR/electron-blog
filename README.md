# الکترون | Electron

پیش‌نمایش سایت وبلاگ سیاسی الکترون — ساخته‌شده با React + Vite + Tailwind CSS + Supabase (دیتابیس و ورود امن).

## ۱) راه‌اندازی Supabase (دیتابیس واقعی)

> ⚠️ اگر قبلاً یک‌بار `sql/schema.sql` نسخه‌ی قدیمی رو اجرا کرده‌ای (دسته‌بندی تکی، محتوا به‌صورت آرایه پاراگراف)، **این فایل رو دوباره اجرا نکن**. به‌جاش فقط یک‌بار `sql/migrate_to_v2.sql` رو تو SQL Editor اجرا کن تا جدولت بدون از دست‌دادن داده، به مدل جدید (چند دسته‌بندی برای هر مقاله + ادیتور متن‌غنی) ارتقا پیدا کنه.

1. برو به https://supabase.com و یک پروژه‌ی رایگان بساز.
2. داخل پروژه: **SQL Editor** → **New query** → کل محتوای فایل `sql/schema.sql` را کپی و اجرا کن.
   این کار جدول `articles` و قوانین امنیتی (RLS) را می‌سازد. سایت هیچ مقاله‌ی نمونه‌ای در کد ندارد؛ همه‌چیز از همین جدول می‌آید.
3. برای آپلود تصویر کاور مقالات، یک **New query** دیگر باز کن و کل محتوای فایل
   `sql/storage_setup.sql` را اجرا کن. این یک باکت عمومی به‌نام `covers` می‌سازد
   (یا اگر ترجیح می‌دهی دستی انجام بدهی: **Storage → Create bucket → نام: covers → Public**).
3. **Authentication → Users → Add user** یک حساب ادمین برای خودت بساز (ایمیل + رمز عبور).
   این تنها راه ورود به پنل مدیریت است — کاربر عمومی نمی‌تواند ثبت‌نام کند.
4. **Settings → API** را باز کن و دو مقدار را کپی کن:
   - `Project URL`
   - `anon public` key

## ۲) اتصال پروژه به Supabase

```bash
cp .env.example .env
```
مقادیر بالا را داخل `.env` جای‌گذاری کن:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
```

## ۳) اجرا روی سیستم خودتان

```bash
npm install
npm run dev
```
حالا صفحه‌ی `/admin` را باز کن، با ایمیل/رمزی که در Supabase ساختی وارد شو، و یک مقاله بساز — بلافاصله برای همه‌ی بازدیدکننده‌ها (روی هر دستگاهی) قابل مشاهده خواهد بود.

## ۴) دیپلوی (Cloudflare Pages)

1. این پوشه را در یک ریپازیتوری گیت‌هاب (GitHub) آپلود کنید.
2. وارد https://dash.cloudflare.com شوید → Workers & Pages → Create → Pages → Connect to Git.
3. ریپازیتوری خود را انتخاب کنید و تنظیمات زیر را وارد کنید:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. در بخش **Settings → Environment variables** همان دو مقدار `VITE_SUPABASE_URL` و
   `VITE_SUPABASE_ANON_KEY` را اضافه کن (همان‌هایی که در `.env` گذاشتی).
5. روی Save and Deploy بزنید. بعد از چند دقیقه، آدرسی مثل
   `https://electron-blog.pages.dev` در اختیارتان قرار می‌گیرد که از هر دستگاهی قابل مشاهده است.

## دیپلوی (GitHub Pages) — روش جایگزین

اگر ترجیح می‌دهید از GitHub Pages استفاده کنید:

```bash
npm install --save-dev gh-pages
```

در `package.json` اضافه کنید:
```json
"homepage": "https://<username>.github.io/<repo-name>",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

سپس:
```bash
npm run deploy
```

⚠️ توجه: GitHub Pages به‌صورت پیش‌فرض متغیرهای محیطی (env vars) را در build نمی‌گذارد؛ باید مقادیر Supabase را از طریق GitHub Actions secrets تزریق کنی، یا از Cloudflare Pages استفاده کنی که ساده‌تر است.

## صفحه ۴۰۴ و مدیریت خطا

این پروژه شامل:
- `public/404.html` — صفحه‌ی برندشده‌ای که Cloudflare Pages به‌صورت خودکار برای هر مسیر نامعتبر نشان می‌دهد (نیازی به تنظیم اضافه نیست).
- یک **Error Boundary** در سطح کل اپ — اگر جایی از React کرش کند، به‌جای صفحه‌ی سفید خالی، یک پیام قابل‌فهم با دکمه‌ی «بارگذاری مجدد» نشان داده می‌شود.
- وضعیت‌های مجزا برای «در حال بارگذاری»، «هنوز مقاله‌ای نیست»، و «خطا در اتصال به دیتابیس» (با دکمه‌ی تلاش دوباره) در صفحه‌ی اصلی.
- یک پیام «این مقاله پیدا نشد» وقتی کسی به شناسه‌ی مقاله‌ای که حذف شده یا وجود ندارد مراجعه کند.
