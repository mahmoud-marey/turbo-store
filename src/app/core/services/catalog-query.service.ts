import { inject, Injectable } from '@angular/core';
import {
  CatalogQuery,
  FacetValue,
  FilterMeta,
  Page,
  ProductListItem,
} from '../models/catalog.models';

export function asList(v?: string | string[] | null): string[] {
  if (v == null || v === '') return [];
  const arr = Array.isArray(v) ? v : String(v).split(',');
  return arr.map((s) => s.trim()).filter(Boolean);
}

@Injectable({ providedIn: 'root' })
export class CatalogQueryService {
  query(products: ProductListItem[], q: CatalogQuery, filters?: FilterMeta): Page<ProductListItem> {
    let items = products.slice();
    const category = q.category?.toLowerCase();
    const brands = asList(q.brand).map((s) => s.toLowerCase());
    const search = q.q?.trim().toLowerCase();

    if (category) {
      items = items.filter((p) => p.categorySlugs.includes(category));
    }
    if (brands.length) {
      items = items.filter((p) => brands.some((b) => p.brandSlug === b || p.brand.toLowerCase() === b));
    }
    if (search) {
      items = items.filter((p) =>
        [p.name, p.model, p.brand, p.shortDescription, p.tags.join(' ')].join(' ').toLowerCase().includes(search),
      );
    }
    if (q.minPrice != null) items = items.filter((p) => p.price >= q.minPrice!);
    if (q.maxPrice != null) items = items.filter((p) => p.price <= q.maxPrice!);
    if (q.inStock) items = items.filter((p) => p.inStock);

    const matchAny = (field: string | string[] | undefined) => {
      const vals = asList(field).map((s) => s.toLowerCase());
      if (!vals.length) return;
      items = items.filter((p) => vals.some((v) => this.blob(p).includes(v)));
    };
    matchAny(q.cpu);
    matchAny(q.gpu);
    matchAny(q.ram);
    matchAny(q.storage);
    matchAny(q.refresh);

    const facets = this.buildFacets(items, filters);

    const sort = q.sort ?? 'default';
    const dir = q.order === 'desc' ? -1 : 1;
    items.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name) * dir;
      if (sort === 'price') return (a.price - b.price) * dir;
      if (sort === 'model') return a.model.localeCompare(b.model) * dir;
      if (sort === 'rating') return (a.rating - b.rating) * dir;
      return 0;
    });

    const pageSize = q.pageSize ?? 12;
    const page = Math.max(1, q.page ?? 1);
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
      facets,
    };
  }

  private blob(p: ProductListItem): string {
    return `${p.name} ${p.tags.join(' ')} ${p.specs.map((s) => `${s.label} ${s.value}`).join(' ')}`.toLowerCase();
  }

  private buildFacets(items: ProductListItem[], filters?: FilterMeta): Record<string, FacetValue[]> {
    const count = (values: FacetValue[]) =>
      values
        .map((v) => ({
          value: v.value,
          count: items.filter((p) => this.blob(p).includes(v.value.toLowerCase()) || p.brand === v.value).length,
        }))
        .filter((v) => v.count > 0);

    if (!filters) {
      const brands = new Map<string, number>();
      for (const p of items) brands.set(p.brand, (brands.get(p.brand) ?? 0) + 1);
      return {
        brands: [...brands.entries()].map(([value, c]) => ({ value, count: c })),
      };
    }
    return {
      brands: count(filters.brands),
      cpu: count(filters.cpu),
      gpu: count(filters.gpu),
      ram: count(filters.ram),
      storage: count(filters.storage),
      refresh: count(filters.refresh),
    };
  }
}
