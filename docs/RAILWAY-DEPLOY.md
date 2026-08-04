# Deploying Platter to Railway

Next.js 16 runs on Railway as a long-lived Node server (`next start`, which binds to Railway's `$PORT`). `railway.json` pins the build (Nixpacks) and start command. Everything is dynamically rendered, so no edge/ISR config is needed.

## 1. Env vars (set these in Railway → Variables)

**Important:** the `NEXT_PUBLIC_*` values are inlined into the client bundle **at build time**, so they must be set in Railway *before* the first build.

```
NEXT_PUBLIC_SUPABASE_URL=https://bnyadozvvyzlzwnelrfu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJueWFkb3p2dnl6bHp3bmVscmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NjkyNjksImV4cCI6MjEwMTQ0NTI2OX0.qIvnexWbPbQug0d-Trq3W9bcq7j1I_SHE9WtrqV5_VA
NEXT_PUBLIC_SITE_URL=https://<your-railway-domain>       # set to the domain Railway gives you
SUPABASE_SERVICE_ROLE_KEY=                               # optional; paste from Supabase → Settings → API when needed (M5 import)
RESTAURANT_WHATSAPP=+234...
```

## 2. Deploy (two ways)

### A. From GitHub (recommended)
1. Push this repo to GitHub.
2. Railway → **New Project → Deploy from GitHub repo** → pick it.
3. Add the variables above. Railway auto-detects Next.js and runs `npm run build` → `npm run start`.
4. Railway assigns a domain (Settings → Networking → Generate Domain). Put that domain in `NEXT_PUBLIC_SITE_URL` and redeploy.

### B. From the CLI (no GitHub)
```bash
npm i -g @railway/cli
railway login
railway init            # in this folder
railway up              # uploads + builds
# then set variables in the dashboard (or: railway variables --set KEY=VALUE) and redeploy
```

## 3. Point Supabase Auth at the deployed domain (required for login)

Supabase → **Authentication → URL Configuration**:
- **Site URL:** `https://<your-railway-domain>`
- **Redirect URLs:** add `https://<your-railway-domain>/auth/callback`

Without this, magic-link sign-in redirects to `localhost`.

## 4. After it's live
- Confirm `https://<domain>/menu` loads and `/admin/login` works.
- Update `NEXT_PUBLIC_SITE_URL` to the final domain (canonical URLs, OG images, sitemap use it).
- Generate the QR from **Admin → QR** (it now encodes the real domain) and print the table tents.

> Note: the schema chose Vercel originally (`foundation.md §7 #4`); Railway is the deploy target now. Both work — Railway just runs it as a Node server.
