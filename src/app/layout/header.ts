import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { CatalogFacade } from '../core/facades/catalog.facade';
import { CartStore } from '../core/stores/cart.store';
import { CompareStore, WishlistStore } from '../core/stores/lists.store';
import { UiStore } from '../core/stores/ui.store';
import { SearchOverlay } from './search-overlay';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe, SearchOverlay],
  template: `
    <header class="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-xl">
      <div class="container-page flex items-center gap-3 py-3">
        <button class="lg:hidden rounded-lg border border-[var(--border)] px-3 py-2" (click)="ui.navOpen.set(!ui.navOpen())" aria-label="Menu">☰</button>
        <a routerLink="/" class="flex items-center gap-2 font-display text-xl font-bold">
          <span class="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)]">T</span>
          <span>{{ 'brand' | t }}</span>
        </a>
        <nav class="ms-4 hidden items-center gap-4 text-sm font-medium lg:flex">
          <a routerLink="/c/laptops" class="hover:text-[var(--accent)]">{{ 'nav.laptops' | t }}</a>
          <a routerLink="/c/pc-bundle" class="hover:text-[var(--accent)]">{{ 'nav.pcs' | t }}</a>
          <a routerLink="/builder" class="hover:text-[var(--accent)]">{{ 'nav.builder' | t }}</a>
          <div class="relative" (mouseenter)="mega.set(true)" (mouseleave)="mega.set(false)">
            <button type="button" class="hover:text-[var(--accent)]">{{ 'nav.shop' | t }}</button>
            @if (mega()) {
              <div class="absolute start-0 top-full z-50 mt-2 grid w-[640px] grid-cols-2 gap-1 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow)]">
                @for (cat of topCats(); track cat.slug) {
                  <a [routerLink]="['/c', cat.slug]" class="rounded-lg px-3 py-2 hover:bg-[var(--bg-card)]">
                    {{ ui.lang() === 'ar' ? cat.nameAr : cat.name }}
                  </a>
                }
              </div>
            }
          </div>
        </nav>
        <div class="ms-auto flex items-center gap-2">
          <app-search-overlay />
          <button type="button" class="rounded-lg border border-[var(--border)] px-2 py-1 text-xs" (click)="ui.setLang(ui.lang() === 'en' ? 'ar' : 'en')">
            {{ ui.lang() === 'en' ? ('lang.ar' | t) : ('lang.en' | t) }}
          </button>
          <button type="button" class="rounded-lg border border-[var(--border)] px-2 py-1 text-xs" (click)="ui.toggleTheme()">
            {{ ui.theme() === 'dark' ? ('theme.light' | t) : ('theme.dark' | t) }}
          </button>
          <a routerLink="/wishlist" class="relative rounded-lg px-2 py-1">♡ <span class="text-xs">{{ wish.count() }}</span></a>
          <a routerLink="/compare" class="relative rounded-lg px-2 py-1 text-sm">⇄ <span class="text-xs">{{ compare.count() }}</span></a>
          <button type="button" class="relative rounded-xl bg-[var(--accent)] px-3 py-2 font-bold text-[var(--accent-ink)]" (click)="ui.cartOpen.set(true)">
            {{ 'cart.title' | t }}
            <span class="ms-1">{{ cart.count() }}</span>
          </button>
        </div>
      </div>
    </header>
    @if (ui.navOpen()) {
      <div class="fixed inset-0 z-50 bg-black/60 lg:hidden" (click)="ui.navOpen.set(false)">
        <nav class="h-full w-80 max-w-[85%] overflow-auto bg-[var(--bg-elevated)] p-6" (click)="$event.stopPropagation()" [style.margin-inline-start]="0">
          <p class="mb-4 font-display text-lg">{{ 'brand' | t }}</p>
          @for (cat of cats(); track cat.slug) {
            <a [routerLink]="['/c', cat.slug]" class="block border-b border-[var(--border)] py-3" (click)="ui.navOpen.set(false)">
              {{ ui.lang() === 'ar' ? cat.nameAr : cat.name }}
            </a>
          }
        </nav>
      </div>
    }
  `,
})
export class Header {
  readonly ui = inject(UiStore);
  readonly cart = inject(CartStore);
  readonly wish = inject(WishlistStore);
  readonly compare = inject(CompareStore);
  private readonly catalog = inject(CatalogFacade);
  private readonly router = inject(Router);
  readonly mega = signal(false);
  readonly cats = toSignal(this.catalog.categories(), { initialValue: [] });
  readonly topCats = computed(() => this.cats().filter((c) => !c.parentSlug).slice(0, 16));

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.ui.navOpen.set(false));
  }
}
