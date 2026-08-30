import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-toasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="pointer-events-none fixed inset-x-0 top-20 z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite" aria-relevant="additions">
      @for (t of toasts.items(); track t.id) {
        <div
          class="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 shadow-[var(--shadow)]"
          [class.border-[var(--color-danger)]]="t.kind === 'warn'"
          role="status"
        >
          <p class="text-sm">{{ t.message }}</p>
          @if (t.action && t.href) {
            <a [routerLink]="t.href" class="text-sm font-bold text-[var(--accent)]" (click)="toasts.dismiss(t.id)">{{ t.action }}</a>
          }
          <button type="button" class="ms-auto text-xs text-[var(--text-muted)]" (click)="toasts.dismiss(t.id)" aria-label="Dismiss">✕</button>
        </div>
      }
    </div>
  `,
})
export class Toasts {
  readonly toasts = inject(ToastService);
}
