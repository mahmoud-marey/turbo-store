import { computed, effect, Injectable, signal } from '@angular/core';

export type AiProvider = 'openai' | 'compatible';

export interface AiConfig {
  provider: AiProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
}

const KEY = 'turbo.ai';
const DEFAULTS: AiConfig = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com',
  model: 'gpt-5.6-terra',
  apiKey: '',
};

@Injectable({ providedIn: 'root' })
export class AiConfigStore {
  readonly config = signal<AiConfig>(this.read());
  readonly configured = computed(() => !!this.config().apiKey.trim());
  readonly showSettings = signal(false);

  constructor() {
    effect(() => localStorage.setItem(KEY, JSON.stringify(this.config())));
  }

  patch(partial: Partial<AiConfig>): void {
    this.config.update((c) => {
      const next = { ...c, ...partial };
      if (partial.provider === 'openai' && !partial.baseUrl) next.baseUrl = 'https://api.openai.com';
      return next;
    });
  }

  forget(): void {
    this.config.update((c) => ({ ...c, apiKey: '' }));
  }

  private read(): AiConfig {
    try {
      return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) || '{}') as object) };
    } catch {
      return { ...DEFAULTS };
    }
  }
}
