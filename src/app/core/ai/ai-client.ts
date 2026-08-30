import { inject, Injectable } from '@angular/core';
import { AiConfigStore } from './ai-config.store';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export class AiClientError extends Error {
  constructor(
    message: string,
    readonly code: '401' | '429' | 'net' | 'other',
  ) {
    super(message);
  }
}

@Injectable({ providedIn: 'root' })
export class AiClient {
  private readonly cfg = inject(AiConfigStore);
  private abort: AbortController | null = null;

  stop(): void {
    this.abort?.abort();
    this.abort = null;
  }

  async chat(messages: ChatMessage[], opts: { json?: boolean } = {}): Promise<string> {
    const c = this.cfg.config();
    const base = c.baseUrl.replace(/\/+$/, '');
    this.abort = new AbortController();
    let res: Response;
    try {
      res = await fetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${c.apiKey}`,
        },
        signal: this.abort.signal,
        body: JSON.stringify({
          model: c.model,
          messages,
          temperature: 0.2,
          ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
        }),
      });
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      throw new AiClientError('network', 'net');
    }
    if (res.status === 401) throw new AiClientError('401', '401');
    if (res.status === 429) throw new AiClientError('429', '429');
    if (!res.ok) throw new AiClientError(`HTTP ${res.status}`, 'other');
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return body.choices?.[0]?.message?.content ?? '';
  }
}
