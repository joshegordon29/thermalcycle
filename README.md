# Thermal Cycle

Static editorial site for `thermalcycle.com`.

## Commands

```bash
npm run build
npm run serve
```

The site builds to `dist/`. Deploy that folder to Netlify, Cloudflare Pages, Vercel, or any static host.

## Writing Articles

Add Markdown files in `content/articles/`.

Required frontmatter:

```md
---
title: "Article Title"
description: "Short SEO description."
date: "2026-05-13"
category: "Guides"
tags: ["sauna hats", "materials"]
featured: true
---
```

Use normal Markdown headings, links, lists, and paragraphs.
