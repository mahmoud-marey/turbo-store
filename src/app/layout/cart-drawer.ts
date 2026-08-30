import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore } from '../core/stores/cart.store';
import { UiStore } from '../core/stores/ui.store';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { EgpPipe } from '../core/i18n/egp.pipe';
import { QtyStepper } from '../shared/qty-stepper';
import { OverlayDirective } from '../shared/overlay';

@Component({
  selector: 'app-cart-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe, EgpPipe, QtyStepper, OverlayDirective],
  template: `
    @if (ui.cartOpen()) {
      <div class="fixed inset-0 z-50 bg-black/60" (click)="ui.cartOpen.set(false)">
        <aside
          appOverlay
          class="ms-auto flex h-full w-full max-w-md flex-col bg-[var(--bg-elevated)] shadow-[var(--shadow)]"
          (click)="$event.stopPropagation()"
          (closed)="ui.cartOpen.set(false)"
        >
          <div class="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <h2 class="font-display text-xl">{{ 'cart.title' | t }}</h2>
            <button type="button" (click)="ui.cartOpen.set(false)" aria-label="Close">✕</button>
          </div>
          <div class="flex-1 overflow-auto p-5">
            @if (!cart.items().length) {
              <p class="text-[var(--text-muted)]">{{ 'cart.empty' | t }}</p>
            } @else {
              @for (line of cart.items(); track line.slug) {
                <div class="mb-4 flex gap-3">
                  <img [src]="line.product.image" alt="" class="h-16 w-16 object-contain" />
                  <div class="min-w-0 flex-1">
                    <a [routerLink]="['/p', line.slug]" class="line-clamp-2 text-sm">{{ line.product.name }}</a>
                    <p class="text-[var(--accent)]">{{ line.product.price | egp }}</p>
                    <app-qty [qty]="line.qty" (qtyChange)="cart.setQty(line.slug, $event)" />
                  </div>
                  <button type="button" class="text-xs text-[var(--text-muted)]" (click)="cart.remove(line.slug)">{{ 'cart.remove' | t }}</button>
                </div>
              }
            }
          </div>
          <div class="border-t border-[var(--border)] p-5" style="padding-bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px))">
            <div class="mb-3 flex justify-between"><span>{{ 'cart.subtotal' | t }}</span><span>{{ cart.subtotal() | egp }}</span></div>
            <a routerLink="/cart" class="mb-2 block rounded-xl border border-[var(--border)] py-3 text-center" (click)="ui.cartOpen.set(false)">{{ 'cart.view' | t }}</a>
            <a routerLink="/checkout" class="block rounded-xl bg-[var(--accent)] py-3 text-center font-bold text-[var(--accent-ink)]" (click)="ui.cartOpen.set(false)">{{ 'cart.checkout' | t }}</a>
          </div>
        </aside>
      </div>
    }
  `,
})
export class CartDrawer {
  readonly cart = inject(CartStore);
  readonly ui = inject(UiStore);
}
