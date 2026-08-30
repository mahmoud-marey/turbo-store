import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompareStore } from '../../core/stores/lists.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { EgpPipe } from '../../core/i18n/egp.pipe';
import { EmptyState } from '../../shared/empty-state';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-compare',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe, EgpPipe, EmptyState],
  template: `
    <div class="container-page py-10">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="font-display text-3xl font-bold">{{ 'compare.title' | t }}</h1>
        <label class="text-sm"><input type="checkbox" [checked]="diff()" (change)="diff.set(!diff())" /> {{ 'compare.difference' | t }}</label>
      </div>
      @if (!compare.items().length) {
        <app-empty titleKey="compare.empty" />
      } @else {
        <div class="overflow-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr>
                <th class="p-3 text-start"></th>
                @for (p of compare.items(); track p.slug) {
                  <th class="p-3 text-start">
                    <a [routerLink]="['/p', p.slug]"><img [src]="p.image" alt="" class="mb-2 h-24 w-24 object-contain" /><span class="line-clamp-2">{{ p.name }}</span></a>
                    <p class="text-[var(--accent)]">{{ p.price | egp }}</p>
                    <button type="button" class="mt-1 text-xs" (click)="compare.toggle(p.slug)">{{ 'cart.remove' | t }}</button>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.label) {
                <tr class="border-t border-[var(--border)]" [class.bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]]="diff() && row.different">
                  <th class="p-3 text-start text-[var(--text-muted)]">{{ row.label }}</th>
                  @for (v of row.values; track $index) {
                    <td class="p-3">{{ v }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class ComparePage {
  readonly compare = inject(CompareStore);
  readonly diff = signal(true);
  readonly rows = computed(() => {
    const items = this.compare.items();
    const labels = new Set<string>(['Brand', 'Price', 'Rating', ...items.flatMap((p) => p.specs.map((s) => s.label))]);
    return [...labels].map((label) => {
      const values = items.map((p) => {
        if (label === 'Brand') return p.brand;
        if (label === 'Price') return String(p.price);
        if (label === 'Rating') return String(p.rating);
        return p.specs.find((s) => s.label === label)?.value ?? '—';
      });
      return { label, values, different: new Set(values).size > 1 };
    });
  });
  constructor() {
    inject(SeoService).set('Compare');
  }
}
