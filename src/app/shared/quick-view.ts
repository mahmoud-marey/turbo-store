import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '../core/models/catalog.models';
import { EgpPipe } from '../core/i18n/egp.pipe';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { OverlayDirective } from './overlay';

@Component({
  selector: 'app-quick-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EgpPipe, TranslatePipe, OverlayDirective],
  template: `
    @if (product(); as p) {
      <div class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" (click)="closed.emit()">
        <div
          appOverlay
          class="grid max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-[var(--bg-elevated)] md:grid-cols-2"
          (click)="$event.stopPropagation()"
          (closed)="closed.emit()"
        >
          <img [src]="p.image" [alt]="p.name" class="h-72 w-full object-contain bg-black/20 p-6 md:h-full" />
          <div class="p-6">
            <p class="text-xs uppercase text-[var(--text-muted)]">{{ p.brand }}</p>
            <h3 class="mt-2 font-display text-xl font-bold">{{ p.name }}</h3>
            <p class="mt-3 text-2xl text-[var(--accent)]">{{ p.price | egp }}</p>
            <p class="mt-3 text-sm text-[var(--text-muted)]">{{ p.shortDescription }}</p>
            <a [routerLink]="['/p', p.slug]" class="mt-6 inline-block rounded-xl bg-[var(--accent)] px-4 py-2 font-bold text-[var(--accent-ink)]" (click)="closed.emit()">{{ 'quickview' | t }}</a>
          </div>
        </div>
      </div>
    }
  `,
})
export class QuickView {
  readonly product = input<ProductListItem | null>(null);
  readonly closed = output<void>();
}
