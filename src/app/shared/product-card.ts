import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '../core/models/catalog.models';
import { EgpPipe } from '../core/i18n/egp.pipe';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { CartStore } from '../core/stores/cart.store';
import { CompareStore, WishlistStore } from '../core/stores/lists.store';
import { dealLabel } from './deal';

@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EgpPipe, TranslatePipe],
  template: `
    @if (layout() === 'list') {
      <article class="flex gap-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow)]">
        <a [routerLink]="['/p', product().slug]" class="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-black/20">
          <img [src]="product().image" [alt]="product().name" loading="lazy" class="h-full w-full object-contain p-2" />
        </a>
        <div class="min-w-0 flex-1">
          <p class="text-[11px] uppercase text-[var(--text-muted)]">{{ product().brand }}</p>
          <a [routerLink]="['/p', product().slug]" class="line-clamp-2 font-display text-sm font-semibold">{{ product().name }}</a>
          <p class="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{{ product().shortDescription }}</p>
          <div class="mt-1 flex flex-wrap gap-1">
            @for (s of keySpecs(); track s) {
              <span class="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px]">{{ s }}</span>
            }
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <p class="price font-bold text-[var(--accent)]">{{ product().price | egp }}</p>
            @if (deal()) {
              <span class="text-[10px] text-[var(--color-danger)]">⏱ {{ deal() }}</span>
            }
            <button type="button" class="ms-auto rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--accent-ink)]" (click)="cart.add(product().slug)">{{ 'cart.add' | t }}</button>
            <button type="button" class="rounded-xl border border-[var(--border)] px-2" (click)="wish.toggle(product().slug)">{{ wish.has(product().slug) ? '♥' : '♡' }}</button>
          </div>
        </div>
      </article>
    } @else {
      <article class="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow)]">
        <a [routerLink]="['/p', product().slug]" class="relative block aspect-square overflow-hidden bg-black/20">
          <img
            [src]="product().image"
            [alt]="product().name"
            loading="lazy"
            class="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
            [style.view-transition-name]="'img-' + product().slug"
          />
          @if (product().labels[0]) {
            <span class="absolute start-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-bold text-[var(--accent-ink)]">{{ product().labels[0] }}</span>
          }
          @if (off()) {
            <span class="absolute end-3 top-3 rounded-full bg-[var(--color-danger)] px-2 py-1 text-[11px] font-bold text-white">-{{ off() }}%</span>
          }
          @if (deal()) {
            <span class="absolute inset-x-3 bottom-3 rounded-full bg-black/70 px-2 py-1 text-center text-[11px] font-bold text-[var(--accent)]">⏱ {{ deal() }}</span>
          }
        </a>
        <div class="flex flex-1 flex-col gap-2 p-4">
          <p class="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">{{ product().brand }}</p>
          <a [routerLink]="['/p', product().slug]" class="line-clamp-2 min-h-10 font-display text-sm font-semibold leading-snug">{{ product().name }}</a>
          <div class="flex items-center gap-1 text-xs text-[var(--color-yellow)]">
            <span aria-hidden="true">★</span>
            <span>{{ product().rating }}</span>
            <span class="text-[var(--text-muted)]">({{ product().reviewCount }})</span>
          </div>
          <div class="mt-auto flex items-end justify-between gap-2">
            <div>
              @if (product().oldPrice) {
                <p class="text-xs text-[var(--text-muted)] line-through">{{ product().oldPrice | egp }}</p>
              }
              <p class="price text-lg font-bold text-[var(--accent)]">{{ product().price | egp }}</p>
            </div>
            <p class="text-xs" [class.text-[var(--color-success)]]="product().inStock" [class.text-[var(--color-danger)]]="!product().inStock">
              {{ product().inStock ? ('product.in' | t) : ('product.out' | t) }}
            </p>
          </div>
          <div class="mt-2 grid grid-cols-[1fr_auto_auto] gap-1.5">
            <button type="button" class="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-bold text-[var(--accent-ink)]" (click)="cart.add(product().slug)">
              {{ 'cart.add' | t }}
            </button>
            <button type="button" class="rounded-xl border border-[var(--border)] px-2" [attr.aria-label]="'wishlist.add' | t" (click)="wish.toggle(product().slug)">
              {{ wish.has(product().slug) ? '♥' : '♡' }}
            </button>
            <button type="button" class="rounded-xl border border-[var(--border)] px-2 text-xs" (click)="compare.toggle(product().slug)">{{ 'compare.add' | t }}</button>
          </div>
          <button type="button" class="text-xs text-[var(--text-muted)] underline-offset-2 hover:underline" (click)="quick.emit(product())">{{ 'quickview' | t }}</button>
        </div>
      </article>
    }
  `,
})
export class ProductCard {
  readonly product = input.required<ProductListItem>();
  readonly layout = input<'grid' | 'list'>('grid');
  readonly quick = output<ProductListItem>();
  readonly cart = inject(CartStore);
  readonly wish = inject(WishlistStore);
  readonly compare = inject(CompareStore);
  readonly off = computed(() => {
    const p = this.product();
    if (!p.oldPrice || p.oldPrice <= p.price) return 0;
    return Math.round((1 - p.price / p.oldPrice) * 100);
  });
  readonly deal = computed(() => (this.off() ? dealLabel(this.product().slug) : null));
  readonly keySpecs = computed(() =>
    this.product()
      .specs.filter((s) => /cpu|gpu|processor|graphics|ram|memory|storage|ssd|hdd|display|screen/i.test(s.label))
      .slice(0, 4)
      .map((s) => s.value),
  );
}
