import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content", "articles");
const distDir = path.join(root, "dist");
const publicDir = path.join(root, "public");

const site = {
  name: "Thermal Cycle",
  title: "Thermal Cycle | Sauna Equipment Reviews and Gear Guides",
  url: "https://thermalcycle.com",
  assetVersion: "20260513-3",
  socialImage: "https://thermalcycle.com/assets/thermalcycle-og.png",
  description:
    "Field notes, reviews, and material guides for sauna gear, heat, cold, and the ritual around it.",
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function emptyDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  ensureDir(dir);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: source };
  }

  const data = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) continue;
    const raw = rest.join(":").trim();
    if (raw.startsWith("[") && raw.endsWith("]")) {
      data[key.trim()] = raw
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^"|"$/g, ""))
        .filter(Boolean);
    } else if (raw === "true" || raw === "false") {
      data[key.trim()] = raw === "true";
    } else {
      data[key.trim()] = raw.replace(/^"|"$/g, "");
    }
  }

  return { data, body: match[2].trim() };
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" rel="noopener">$1</a>',
    );
}

function markdownToHtml(markdown) {
  const blocks = markdown.split(/\n{2,}/);
  const html = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("### ")) {
      html.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      html.push(`<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      html.push(`<h1>${inlineMarkdown(trimmed.slice(2))}</h1>`);
    } else if (trimmed.startsWith("> ")) {
      html.push(`<blockquote>${inlineMarkdown(trimmed.replace(/^> /gm, ""))}</blockquote>`);
    } else if (trimmed.split("\n").every((line) => line.startsWith("- "))) {
      const items = trimmed
        .split("\n")
        .map((line) => `<li>${inlineMarkdown(line.slice(2))}</li>`)
        .join("");
      html.push(`<ul>${items}</ul>`);
    } else {
      html.push(`<p>${inlineMarkdown(trimmed.replace(/\n/g, " "))}</p>`);
    }
  }

  return html.join("\n");
}

function readArticles() {
  ensureDir(contentDir);
  return fs
    .readdirSync(contentDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const source = fs.readFileSync(path.join(contentDir, file), "utf8");
      const { data, body } = parseFrontmatter(source);
      const slug = data.slug || file.replace(/\.md$/, "");
      return {
        slug,
        title: data.title || slug,
        description: data.description || "",
        date: data.date || "2026-05-13",
        category: data.category || "Guides",
        tags: data.tags || [],
        featured: Boolean(data.featured),
        body,
        html: markdownToHtml(body),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function layout({ title, description, body, canonical = site.url }) {
  const pageTitle = title === site.name ? site.title : `${title} | ${site.name}`;
  const metaDescription = description || site.description;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(metaDescription)}">
    <meta name="theme-color" content="#181512">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="manifest" href="/site.webmanifest">
    <meta property="og:site_name" content="${escapeHtml(site.name)}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(metaDescription)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:image" content="${site.socialImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Thermal Cycle sauna reviews and material guides">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
    <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
    <meta name="twitter:image" content="${site.socialImage}">
    <link rel="stylesheet" href="/assets/styles.css?v=${site.assetVersion}">
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/" aria-label="Thermal Cycle home">
        <span class="brand-mark">TC</span>
        <span class="brand-name">Thermal Cycle</span>
      </a>
      <nav class="nav" aria-label="Main navigation">
        <a href="/reviews/">Reviews</a>
        <a href="/guides/">Guides</a>
        <a href="/materials/">Materials</a>
        <a href="/ritual/">Ritual</a>
      </nav>
      <a class="header-button" href="/articles/">Read the notes</a>
    </header>
    ${body}
    <footer class="site-footer">
      <p>Thermal Cycle reviews sauna materials, products, equipment, and the habits that make heat better.</p>
      <nav aria-label="Footer navigation">
        <a href="/about/">About</a>
        <a href="/review-policy/">Review Policy</a>
        <a href="/contact/">Contact</a>
      </nav>
    </footer>
  </body>
</html>`;
}

function articleCard(article) {
  return `<article class="article-card">
    <a href="/articles/${article.slug}/">
      <div>
        <span class="badge">${escapeHtml(article.category)}</span>
        <h3>${escapeHtml(article.title)}</h3>
        <p>${escapeHtml(article.description)}</p>
      </div>
      <span class="card-arrow" aria-hidden="true">-></span>
    </a>
  </article>`;
}

function writePage(route, html) {
  const dir = path.join(distDir, route);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

function build() {
  const articles = readArticles();
  emptyDir(distDir);
  fs.cpSync(publicDir, distDir, { recursive: true });

  const featured = articles.find((article) => article.featured) || articles[0];
  const recent = articles.slice(0, 8).map(articleCard).join("\n");
  const homepage = layout({
    title: site.name,
    description: site.description,
    canonical: site.url,
    body: `<main>
      <section class="hero">
        <div class="hero-copy">
          <div class="kicker-row">
            <span class="status-dot"></span>
            <p class="eyebrow">Sauna reviews / materials / ritual</p>
          </div>
          <h1>Gear notes for heat, cold, and the walk back.</h1>
          <p class="lede">A field guide to sauna equipment, material choices, and the small tools that change the way a session feels.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="/reviews/">Read reviews</a>
            <a class="button button-secondary" href="/guides/">Start with guides</a>
          </div>
          <div class="chip-row" aria-label="Topics">
            <a href="/materials/">Wool</a>
            <a href="/reviews/">Hats</a>
            <a href="/guides/">Cold Plunge</a>
            <a href="/ritual/">Aftercare</a>
          </div>
        </div>
        ${
          featured
            ? `<a class="feature-panel card" href="/articles/${featured.slug}/">
              <div class="panel-topline">
                <span class="badge badge-hot">Featured</span>
                <span>Field note 001</span>
              </div>
              <h2>${escapeHtml(featured.title)}</h2>
              <p>${escapeHtml(featured.description)}</p>
              <div class="metric-grid" aria-label="Article attributes">
                <span><strong>Heat</strong> high bench</span>
                <span><strong>Material</strong> wool felt</span>
                <span><strong>Use</strong> longer rounds</span>
                <span><strong>Read</strong> 4 min</span>
              </div>
            </a>`
            : ""
        }
      </section>
      <section class="tool-strip" aria-label="Review criteria">
        <div>
          <span>01</span>
          <strong>Material first</strong>
          <p>Natural fibers, durable hardware, useful construction.</p>
        </div>
        <div>
          <span>02</span>
          <strong>Tested in heat</strong>
          <p>Judged by comfort, handling, and repeat-session use.</p>
        </div>
        <div>
          <span>03</span>
          <strong>No spa fog</strong>
          <p>Plain writing, clear picks, no scented-candle nonsense.</p>
        </div>
      </section>
      <section class="section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Latest dispatches</p>
            <h2>Review the kit. Keep the ritual.</h2>
          </div>
          <a class="button button-secondary" href="/articles/">All articles</a>
        </div>
        <div class="grid">${recent}</div>
      </section>
      <section class="newsletter-band">
        <div>
          <h2>Heat notes, once in a while.</h2>
          <p>Reviews, material guides, and sauna habits worth keeping.</p>
        </div>
        <form action="#" method="post">
          <input type="email" name="email" placeholder="Email address" aria-label="Email address">
          <button type="submit">Join</button>
        </form>
      </section>
    </main>`,
  });
  writePage("", homepage);

  const allArticles = layout({
    title: "Articles",
    description: "All Thermal Cycle sauna reviews, guides, and material notes.",
    canonical: `${site.url}/articles/`,
    body: `<main class="narrow">
      <h1>Articles</h1>
      <div class="stack">${articles.map(articleCard).join("\n")}</div>
    </main>`,
  });
  writePage("articles", allArticles);

  for (const article of articles) {
    writePage(
      `articles/${article.slug}`,
      layout({
        title: article.title,
        description: article.description,
        canonical: `${site.url}/articles/${article.slug}/`,
        body: `<main class="article-shell">
          <article class="article">
            <p class="eyebrow">${escapeHtml(article.category)} / ${escapeHtml(article.date)}</p>
            <h1>${escapeHtml(article.title)}</h1>
            <p class="dek">${escapeHtml(article.description)}</p>
            <div class="article-body">${article.html}</div>
          </article>
        </main>`,
      }),
    );
  }

  const categories = [
    ["reviews", "Reviews"],
    ["guides", "Guides"],
    ["materials", "Materials"],
    ["ritual", "Ritual"],
  ];

  for (const [route, label] of categories) {
    const matches = articles.filter(
      (article) => slugify(article.category) === route || article.tags.map(slugify).includes(route),
    );
    writePage(
      route,
      layout({
        title: label,
        description: `${label} from Thermal Cycle.`,
        canonical: `${site.url}/${route}/`,
        body: `<main class="narrow">
          <h1>${label}</h1>
          <div class="stack">${matches.map(articleCard).join("\n") || "<p>More soon.</p>"}</div>
        </main>`,
      }),
    );
  }

  const simplePages = {
    about: {
      title: "About",
      body: "Thermal Cycle is an editorial review site for sauna materials, products, equipment, and the habits that make heat better.",
    },
    "review-policy": {
      title: "Review Policy",
      body: "We write from research, hands-on use when available, and clear editorial criteria. We favor durable materials, practical design, and products that make sauna sessions feel better in real use.",
    },
    contact: {
      title: "Contact",
      body: "For product submissions, corrections, or editorial notes, email hello@thermalcycle.com.",
    },
  };

  for (const [route, page] of Object.entries(simplePages)) {
    writePage(
      route,
      layout({
        title: page.title,
        description: page.body,
        canonical: `${site.url}/${route}/`,
        body: `<main class="narrow page"><h1>${page.title}</h1><p>${page.body}</p></main>`,
      }),
    );
  }

  const sitemap = [
    "",
    "articles/",
    ...articles.map((article) => `articles/${article.slug}/`),
    "reviews/",
    "guides/",
    "materials/",
    "ritual/",
    "about/",
    "review-policy/",
    "contact/",
  ]
    .map((route) => `<url><loc>${site.url}/${route}</loc></url>`)
    .join("");
  fs.writeFileSync(
    path.join(distDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemap}</urlset>`,
  );

  console.log(`Built ${articles.length} articles to ${distDir}`);
}

build();

if (process.argv.includes("--watch")) {
  fs.watch(path.join(root, "content"), { recursive: true }, build);
  fs.watch(publicDir, { recursive: true }, build);
}
