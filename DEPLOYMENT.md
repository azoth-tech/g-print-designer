# Cloudflare Workers Deployment Guide

## Overview

This project uses **OpenNext** to deploy to Cloudflare Workers, which resolves the `async_hooks` compatibility issue with Next.js 15 and Cloudflare Pages.

---

## GitHub Auto-Deploy Setup (Recommended)

### Step 1: Create Worker & Connect GitHub

1. Go to **Cloudflare Dashboard** → **Workers & Pages** → **Create**
2. Select **"Connect to Git"**
3. Authorize your repository
4. Select the `g-print-designer` repository
5. Select the `AISupport` branch

### Step 2: Configure Build Settings

In the deployment settings, set:

| Setting | Value |
|---------|-------|
| **Framework preset** | `None` |
| **Build command** | `npm run cf:build` |
| **Build output directory** | `.open-next` |

### Step 3: Add Environment Variables

Go to **Settings** → **Variables** → **Add variable**:

| Variable | Value |
|----------|-------|
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID (from Dashboard URL) |
| `CLOUDFLARE_API_TOKEN` | API token with Workers AI permissions |

**To get credentials:**
- **Account ID**: Dashboard URL: `https://dash.cloudflare.com/{account-id}/`
- **API Token**: My Profile → API Tokens → Create → Template "Edit Cloudflare Workers" → Include `Workers AI` permission

### Step 4: Save & Deploy

Click **"Save and Deploy"**.

**That's it!** Every push to `AISupport` branch will auto-deploy.

---

## Manual Deployment (Alternative)

If you prefer CLI deployment:

```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Login (one-time)
wrangler login

# 3. Deploy
npm run cf:deploy
```

---

## Local Development

### Preview Locally
```bash
npm run cf:preview
```

### Test API Route
```bash
curl -X POST http://localhost:8787/api/proxy-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a red t-shirt with a star"}'
```

---

## Troubleshooting

### Error: "No such module __next-on-pages-dist__/functions/api/async_hooks"

**Cause**: Cloudflare Pages auto-detection is using deprecated `next-on-pages`

**Solution**: Use Workers (this guide) instead of Pages

### Error: "Invalid API token"

**Solution**:
1. Regenerate API token
2. Ensure it has `Workers AI` permissions
3. Update in Cloudflare Dashboard → Settings → Variables

### Error: "Account ID not found"

**Solution**:
1. Get correct ID from Dashboard URL: `https://dash.cloudflare.com/{account-id}/`
2. Update environment variable

### Build fails with type errors

**Solution**:
```bash
npm run lint
npx tsc --noEmit
```

Fix any TypeScript errors, then commit and redeploy.

---

## Deployment Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run cf:build` | Build with OpenNext only |
| `npm run cf:preview` | Build + local preview |
| `npm run cf:deploy` | Build + deploy to Workers |
| `npm run cf:types` | Generate Cloudflare types |

---

## Manual Deployment (without Git integration)

If you prefer CLI-only deployment:

```bash
# 1. Build
npm run cf:build

# 2. Deploy
wrangler deploy

# 3. Check deployment
wrangler deploy --dry-run
```

---

## Environment-Specific Deployments

### Preview Environment
```bash
# Create preview environment in Dashboard
# Then deploy with:
wrangler deploy --env preview
```

### Production Environment
```bash
wrangler deploy --env production
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [AISupport]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Deploy to Cloudflare
        run: npm run cf:deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Add secrets to GitHub repo settings:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

---

## Post-Deployment Checklist

- [ ] Verify app loads at your workers.dev URL
- [ ] Test the AI image generation endpoint
- [ ] Check console for any errors
- [ ] Verify environment variables are set
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)

---

## Custom Domain Setup

1. Go to **Workers & Pages** → your worker → **Triggers**
2. Click **"Add Custom Domain"**
3. Enter your domain (e.g., `designer.yourdomain.com`)
4. Update DNS records as instructed
5. Wait for SSL certificate (5-10 minutes)

---

## Monitoring & Logs

### View Logs
```bash
wrangler tail
```

Or in Dashboard: **Workers & Pages** → your worker → **Logs**

### Metrics
Dashboard: **Workers & Pages** → your worker → **Metrics**

---

## Rollback

If something breaks:

```bash
# Deploy previous version
git checkout <previous-commit-hash>
npm run cf:deploy

# Or use Dashboard:
# Workers & Pages → your worker → Versions → Rollback
```

---

## Need Help?

- **OpenNext Docs**: https://opennext.js.org/cloudflare
- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **Next.js Edge Runtime**: https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes

---

*Last Updated: 2026-01-15*
