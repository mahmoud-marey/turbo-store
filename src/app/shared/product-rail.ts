import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ProductListItem } from '../core/models/catalog.models';
import { ProductCard } from './product-card';

@Component({
  selector: 'app-rail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCard],
  template: `
    <div class="rail-snap">
      @for (p of products(); track p.slug) {
        <div>
          <app-product-card [product]="p" (quick)="quick.emit($event)" />
        </div>
      }
    </div>
  `,
})
export class ProductRail {
  readonly products = input.required<ProductListItem[]>();
  readonly quick = output<ProductListItem>();
}
