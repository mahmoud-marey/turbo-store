import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WishlistStore } from '../../core/stores/lists.store';
import { ProductCard } from '../../shared/product-card';
import { EmptyState } from '../../shared/empty-state';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-wishlist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCard, EmptyState, TranslatePipe],
  template: `
    <div class="container-page py-10">
      <h1 class="mb-6 font-display text-3xl font-bold">{{ 'wishlist.title' | t }}</h1>
      @if (!wish.items().length) {
        <app-empty titleKey="wishlist.empty" />
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (p of wish.items(); track p.slug) {
            <app-product-card [product]="p" />
          }
        </div>
      }
    </div>
  `,
})
export class WishlistPage {
  readonly wish = inject(WishlistStore);
  constructor() {
    inject(SeoService).set('Wishlist');
  }
}
