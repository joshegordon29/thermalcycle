# Thermal Cycle Deployment

## Recommended Host

Use Cloudflare Pages, Netlify, or Vercel. This site does not need a server in production.

## Build Settings

Build command:

```bash
npm run build
```

Publish directory:

```bash
dist
```

## Domain Setup

In your host:

1. Add `thermalcycle.com` as the production domain.
2. Add `www.thermalcycle.com` as an alias.
3. Follow the host's DNS instructions.
4. Redirect `www` to the root domain, or root to `www`, but pick one canonical version.

The build script already uses `https://thermalcycle.com` for canonical URLs and the sitemap.

## Publishing Workflow

1. Add or edit Markdown files in `content/articles/`.
2. Run `npm run build`.
3. Preview with `npm run serve`.
4. Deploy the `dist` folder.

## Newsletter

The homepage form is currently a placeholder. Replace the form `action="#"` in `scripts/build.js` with your Beehiiv, ConvertKit, Klaviyo, or other signup endpoint.

## Product Links

Add product backlinks inside article Markdown where relevant:

```md
See the current sauna hat release at [shop.theguss.com](https://shop.theguss.com/).
```

Keep these contextual. The site should not need a sitewide product banner to do its job.
