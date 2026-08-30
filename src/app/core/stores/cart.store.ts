import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CartLine, ProductListItem } from '../models/catalog.models';
import { CatalogFacade } from '../facades/catalog.facade';
import { ToastService } from '../services/toast.service';
import { UiStore } from './ui.store';

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly catalog = inject(CatalogFacade);
  private readonly toast = inject(ToastService);
  private readonly ui = inject(UiStore);
  readonly lines = signal<CartLine[]>(this.read());
  readonly promo = signal('');
  readonly catalogCache = signal<ProductListItem[]>([]);

  readonly count = computed(() => this.lines().reduce((n, l) => n + l.qty, 0));
  readonly items = computed(() => {
    const map = new Map(this.catalogCache().map((p) => [p.slug, p]));
    return this.lines()
      .map((l) => ({ ...l, product: map.get(l.slug) }))
      .filter((l): l is CartLine & { product: ProductListItem } => !!l.product);
  });
  readonly subtotal = computed(() => this.items().reduce((n, l) => n + l.product.price * l.qty, 0));
  readonly discount = computed(() => (this.promo().toUpperCase() === 'TURBO10' ? this.subtotal() * 0.1 : 0));
  readonly total = computed(() => Math.max(0, this.subtotal() - this.discount()));

  constructor() {
    effect(() => localStorage.setItem('turbo.cart', JSON.stringify(this.lines())));
    void this.hydrate();
  }

  add(slug: string, qty = 1, silent = false): void {
    this.lines.update((lines) => {
      const found = lines.find((l) => l.slug === slug);
      if (found) return lines.map((l) => (l.slug === slug ? { ...l, qty: l.qty + qty } : l));
      return [...lines, { slug, qty }];
    });
    if (!silent) {
      this.toast.show(this.ui.t('cart.added'), { action: this.ui.t('cart.view'), href: '/cart' });
    }
  }

  addMany(slugs: string[]): void {
    for (const slug of slugs) this.add(slug, 1, true);
    if (slugs.length) {
      this.toast.show(this.ui.t('builder.added'), { action: this.ui.t('cart.view'), href: '/cart' });
    }
  }

  applyPromo(code: string): void {
    const c = code.trim().toUpperCase();
    this.promo.set(c);
    if (c === 'TURBO10') this.toast.show(this.ui.t('promo.applied'));
    else this.toast.show(this.ui.t('promo.rejected'), { kind: 'warn' });
  }

  setQty(slug: string, qty: number): void {
    if (qty <= 0) this.remove(slug);
    else this.lines.update((lines) => lines.map((l) => (l.slug === slug ? { ...l, qty } : l)));
  }

  remove(slug: string): void {
    this.lines.update((lines) => lines.filter((l) => l.slug !== slug));
  }

  clear(): void {
    this.lines.set([]);
  }

  private async hydrate(): Promise<void> {
    const page = await firstValueFrom(this.catalog.list({ page: 1, pageSize: 1000 }));
    this.catalogCache.set(page.items);
  }

  private read(): CartLine[] {
    try {
      return JSON.parse(localStorage.getItem('turbo.cart') || '[]') as CartLine[];
    } catch {
      return [];
    }
  }
}
