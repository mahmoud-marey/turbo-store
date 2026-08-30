import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CatalogFacade } from '../../core/facades/catalog.facade';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-blog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="container-page py-10">
      <h1 class="mb-6 font-display text-3xl font-bold">{{ 'nav.blog' | t }}</h1>
      <div class="grid gap-4 md:grid-cols-2">
        @for (p of posts.value() ?? []; track p.slug) {
          <a [routerLink]="['/blog', p.slug]" class="rounded-2xl border border-[var(--border)] p-5">
            <h2 class="font-display text-xl font-bold">{{ p.title }}</h2>
            <p class="mt-2 text-sm text-[var(--text-muted)]">{{ p.excerpt }}</p>
          </a>
        }
      </div>
    </div>
  `,
})
export class BlogPage {
  private readonly catalog = inject(CatalogFacade);
  readonly posts = resource({ loader: () => firstValueFrom(this.catalog.blog()) });
  constructor() {
    inject(SeoService).set('Blog');
  }
}
