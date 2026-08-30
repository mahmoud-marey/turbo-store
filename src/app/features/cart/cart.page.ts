import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore } from '../../core/stores/cart.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { EgpPipe } from '../../core/i18n/egp.pipe';
import { QtyStepper } from '../../shared/qty-stepper';
import { EmptyState } from '../../shared/empty-state';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-cart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe, EgpPipe, QtyStepper, EmptyState],
  template: `
    <div class="container-page py-10">
      <h1 class="font-display text-3xl font-bold">{{ 'cart.title' | t }}</h1>
      @if (!cart.items().length) {
        <div class="mt-8"><app-empty titleKey="cart.empty" /></div>
      } @else {
        <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            @for (line of cart.items(); track line.slug) {
              <div class="mb-4 flex gap-4 rounded-2xl border border-[var(--border)] p-4">
                <img [src]="line.product.image" alt="" class="h-24 w-24 object-contain" />
                <div class="flex-1">
                  <a [routerLink]="['/p', line.slug]" class="font-semibold">{{ line.product.name }}</a>
                  <p class="text-[var(--accent)]">{{ line.product.price | egp }}</p>
                  <app-qty [qty]="line.qty" (qtyChange)="cart.setQty(line.slug, $event)" />
                </div>
                <button type="button" (click)="cart.remove(line.slug)">{{ 'cart.remove' | t }}</button>
              </div>
            }
          </div>
          <aside class="h-fit rounded-2xl border border-[var(--border)] p-5">
            <div class="mb-3 flex gap-2">
              <input class="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" [placeholder]="'promo.code' | t" [value]="code()" (input)="code.set(($any($event.target)).value)" />
              <button type="button" class="rounded-lg border border-[var(--border)] px-3" (click)="cart.applyPromo(code())">{{ 'promo.apply' | t }}</button>
            </div>
            <p class="mb-4 text-xs text-[var(--text-muted)]">{{ 'promo.invalid' | t }}</p>
            <div class="flex justify-between py-1"><span>{{ 'cart.subtotal' | t }}</span><span>{{ cart.subtotal() | egp }}</span></div>
            <div class="flex justify-between py-1"><span>TURBO10</span><span>-{{ cart.discount() | egp }}</span></div>
            <div class="mt-2 flex justify-between text-lg font-bold"><span>{{ 'cart.total' | t }}</span><span>{{ cart.total() | egp }}</span></div>
            <a routerLink="/checkout" class="mt-5 block rounded-xl bg-[var(--accent)] py-3 text-center font-bold text-[var(--accent-ink)]">{{ 'cart.checkout' | t }}</a>
          </aside>
        </div>
      }
    </div>
  `,
})
export class CartPage {
  readonly cart = inject(CartStore);
  readonly code = signal('');
  constructor() {
    inject(SeoService).set('Cart');
  }
}
