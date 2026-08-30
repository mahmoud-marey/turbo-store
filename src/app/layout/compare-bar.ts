import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompareStore } from '../core/stores/lists.store';
import { TranslatePipe } from '../core/i18n/translate.pipe';

@Component({
  selector: 'app-compare-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  template: `
    @if (compare.count()) {
      <div class="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--bg-elevated)]/95 backdrop-blur">
        <div class="container-page flex items-center gap-3 py-3">
          @for (p of compare.items(); track p.slug) {
            <img [src]="p.image" [alt]="p.name" class="h-10 w-10 object-contain" />
          }
          <a routerLink="/compare" class="ms-auto rounded-xl bg-[var(--accent)] px-4 py-2 font-bold text-[var(--accent-ink)]">{{ 'compare.title' | t }} ({{ compare.count() }})</a>
          <button type="button" class="text-sm" (click)="compare.clear()">{{ 'compare.clear' | t }}</button>
        </div>
      </div>
    }
  `,
})
export class CompareBar {
  readonly compare = inject(CompareStore);
}
