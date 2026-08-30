import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BuilderStore } from '../../core/stores/builder.store';
import { CartStore } from '../../core/stores/cart.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { EgpPipe } from '../../core/i18n/egp.pipe';
import { BuilderSlot } from '../../core/models/catalog.models';
import { SeoService } from '../../core/services/seo.service';
import { UiStore } from '../../core/stores/ui.store';

@Component({
  selector: 'app-builder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, EgpPipe],
  template: `
    <div class="container-page py-10">
      <h1 class="font-display text-4xl font-bold">{{ 'builder.title' | t }}</h1>
      <p class="mt-2 text-[var(--text-muted)]">{{ 'builder.subtitle' | t }}</p>
      <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div class="space-y-8">
          @for (slot of slots; track slot) {
            <section>
              <h2 class="mb-3 font-display text-xl">{{ 'builder.' + slot | t }}</h2>
              <div class="grid gap-3 sm:grid-cols-2">
                @for (part of builder.parts()?.[slot] ?? []; track part.slug) {
                  <button type="button" class="flex gap-3 rounded-2xl border p-3 text-start" [class.border-[var(--accent)]]="builder.selected()[slot] === part.slug" [class.border-[var(--border)]]="builder.selected()[slot] !== part.slug" (click)="builder.choose(slot, part.slug)">
                    <img [src]="part.image" alt="" class="h-16 w-16 object-contain" />
                    <span class="min-w-0">
                      <span class="line-clamp-2 text-sm font-medium">{{ part.name }}</span>
                      <span class="text-[var(--accent)]">{{ part.price | egp }}</span>
                    </span>
                  </button>
                }
              </div>
            </section>
          }
        </div>
        <aside class="h-fit rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 lg:sticky lg:top-24">
          <p class="text-sm text-[var(--text-muted)]">{{ 'builder.compat' | t }}</p>
          @if (!builder.warnings().length) {
            <p class="mt-2 text-[var(--color-success)]">{{ 'builder.ok' | t }}</p>
          } @else {
            @for (w of builder.warnings(); track w) {
              <p class="mt-2 text-sm text-[var(--color-danger)]">{{ w | t }}</p>
            }
          }
          <p class="mt-6 text-sm">{{ 'builder.total' | t }}</p>
          <p class="price text-3xl font-bold text-[var(--accent)]">{{ builder.total() | egp }}</p>
          <button type="button" class="mt-5 w-full rounded-xl bg-[var(--accent)] py-3 font-bold text-[var(--accent-ink)]" (click)="addAll()">{{ 'builder.addAll' | t }}</button>
        </aside>
      </div>
    </div>
  `,
})
export class BuilderPage {
  readonly builder = inject(BuilderStore);
  readonly cart = inject(CartStore);
  readonly ui = inject(UiStore);
  readonly slots: BuilderSlot[] = ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'psu', 'case', 'cooler'];
  constructor() {
    inject(SeoService).set('PC Builder');
  }
  addAll(): void {
    for (const part of Object.values(this.builder.selectedParts())) {
      if (part) this.cart.add(part.slug);
    }
    this.ui.cartOpen.set(true);
  }
}
