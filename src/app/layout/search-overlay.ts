import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogFacade } from '../core/facades/catalog.facade';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { EgpPipe } from '../core/i18n/egp.pipe';
import { UiStore } from '../core/stores/ui.store';
import { OverlayDirective } from '../shared/overlay';
import { looksLikeNaturalLanguage } from '../core/ai/nl';

const RECENT_KEY = 'turbo.recentSearch';

@Component({
  selector: 'app-search-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, EgpPipe, RouterLink, OverlayDirective],
  template: `
    <button
      type="button"
      class="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] md:hidden"
      (click)="openSheet()"
      aria-label="Search"
    >
      ⌕
    </button>
    <div class="relative hidden md:block">
      <input
        class="w-56 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm lg:w-72"
        [placeholder]="'search.placeholder' | t"
        [value]="query()"
        (input)="onInput($event)"
        (keydown.enter)="go()"
        (focus)="desktopOpen.set(true)"
      />
      @if (desktopOpen() && (hits().length || query())) {
        <div class="absolute end-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow)]">
          @for (p of hits(); track p.slug) {
            <a [routerLink]="['/p', p.slug]" class="flex gap-3 px-3 py-2 hover:bg-[var(--bg-card)]" (click)="desktopOpen.set(false)">
              <img [src]="p.image" alt="" class="h-12 w-12 object-contain" />
              <span class="min-w-0">
                <span class="line-clamp-1 text-sm">{{ p.name }}</span>
                <span class="text-xs text-[var(--accent)]">{{ p.price | egp }}</span>
              </span>
            </a>
          }
          @if (!hits().length && query()) {
            <p class="px-3 py-4 text-sm text-[var(--text-muted)]">{{ 'search.noResults' | t }}</p>
          }
          @if (nl()) {
            <button type="button" class="block w-full px-3 py-3 text-start text-sm font-bold text-[var(--accent)]" (click)="ask()">
              {{ 'search.ask' | t }}
            </button>
          }
        </div>
      }
    </div>

    @if (ui.searchOpen()) {
      <div class="fixed inset-0 z-[60] bg-[var(--bg)] md:hidden">
        <div appOverlay class="flex h-full flex-col" (closed)="closeSheet()">
          <div class="flex items-center gap-2 border-b border-[var(--border)] px-3 py-3">
            <input
              class="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm"
              [placeholder]="'search.placeholder' | t"
              [value]="query()"
              (input)="onInput($event)"
              (keydown.enter)="go()"
              autofocus
            />
            <button type="button" class="px-2" (click)="closeSheet()">{{ 'filters.clear' | t }}</button>
          </div>
          <div class="flex-1 overflow-auto p-4">
            @if (nl()) {
              <button type="button" class="mb-4 w-full rounded-xl border border-[var(--accent)] px-3 py-3 text-start font-bold text-[var(--accent)]" (click)="ask()">
                {{ 'search.ask' | t }}
              </button>
            }
            @if (hits().length) {
              @for (p of hits(); track p.slug) {
                <a [routerLink]="['/p', p.slug]" class="mb-2 flex gap-3 rounded-xl p-2 hover:bg-[var(--bg-card)]" (click)="closeSheet()">
                  <img [src]="p.image" alt="" class="h-14 w-14 object-contain" />
                  <span class="min-w-0">
                    <span class="line-clamp-2 text-sm">{{ p.name }}</span>
                    <span class="text-xs text-[var(--accent)]">{{ p.price | egp }}</span>
                  </span>
                </a>
              }
            } @else if (query()) {
              <p class="text-sm text-[var(--text-muted)]">{{ 'search.noResults' | t }}</p>
            }
            @if (recent().length) {
              <p class="mb-2 mt-4 text-xs uppercase text-[var(--text-muted)]">{{ 'search.recent' | t }}</p>
              <div class="flex flex-wrap gap-2">
                @for (r of recent(); track r) {
                  <button type="button" class="rounded-full border border-[var(--border)] px-3 py-1 text-sm" (click)="useRecent(r)">{{ r }}</button>
                }
              </div>
            }
            <p class="mb-2 mt-6 text-xs uppercase text-[var(--text-muted)]">{{ 'search.trending' | t }}</p>
            <div class="flex flex-wrap gap-2">
              @for (c of trending; track c.slug) {
                <a [routerLink]="['/c', c.slug]" class="rounded-full border border-[var(--border)] px-3 py-1 text-sm" (click)="closeSheet()">{{ c.label }}</a>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class SearchOverlay {
  private readonly catalog = inject(CatalogFacade);
  private readonly router = inject(Router);
  readonly ui = inject(UiStore);
  readonly desktopOpen = signal(false);
  readonly query = signal('');
  readonly recent = signal<string[]>(this.readRecent());
  private readonly q$ = new Subject<string>();
  readonly hits = toSignal(
    this.q$.pipe(
      debounceTime(180),
      distinctUntilChanged(),
      switchMap((q) => (q ? this.catalog.suggestions(q) : of([]))),
    ),
    { initialValue: [] },
  );
  readonly nl = computed(() => looksLikeNaturalLanguage(this.query()));
  readonly trending = [
    { slug: 'laptops', label: 'Laptops' },
    { slug: 'pc-bundle', label: 'PC Bundles' },
    { slug: 'graphics-cards', label: 'GPUs' },
    { slug: 'monitors-displays', label: 'Monitors' },
  ];

  onInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    this.query.set(v);
    this.desktopOpen.set(true);
    this.q$.next(v);
  }

  openSheet(): void {
    this.ui.searchOpen.set(true);
  }

  closeSheet(): void {
    this.ui.searchOpen.set(false);
  }

  go(): void {
    const q = this.query().trim();
    if (!q) return;
    this.remember(q);
    this.desktopOpen.set(false);
    this.closeSheet();
    void this.router.navigate(['/search'], { queryParams: { q } });
  }

  ask(): void {
    const q = this.query().trim();
    this.remember(q);
    this.desktopOpen.set(false);
    this.closeSheet();
    this.ui.assistantOpen.set(true);
    this.ui.assistantSeed.set(q);
  }

  useRecent(q: string): void {
    this.query.set(q);
    this.q$.next(q);
    void this.router.navigate(['/search'], { queryParams: { q } });
    this.closeSheet();
  }

  private remember(q: string): void {
    const next = [q, ...this.recent().filter((x) => x !== q)].slice(0, 8);
    this.recent.set(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }

  private readRecent(): string[] {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[];
    } catch {
      return [];
    }
  }
}
