# Backend swap

The storefront never talks to JSON files directly. Every screen goes through `CATALOG_API`.

Today that token is bound to `JsonCatalogApi`, which loads files from `public/data` (`API_BASE_URL = 'data'`).

To switch to a real backend:

1. Add `src/app/core/api/rest-catalog-api.ts` that implements the same `CatalogApi` interface with `HttpClient`.
2. In `app.config.ts` replace:

```ts
{ provide: API_BASE_URL, useValue: 'data' },
{ provide: CATALOG_API, useExisting: JsonCatalogApi },
```

with:

```ts
{ provide: API_BASE_URL, useValue: '/api' },
{ provide: CATALOG_API, useExisting: RestCatalogApi },
```

## Endpoints the backend must expose

Query string matches `CatalogQuery` (`category`, `brand`, `q`, `minPrice`, `maxPrice`, `cpu`, `gpu`, `ram`, `storage`, `refresh`, `inStock`, `sort`, `order`, `page`, `pageSize`).

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/products` | `Page<ProductListItem>` `{ items, total, page, pageSize, facets }` |
| GET | `/api/products/:slug` | `ProductDetail` |
| GET | `/api/products/suggest?q=` | `ProductListItem[]` |
| GET | `/api/categories` | `Category[]` |
| GET | `/api/brands` | `Brand[]` |
| GET | `/api/home` | `HomeData` |
| GET | `/api/filters` | `FilterMeta` |
| GET | `/api/builder` | `BuilderCatalog` |
| GET | `/api/blog` | `BlogPost[]` |
| GET | `/api/blog/:slug` | `BlogPost` |
| GET | `/api/pages/:id` | `ContentPage` (`about`, `warranty`, `privacy`, `terms`, `delivery`) |

Cart, wishlist, compare, and checkout stay client-side until you add `/api/cart` and `/api/orders`. Checkout currently writes a demo order to `sessionStorage`.

Sample payloads live in `public/data/`.
