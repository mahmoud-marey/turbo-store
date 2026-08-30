import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';

@Component({
  selector: 'app-scroll-top',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <button
        type="button"
        class="fixed end-4 z-40 grid h-11 w-11 place-items-center rounded-full bg-[var(--accent)] text-lg font-bold text-[var(--accent-ink)] shadow-[var(--shadow)]"
        style="bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px))"
        (click)="top()"
        aria-label="Back to top"
      >
        ↑
      </button>
    }
  `,
})
export class ScrollTop {
  readonly show = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.show.set(window.scrollY > 600);
  }

  top(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
