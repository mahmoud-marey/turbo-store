import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-4" [class.grid-cols-2]="cols() >= 2" [class.lg:grid-cols-4]="cols() >= 4">
      @for (i of items(); track i) {
        <div class="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
          <div class="aspect-square bg-[var(--bg-elevated)]"></div>
          <div class="space-y-2 p-4">
            <div class="h-3 w-1/3 rounded bg-[var(--border)]"></div>
            <div class="h-4 w-full rounded bg-[var(--border)]"></div>
            <div class="h-4 w-2/3 rounded bg-[var(--border)]"></div>
          </div>
        </div>
      }
    </div>
  `,
})
export class SkeletonGrid {
  readonly cols = input(4);
  readonly count = input(8);
  items(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
