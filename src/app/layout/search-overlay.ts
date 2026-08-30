import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogFacade } from '../core/facades/catalog.facade';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { EgpPipe } from '../core/i18n/egp.pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-search-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, EgpPipe, RouterLink],
  template: `
    <div class="relative hidden md:block">
      <input
        class="w-56 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm lg:w-72"
        [placeholder]="'search.placeholder' | t"
        (input)="onInput($event)"
        (keydown.enter)="go()"
      />
      @if (open() && (hits().length || query())) {
        <div class="absolute end-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow)]">
          @for (p of hits(); track p.slug) {
            <a [routerLink]="['/p', p.slug]" class="flex gap-3 px-3 py-2 hover:bg-[var(--bg-card)]" (click)="open.set(false)">
              <img [src]="p.image" alt="" class="h-12 w-12 object-contain" />
              <span class="min-w-0">
                <span class="line-clamp-1 text-sm">{{ p.name }}</span>
                <span class="text-xs text-[var(--accent)]">{{ p.price | egp }}</span>
              </span>
            </a>
          }
          @if (!hits().length) {
            <p class="px-3 py-4 text-sm text-[var(--text-muted)]">{{ 'search.noResults' | t }}</p>
          }
        </div>
      }
    </div>
  `,
})
export class SearchOverlay {
  private readonly catalog = inject(CatalogFacade);
  private readonly router = inject(Router);
  readonly open = signal(false);
  readonly query = signal('');
  private readonly q$ = new Subject<string>();
  readonly hits = toSignal(this.q$.pipe(debounceTime(180), distinctUntilChanged(), switchMap((q) => (q ? this.catalog.suggestions(q) : of([])))), {
    initialValue: [],
  });

  onInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    this.query.set(v);
    this.open.set(true);
    this.q$.next(v);
  }

  go(): void {
    const q = this.query().trim();
    if (!q) return;
    this.open.set(false);
    void this.router.navigate(['/search'], { queryParams: { q } });
  }
}
