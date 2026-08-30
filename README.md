# Turbo Store v2

Angular 20 zoneless prototype for [TURBO Computer](https://turbo-computer.com/). Dark-first navy/yellow storefront, bilingual EN/AR, catalog data served from JSON so a backend swap is a provider change.

**Live demo:** https://mahmoud-marey.github.io/turbo-store/

Ratings and a few reviews are **demo-seeded** (`demo: true` on each review). The live OpenCart site currently has 0 reviews; these exist so “Best Rated” and rating sort look alive in the prototype.

Product photos are hotlinked from `turbo-computer.com`.

## Stack

- Angular 20.3, `provideZonelessChangeDetection()`, signals, `resource()`
- Tailwind CSS v4
- JSON catalog behind `CATALOG_API` (`JsonCatalogApi` today, `RestCatalogApi` when APIs exist)

## Run

```bash
npm install
npm start
```

Open http://localhost:4200/

```bash
npm run build
```

## Scrape (refresh catalog from the live site)

```bash
npm run scrape:slice   # 20 products, parser check
npm run scrape         # full catalog (~750 products)
node tools/scrape/normalize.mjs
```

Use `--resume` to skip product files that already exist.

## Pages

Home, category + brand listing with multi-select facets, product detail, search, cart, guest checkout, wishlist, compare, stepped PC Builder, brands, blog, warranty/FAQ, about, terms, privacy, contact, and a bring-your-own-key shopping assistant.

## Assistant

Optional. The shopper pastes an OpenAI (or compatible) key in the browser. The model returns a structured catalog action; the app runs it against the real JSON. See [docs/AI-ASSISTANT.md](docs/AI-ASSISTANT.md). The public demo has a **Play sample conversation** path so it works without a key.

## Backend

See [docs/BACKEND-SWAP.md](docs/BACKEND-SWAP.md). Change two lines in `src/app/app.config.ts` to point `CATALOG_API` at `RestCatalogApi`.

## Deploy

GitHub Pages via `.github/workflows/deploy.yml`. Deep links copy `index.html` to `404.html`.

```bash
npx ng build --base-href /turbo-store/ && node tools/pages-fallback.mjs
```

