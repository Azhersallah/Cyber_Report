# PPro Cloudflare Workers API

## دامەزراندن

```bash
cd pppro-cloudflare
npm install
```

## چوونەژوورەوە بۆ Cloudflare

```bash
npx wrangler login
```

## ناردنی Secrets (Environment Variables)

```bash
# Firebase Service Account JSON
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT
# پاشان JSON ەکە paste بکە

# License Token Secret
npx wrangler secret put LICENSE_TOKEN_SECRET
# پاشان secret key ێک بنووسە
```

## تاقیکردنەوەی لۆکاڵ

```bash
npm run dev
```

## دیپلۆی کردن

```bash
npm run deploy
```

## URL ی API

دوای دیپلۆی، URL ەکەت دەبێتە:
```
https://pppro-api.<your-subdomain>.workers.dev
```

## سنورەکان (فری)

- **100,000 request / ڕۆژ**
- **~3,000,000 request / مانگ**
