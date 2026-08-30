import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '../core/i18n/translate.pipe';

@Component({
  selector: 'app-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <div class="rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
      <p class="font-display text-xl">{{ 'error.title' | t }}</p>
      <p class="mt-2 text-[var(--text-muted)]">{{ message() || ('error.text' | t) }}</p>
      <button type="button" class="mt-6 rounded-xl bg-[var(--accent)] px-4 py-2 font-bold text-[var(--accent-ink)]" (click)="retry.emit()">
        {{ 'error.retry' | t }}
      </button>
    </div>
  `,
})
export class ErrorState {
  readonly message = input('');
  readonly retry = output<void>();
}
