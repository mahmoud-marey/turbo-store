import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProductListItem } from '../models/catalog.models';
import { CatalogFacade } from '../facades/catalog.facade';

@Injectable({ providedIn: 'root' })
export class RecentlyViewedStore {
  private readonly catalog = inject(CatalogFacade);
  readonly slugs = signal<string[]>(this.read());
  readonly catalogCache = signal<ProductListItem[]>([]);
  readonly items = computed(() => {
    const map = new Map(this.catalogCache().map((p) => [p.slug, p]));
    return this.slugs()
      .map((s) => map.get(s))
      .filter((p): p is ProductListItem => !!p);
  });
  readonly last = computed(() => this.items()[0] ?? null);

  constructor() {
    effect(() => localStorage.setItem('turbo.recent', JSON.stringify(this.slugs())));
    void this.hydrate();
  }

  push(slug: string): void {
    this.slugs.update((list) => [slug, ...list.filter((s) => s !== slug)].slice(0, 12));
  }

  private async hydrate(): Promise<void> {
    const page = await firstValueFrom(this.catalog.list({ page: 1, pageSize: 1000 }));
    this.catalogCache.set(page.items);
  }

  private read(): string[] {
    try {
      return JSON.parse(localStorage.getItem('turbo.recent') || '[]') as string[];
    } catch {
      return [];
    }
  }
}
