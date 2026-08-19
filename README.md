# Trovara Shop (Accounts)

Customer Accounts SPA for **https://shop.trovara.farm**. Looks like Trovara OS
(operations chrome). It is **not** Trovara OS and is **not** published on Netlify.

Staff login stays on os.trovara.farm. The farm marketing site (trovara.farm)
links here and 301s old `/shop` paths.

## Local

Requires Node 22. The shop API is Trovara OS `trovara-api` on `127.0.0.1:3000`.

```bash
nvm use 22
npm ci
npm run dev          # http://127.0.0.1:5174
```

Vite proxies `/shop` JSON to the OS API. GET aliases (`/shop`, `/shop/verify-email`,
`/shop/reset-password`) still render this SPA.

## Production

Second CloudPanel site on the same VPS as OS:

- Web root: `/home/trovara-os/htdocs/shop.trovara.farm`
- nginx: [`docs/nginx-shop.trovara.farm.conf.example`](./docs/nginx-shop.trovara.farm.conf.example)
- Deploy: `./deploy.sh` (this repo only — do not run from `trovara-os`)

OS production `.env` still needs `PUBLIC_SHOP_URL=https://shop.trovara.farm` and
`https://shop.trovara.farm` in `CORS_ORIGIN` so verify/reset/order emails and
cookies work. That API config is not this frontend.
