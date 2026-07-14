# الکترون | Electron

پیش‌نمایش سایت وبلاگ سیاسی الکترون — ساخته‌شده با React + Vite + Tailwind CSS.

## اجرا روی سیستم خودتان

```bash
npm install
npm run dev
```

## دیپلوی (Cloudflare Pages)

1. این پوشه را در یک ریپازیتوری گیت‌هاب (GitHub) آپلود کنید.
2. وارد https://dash.cloudflare.com شوید → Workers & Pages → Create → Pages → Connect to Git.
3. ریپازیتوری خود را انتخاب کنید و تنظیمات زیر را وارد کنید:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. روی Save and Deploy بزنید. بعد از چند دقیقه، آدرسی مثل
   `https://electron-blog.pages.dev` در اختیارتان قرار می‌گیرد که از هر دستگاهی قابل مشاهده است.

## دیپلوی (GitHub Pages)

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
