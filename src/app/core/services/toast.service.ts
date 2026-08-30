import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  action?: string;
  href?: string;
  kind?: 'ok' | 'warn';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly items = signal<Toast[]>([]);

  show(message: string, opts: Pick<Toast, 'action' | 'href' | 'kind'> = {}): void {
    const id = ++this.seq;
    this.items.update((list) => [...list, { id, message, ...opts }]);
    setTimeout(() => this.dismiss(id), 3800);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((t) => t.id !== id));
  }
}
