import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogFacade } from '../../core/facades/catalog.facade';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-brands',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="container-page py-10">
      <h1 class="mb-6 font-display text-3xl font-bold">{{ 'nav.brands' | t }}</h1>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        @for (b of brands(); track b.slug) {
          <a [routerLink]="['/brand', b.slug]" class="grid place-items-center rounded-2xl border border-[var(--border)] bg-white p-4">
            <img [src]="b.logo" [alt]="b.name" class="h-16 object-contain" />
            <span class="mt-2 text-sm text-black">{{ b.name }}</span>
          </a>
        }
      </div>
    </div>
  `,
})
export class BrandsPage {
  readonly brands = toSignal(inject(CatalogFacade).brands(), { initialValue: [] });
  constructor() {
    inject(SeoService).set('Brands');
  }
}
