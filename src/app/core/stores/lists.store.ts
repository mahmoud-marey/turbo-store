import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProductListItem } from '../models/catalog.models';
import { CatalogFacade } from '../facades/catalog.facade';
import { ToastService } from '../services/toast.service';
import { UiStore } from './ui.store';

@Injectable({ providedIn: 'root' })
export class WishlistStore {
  private readonly catalog = inject(CatalogFacade);
  private readonly toast = inject(ToastService);
  private readonly ui = inject(UiStore);
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
    const adding = !this.has(slug);
    this.slugs.update((list) => (list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]));
    this.toast.show(this.ui.t(adding ? 'wishlist.added' : 'wishlist.removed'));
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
  private readonly toast = inject(ToastService);
  private readonly ui = inject(UiStore);
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
    if (this.has(slug)) {
      this.slugs.update((list) => list.filter((s) => s !== slug));
      this.toast.show(this.ui.t('compare.removed'));
      return;
    }
    let evicted = false;
    this.slugs.update((list) => {
      if (list.length >= 4) {
        evicted = true;
        return [...list.slice(1), slug];
      }
      return [...list, slug];
    });
    this.toast.show(this.ui.t(evicted ? 'compare.evicted' : 'compare.added'), evicted ? { kind: 'warn' } : {});
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
