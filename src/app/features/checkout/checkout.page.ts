import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartStore } from '../../core/stores/cart.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { EgpPipe } from '../../core/i18n/egp.pipe';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe, EgpPipe],
  template: `
    <div class="container-page max-w-3xl py-10">
      <h1 class="font-display text-3xl font-bold">{{ 'checkout.title' | t }}</h1>
      <ol class="my-6 flex gap-2 text-sm">
        @for (s of steps; track s; let i = $index) {
          <li class="rounded-full px-3 py-1" [class.bg-[var(--accent)]]="i === step()" [class.text-[var(--accent-ink)]]="i === step()">{{ s | t }}</li>
        }
      </ol>
      @if (step() === 0) {
        <div class="grid gap-3">
          <input class="rounded-xl border border-[var(--border)] bg-transparent px-3 py-3" [placeholder]="'checkout.name' | t" [(ngModel)]="form.name" />
          <input class="rounded-xl border border-[var(--border)] bg-transparent px-3 py-3" [placeholder]="'checkout.phone' | t" [(ngModel)]="form.phone" />
          <input class="rounded-xl border border-[var(--border)] bg-transparent px-3 py-3" [placeholder]="'checkout.city' | t" [(ngModel)]="form.city" />
          <textarea class="rounded-xl border border-[var(--border)] bg-transparent px-3 py-3" [placeholder]="'checkout.address' | t" [(ngModel)]="form.address"></textarea>
        </div>
      }
      @if (step() === 1) {
        <p class="text-[var(--text-muted)]">Cairo & Giza: 1–2 days · Other governorates: 2–5 days</p>
        <label class="mt-4 flex items-center gap-2"><input type="radio" name="d" checked /> Cairo / Giza — 80 EGP</label>
        <label class="mt-2 flex items-center gap-2"><input type="radio" name="d" /> Other governorates — 120 EGP</label>
      }
      @if (step() === 2) {
        <label class="flex items-center gap-2"><input type="radio" name="p" checked /> {{ 'checkout.cod' | t }}</label>
        <label class="mt-2 flex items-center gap-2"><input type="radio" name="p" /> {{ 'checkout.card' | t }}</label>
        <label class="mt-2 flex items-center gap-2"><input type="radio" name="p" /> {{ 'checkout.instapay' | t }}</label>
      }
      @if (step() === 3) {
        <ul class="space-y-2">
          @for (l of cart.items(); track l.slug) {
            <li class="flex justify-between text-sm"><span>{{ l.product.name }} × {{ l.qty }}</span><span>{{ l.product.price * l.qty | egp }}</span></li>
          }
        </ul>
        <p class="mt-4 text-xl font-bold">{{ 'cart.total' | t }}: {{ cart.total() | egp }}</p>
      }
      <div class="mt-8 flex justify-between">
        <button type="button" class="rounded-xl border border-[var(--border)] px-4 py-2" [disabled]="step() === 0" (click)="back()">Back</button>
        @if (step() < 3) {
          <button type="button" class="rounded-xl bg-[var(--accent)] px-5 py-2 font-bold text-[var(--accent-ink)]" (click)="next()">Next</button>
        } @else {
          <button type="button" class="rounded-xl bg-[var(--accent)] px-5 py-2 font-bold text-[var(--accent-ink)]" (click)="place()">{{ 'checkout.place' | t }}</button>
        }
      </div>
    </div>
  `,
})
export class CheckoutPage {
  readonly cart = inject(CartStore);
  private readonly router = inject(Router);
  readonly step = signal(0);
  readonly steps = ['checkout.shipping', 'checkout.delivery', 'checkout.payment', 'checkout.review'];
  form = { name: '', phone: '', city: '', address: '' };
  constructor() {
    inject(SeoService).set('Checkout');
  }
  back(): void {
    this.step.update((s) => Math.max(0, s - 1));
  }
  next(): void {
    this.step.update((s) => s + 1);
  }
  place(): void {
    const id = 'TRB-' + Date.now().toString(36).toUpperCase();
    sessionStorage.setItem(
      'turbo.order',
      JSON.stringify({ id, form: this.form, items: this.cart.items(), total: this.cart.total() }),
    );
    this.cart.clear();
    void this.router.navigate(['/order', id]);
  }
}
