import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'app-qty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-flex items-center rounded-xl border border-[var(--border)]">
      <button type="button" class="px-3 py-2" (click)="dec()" aria-label="Decrease">−</button>
      <input class="w-10 bg-transparent text-center" [value]="qty()" (input)="onInput($event)" />
      <button type="button" class="px-3 py-2" (click)="inc()" aria-label="Increase">+</button>
    </div>
  `,
})
export class QtyStepper {
  readonly qty = model(1);
  readonly min = input(1);
  dec(): void {
    this.qty.update((q) => Math.max(this.min(), q - 1));
  }
  inc(): void {
    this.qty.update((q) => q + 1);
  }
  onInput(ev: Event): void {
    const v = Number((ev.target as HTMLInputElement).value);
    this.qty.set(Number.isFinite(v) ? Math.max(this.min(), v) : this.min());
  }
}
