import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProductListItem } from '../models/catalog.models';
import { CatalogFacade } from '../facades/catalog.facade';

@Injectable({ providedIn: 'root' })
export class WishlistStore {
  private readonly catalog = inject(CatalogFacade);
  readonly slugs = signal<string[]>(this.read('turbo.wishlist'));
  readonly catalogCache = signal<ProductListItem[]>([]);
  readonly items = computed(() => {
    const map = new Map(this.catalogCache().map((p) => [p.slug, p]));
    return this.slugs().map((s) => map.get(s)).filter((p): p is ProductListItem => !!p);
  });
  readonly count = computed(() => this.slugs().length);

  constructor() {
    effect(() => localStorage.setItem('turbo.wishlist', JSON.stringify(this.slugs())));
    void this.hydrate();
  }

  has(slug: string): boolean {
    return this.slugs().includes(slug);
  }

  toggle(slug: string): void {
    this.slugs.update((list) => (list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]));
  }

  private async hydrate(): Promise<void> {
    const page = await firstValueFrom(this.catalog.list({ page: 1, pageSize: 1000 }));
    this.catalogCache.set(page.items);
  }

  private read(key: string): string[] {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]') as string[];
    } catch {
      return [];
    }
  }
}

@Injectable({ providedIn: 'root' })
export class CompareStore {
  private readonly catalog = inject(CatalogFacade);
  readonly slugs = signal<string[]>(this.read());
  readonly catalogCache = signal<ProductListItem[]>([]);
  readonly items = computed(() => {
    const map = new Map(this.catalogCache().map((p) => [p.slug, p]));
    return this.slugs().map((s) => map.get(s)).filter((p): p is ProductListItem => !!p);
  });
  readonly count = computed(() => this.slugs().length);

  constructor() {
    effect(() => localStorage.setItem('turbo.compare', JSON.stringify(this.slugs())));
    void this.hydrate();
  }

  has(slug: string): boolean {
    return this.slugs().includes(slug);
  }

  toggle(slug: string): void {
    this.slugs.update((list) => {
      if (list.includes(slug)) return list.filter((s) => s !== slug);
      if (list.length >= 4) return [...list.slice(1), slug];
      return [...list, slug];
    });
  }

  clear(): void {
    this.slugs.set([]);
  }

  private async hydrate(): Promise<void> {
    const page = await firstValueFrom(this.catalog.list({ page: 1, pageSize: 1000 }));
    this.catalogCache.set(page.items);
  }

  private read(): string[] {
    try {
      return JSON.parse(localStorage.getItem('turbo.compare') || '[]') as string[];
    } catch {
      return [];
    }
  }
}
