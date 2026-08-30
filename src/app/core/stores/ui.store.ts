import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type Lang = 'en' | 'ar';
export type Theme = 'dark' | 'light';
export type ViewMode = 'grid' | 'list';

@Injectable({ providedIn: 'root' })
export class UiStore {
  private readonly http = inject(HttpClient);
  readonly lang = signal<Lang>(this.read('turbo.lang', 'en'));
  readonly theme = signal<Theme>(this.read('turbo.theme', 'dark'));
  readonly viewMode = signal<ViewMode>(this.read('turbo.view', 'grid'));
  readonly cartOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly navOpen = signal(false);
  readonly dict = signal<Record<string, string>>({});

  readonly dir = computed(() => (this.lang() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    effect(() => {
      localStorage.setItem('turbo.lang', this.lang());
      localStorage.setItem('turbo.theme', this.theme());
      localStorage.setItem('turbo.view', this.viewMode());
      document.documentElement.lang = this.lang();
      document.documentElement.dir = this.dir();
      document.documentElement.dataset['theme'] = this.theme();
    });
    void this.load(this.lang());
  }

  t(key: string): string {
    return this.dict()[key] ?? key;
  }

  async setLang(lang: Lang): Promise<void> {
    this.lang.set(lang);
    await this.load(lang);
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private async load(lang: Lang): Promise<void> {
    const dict = await firstValueFrom(this.http.get<Record<string, string>>(`i18n/${lang}.json`));
    this.dict.set(dict);
  }

  private read<T extends string>(key: string, fallback: T): T {
    try {
      return (localStorage.getItem(key) as T) || fallback;
    } catch {
      return fallback;
    }
  }
}
