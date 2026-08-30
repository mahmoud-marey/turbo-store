import { afterNextRender, Directive, ElementRef, inject, OnDestroy, output } from '@angular/core';

@Directive({
  selector: '[appOverlay]',
  host: {
    role: 'dialog',
    '[attr.aria-modal]': 'true',
    '(document:keydown.escape)': 'onEscape($event)',
    '(keydown)': 'onKey($event)',
  },
})
export class OverlayDirective implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  readonly closed = output<void>();
  private prev: HTMLElement | null = null;

  constructor() {
    this.prev = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    afterNextRender(() => {
      const first = this.focusables()[0];
      first?.focus();
    });
  }

  onEscape(ev: Event): void {
    ev.preventDefault();
    this.closed.emit();
  }

  onKey(ev: KeyboardEvent): void {
    if (ev.key !== 'Tab') return;
    const nodes = this.focusables();
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (ev.shiftKey && document.activeElement === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && document.activeElement === last) {
      ev.preventDefault();
      first.focus();
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.prev?.focus();
  }

  private focusables(): HTMLElement[] {
    const nodes = this.el.nativeElement.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    const out: HTMLElement[] = [];
    nodes.forEach((n: Element) => {
      if (n instanceof HTMLElement && !n.hasAttribute('disabled') && n.getClientRects().length > 0) out.push(n);
    });
    return out;
  }
}
