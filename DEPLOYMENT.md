# Deploying to Cloudflare Pages

This guide will help you deploy your Design Editor to Cloudflare Pages.

## Prerequisites

1. A Cloudflare account (free tier works fine)
2. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Project

First, ensure your project builds successfully:

```bash
npm run build
```

This will create an optimized production build in the `.next` folder.

## Step 2: Add Cloudflare Pages Adapter

Since this is a Next.js app, you need to use the `@cloudflare/next-on-pages` adapter:

```bash
npm install --save-dev @cloudflare/next-on-pages
```

## Step 3: Update package.json

Add a new script for Cloudflare Pages build:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "pages:build": "npx @cloudflare/next-on-pages",
    "preview": "npm run pages:build && wrangler pages dev",
    "deploy": "npm run pages:build && wrangler pages deploy"
  }
}
```

## Step 4: Create wrangler.toml (Optional)

Create a `wrangler.toml` file in your project root:

```toml
name = "g-print-designer"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"
```

## Step 5: Push to Git

If you haven't already, initialize git and push to a remote repository:

```bash
git init
git add .
git commit -m "Initial commit - Design Editor"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

## Step 6: Deploy via Cloudflare Dashboard

### Option A: Connect Git Repository (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** in the sidebar
3. Click **Create a project**
4. Click **Connect to Git**
5. Select your repository
6. Configure build settings:
   - **Framework preset**: Next.js
   - **Build command**: `npx @cloudflare/next-on-pages`
   - **Build output directory**: `.vercel/output/static`
   - **Node version**: 18 or higher
7. Click **Save and Deploy**

### Option B: Direct Upload (Recommended for this project)

1. Build your project locally:
   ```bash
   npm run build
   ```
   (This will create an `out` folder with your static site)

2. Go to Cloudflare Pages dashboard
3. Click **Create a project** → **Direct Upload**
4. Upload the **`out`** folder
5. Click **Deploy**

## Step 7: Environment Variables (if needed)

If you have any environment variables, add them in:
- Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables

## Important Notes

### Static Export Alternative

If you encounter issues with Next.js on Cloudflare Pages, you can use static export:

1. Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
```

2. Build:
```bash
npm run build
```

3. Deploy the `out` folder to Cloudflare Pages

### Custom Domain

After deployment, you can add a custom domain:
1. Go to your Pages project
2. Click **Custom domains**
3. Add your domain and follow DNS instructions

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### Images Not Loading
- Ensure images are in the `public` folder
- Use relative paths (e.g., `/clipart/heart.png`)
- Set `images.unoptimized: true` in next.config.js

### Canvas Issues
- Fabric.js works client-side only
- Ensure components using Fabric.js have `'use client'` directive

## Success!

Your design editor should now be live at:
`https://your-project-name.pages.dev`

You can share this URL with anyone to use your design editor!
