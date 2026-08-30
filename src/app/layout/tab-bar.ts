import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { CartStore } from '../core/stores/cart.store';
import { WishlistStore } from '../core/stores/lists.store';
import { UiStore } from '../core/stores/ui.store';
import { TranslatePipe } from '../core/i18n/translate.pipe';

@Component({
  selector: 'app-tab-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <nav
      class="fixed inset-x-0 bottom-0 z-[35] border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--bg-elevated)_92%,transparent)] backdrop-blur-xl md:hidden"
      [class.translate-y-full]="ui.hideTabs() && !ui.cartOpen() && !ui.searchOpen() && !ui.navOpen()"
      [class.transition-transform]="true"
      style="padding-bottom: env(safe-area-inset-bottom, 0px)"
      aria-label="Primary"
    >
      <div class="grid grid-cols-5 text-[11px]">
        <a routerLink="/" routerLinkActive="text-[var(--accent)]" [routerLinkActiveOptions]="{ exact: true }" class="flex flex-col items-center gap-0.5 py-2">
          <span class="text-base">⌂</span>{{ 'tabs.home' | t }}
        </a>
        <a routerLink="/c/laptops" routerLinkActive="text-[var(--accent)]" class="flex flex-col items-center gap-0.5 py-2">
          <span class="text-base">▣</span>{{ 'tabs.shop' | t }}
        </a>
        <a routerLink="/builder" routerLinkActive="text-[var(--accent)]" class="flex flex-col items-center gap-0.5 py-2">
          <span class="text-base">⚙</span>{{ 'tabs.builder' | t }}
        </a>
        <a routerLink="/wishlist" routerLinkActive="text-[var(--accent)]" class="relative flex flex-col items-center gap-0.5 py-2">
          <span class="text-base">♡</span>{{ 'tabs.wish' | t }}
          @if (wish.count()) {
            <span class="absolute end-4 top-1 rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-[var(--accent-ink)]">{{ wish.count() }}</span>
          }
        </a>
        <button type="button" class="relative flex flex-col items-center gap-0.5 py-2" (click)="ui.cartOpen.set(true)">
          <span class="text-base">🛒</span>{{ 'tabs.cart' | t }}
          @if (cart.count()) {
            <span class="absolute end-4 top-1 rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-[var(--accent-ink)]">{{ cart.count() }}</span>
          }
        </button>
      </div>
    </nav>
  `,
})
export class TabBar {
  readonly ui = inject(UiStore);
  readonly cart = inject(CartStore);
  readonly wish = inject(WishlistStore);
  private lastY = 0;

  constructor() {
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.ui.hideTabs.set(false));
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const y = window.scrollY;
    this.ui.hideTabs.set(y > this.lastY + 8 && y > 80);
    this.lastY = y;
  }
}
