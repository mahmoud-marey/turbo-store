import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { EgpPipe } from '../../core/i18n/egp.pipe';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-order',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, EgpPipe],
  template: `
    <div class="container-page max-w-2xl py-16 text-center">
      <p class="text-[var(--accent)]">{{ 'checkout.success' | t }}</p>
      <h1 class="mt-2 font-display text-4xl font-bold">{{ 'checkout.thanks' | t }}</h1>
      <p class="mt-4">{{ 'checkout.number' | t }}: <strong>{{ order?.id }}</strong></p>
      <p class="mt-2 text-[var(--text-muted)]">{{ order?.total | egp }}</p>
      <div class="mt-8 flex justify-center gap-3">
        <a class="rounded-xl bg-[var(--accent)] px-4 py-2 font-bold text-[var(--accent-ink)]" [href]="wa()" target="_blank" rel="noopener">{{ 'checkout.whatsapp' | t }}</a>
        <button type="button" class="rounded-xl border border-[var(--border)] px-4 py-2" (click)="print()">{{ 'checkout.print' | t }}</button>
      </div>
    </div>
  `,
})
export class OrderPage {
  readonly order = JSON.parse(sessionStorage.getItem('turbo.order') || 'null') as { id: string; total: number; form: { name: string }; items: { product: { name: string }; qty: number }[] } | null;
  constructor() {
    inject(SeoService).set('Order confirmed');
  }
  wa(): string {
    const lines = (this.order?.items ?? []).map((i) => `${i.product.name} × ${i.qty}`).join('\n');
    return `https://api.whatsapp.com/send/?phone=201144413879&text=${encodeURIComponent(`طلب ${this.order?.id}\n${this.order?.form?.name}\n${lines}`)}`;
  }
  print(): void {
    window.print();
  }
}
