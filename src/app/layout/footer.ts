import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { CatalogFacade } from '../core/facades/catalog.facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { UiStore } from '../core/stores/ui.store';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  template: `
    <footer class="mt-16 border-t border-[var(--border)] bg-[var(--bg-elevated)]">
      <div class="container-page grid gap-8 py-12 md:grid-cols-4">
        <div>
          <p class="font-display text-2xl font-bold">{{ 'brand' | t }}</p>
          <p class="mt-2 text-sm text-[var(--text-muted)]">{{ 'tagline' | t }}</p>
          <p class="mt-4 text-sm">01144413879 · WhatsApp 01144413879</p>
        </div>
        <div>
          <p class="mb-3 font-semibold">{{ 'footer.shop' | t }}</p>
          @for (c of top(); track c.slug) {
            <a [routerLink]="['/c', c.slug]" class="block py-1 text-sm text-[var(--text-muted)] hover:text-[var(--accent)]">
              {{ ui.lang() === 'ar' ? c.nameAr : c.name }}
            </a>
          }
        </div>
        <div>
          <p class="mb-3 font-semibold">{{ 'footer.support' | t }}</p>
          <a routerLink="/warranty" class="block py-1 text-sm text-[var(--text-muted)]">{{ 'nav.warranty' | t }}</a>
          <a routerLink="/contact" class="block py-1 text-sm text-[var(--text-muted)]">{{ 'nav.contact' | t }}</a>
          <a routerLink="/builder" class="block py-1 text-sm text-[var(--text-muted)]">{{ 'nav.builder' | t }}</a>
          <a routerLink="/blog" class="block py-1 text-sm text-[var(--text-muted)]">{{ 'nav.blog' | t }}</a>
        </div>
        <div>
          <p class="mb-3 font-semibold">{{ 'footer.legal' | t }}</p>
          <a routerLink="/about" class="block py-1 text-sm text-[var(--text-muted)]">{{ 'nav.about' | t }}</a>
          <a routerLink="/page/privacy" class="block py-1 text-sm text-[var(--text-muted)]">Privacy</a>
          <a routerLink="/page/terms" class="block py-1 text-sm text-[var(--text-muted)]">Terms</a>
          <a routerLink="/page/delivery" class="block py-1 text-sm text-[var(--text-muted)]">Delivery</a>
        </div>
      </div>
      <p class="border-t border-[var(--border)] py-4 text-center text-xs text-[var(--text-muted)]">{{ 'footer.copy' | t }}</p>
    </footer>
  `,
})
export class Footer {
  readonly ui = inject(UiStore);
  readonly cats = toSignal(inject(CatalogFacade).categories(), { initialValue: [] });
  top() {
    return this.cats().filter((c) => !c.parentSlug).slice(0, 8);
  }
}
