import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, RouterLink],
  template: `
    <div class="rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
      <p class="font-display text-xl">{{ titleKey() | t }}</p>
      <p class="mt-2 text-[var(--text-muted)]">{{ textKey() | t }}</p>
      <a routerLink="/" class="mt-6 inline-block rounded-xl bg-[var(--accent)] px-4 py-2 font-bold text-[var(--accent-ink)]">{{ 'nav.home' | t }}</a>
    </div>
  `,
})
export class EmptyState {
  readonly titleKey = input('empty.title');
  readonly textKey = input('empty.text');
}
