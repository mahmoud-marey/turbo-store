import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CatalogFacade } from '../facades/catalog.facade';
import { CatalogQuery, ProductListItem, BuilderSlot } from '../models/catalog.models';
import { BuilderStore } from '../stores/builder.store';
import { UiStore } from '../stores/ui.store';
import { AiClient, AiClientError } from './ai-client';

export type AssistantAction =
  | { action: 'search'; query: CatalogQuery }
  | { action: 'build'; parts: Partial<Record<BuilderSlot, string>> }
  | { action: 'clarify'; question: string };

export interface AssistantMsg {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  products?: ProductListItem[];
  build?: Partial<Record<BuilderSlot, string>>;
}

const SYSTEM = `You are Turbo Assistant for an Egyptian PC store (EGP).
Never invent product names, prices, or stock. Reply with a JSON object only:
{"action":"search","query":{...CatalogQuery fields}}
{"action":"build","parts":{"cpu":"slug","gpu":"slug",...}} using only slugs you were given
{"action":"clarify","question":"..."}
CatalogQuery fields: category, brand, q, minPrice, maxPrice, cpu, gpu, ram, storage, inStock (boolean), sort, order, pageSize.
Known categories: laptops, pc-bundle, graphics-cards, processors-cpus, motherboards, computer-memory-ram, ssd-external-storage, monitors-displays, pc-cases-chasses, power-supplies.
Prefer action search. For PC builds, pick slugs only from the provided builder catalog excerpt.`;

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly client = inject(AiClient);
  private readonly catalog = inject(CatalogFacade);
  private readonly builder = inject(BuilderStore);
  private readonly ui = inject(UiStore);
  readonly messages = signal<AssistantMsg[]>([]);
  readonly busy = signal(false);
  private seq = 0;

  async send(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || this.busy()) return;
    this.messages.update((m) => [...m, { id: ++this.seq, role: 'user', text: trimmed }]);
    this.busy.set(true);
    try {
      const action = await this.plan(trimmed);
      const executed = await this.execute(action);
      this.messages.update((m) => [...m, { id: ++this.seq, role: 'assistant', ...executed }]);
    } catch (e) {
      this.messages.update((m) => [...m, { id: ++this.seq, role: 'assistant', text: this.errText(e) }]);
    } finally {
      this.busy.set(false);
    }
  }

  stop(): void {
    this.client.stop();
    this.busy.set(false);
  }

  reset(): void {
    this.messages.set([]);
  }

  applyBuild(parts: Partial<Record<BuilderSlot, string>>): void {
    this.builder.applyParts(parts);
  }

  async replaySample(): Promise<void> {
    const sample = await this.httpSample();
    this.messages.set([]);
    for (const row of sample) {
      const products = await this.hydrate(row.slugs ?? []);
      this.messages.update((m) => [
        ...m,
        {
          id: ++this.seq,
          role: row.role,
          text: row.text,
          products: products.length ? products : undefined,
          build: row.build,
        },
      ]);
    }
  }

  async testConnection(): Promise<string> {
    const reply = await this.client.chat([{ role: 'user', content: 'Reply with the single word pong.' }]);
    return reply.trim();
  }

  private async httpSample(): Promise<
    { role: 'user' | 'assistant'; text: string; slugs?: string[]; build?: Partial<Record<BuilderSlot, string>> }[]
  > {
    const res = await fetch('data/ai-samples.json');
    const data = (await res.json()) as {
      messages: { role: 'user' | 'assistant'; text: string; slugs?: string[]; build?: Partial<Record<BuilderSlot, string>> }[];
    };
    return data.messages;
  }

  private async plan(text: string): Promise<AssistantAction> {
    const excerpt = await this.builderExcerpt();
    const content = await this.client.chat(
      [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `Shopper language: ${this.ui.lang()}\nRequest: ${text}\nBuilder slugs (sample):\n${excerpt}`,
        },
      ],
      { json: true },
    );
    return this.parseAction(content);
  }

  private parseAction(raw: string): AssistantAction {
    const json = raw.replace(/^```json\s*|\s*```$/g, '').trim();
    try {
      const parsed = JSON.parse(json) as AssistantAction;
      if (parsed && (parsed.action === 'search' || parsed.action === 'build' || parsed.action === 'clarify')) return parsed;
    } catch {
      /* fall through */
    }
    return { action: 'search', query: { q: raw.slice(0, 80), pageSize: 12 } };
  }

  private async execute(action: AssistantAction): Promise<Omit<AssistantMsg, 'id' | 'role'>> {
    if (action.action === 'clarify') return { text: action.question };
    if (action.action === 'build') {
      const phrase = await this.phrase(`Recommend this PC build using only these part slugs: ${JSON.stringify(action.parts)}`);
      return { text: phrase, build: action.parts };
    }
    const q: CatalogQuery = { page: 1, pageSize: 12, ...action.query };
    const page = await firstValueFrom(this.catalog.list(q));
    const top = page.items.slice(0, 15);
    const brief = top.map((p) => `${p.slug} | ${p.name} | ${p.price} EGP | ${p.brand}`).join('\n');
    const phrase = await this.phrase(
      `Phrase a short shopping recommendation in ${this.ui.lang() === 'ar' ? 'Arabic' : 'English'} from these REAL products only. Do not invent others.\n${brief}`,
    );
    return { text: phrase, products: top.slice(0, 6) };
  }

  private async phrase(prompt: string): Promise<string> {
    try {
      return await this.client.chat([
        { role: 'system', content: 'You write concise store copy. Never invent products or prices.' },
        { role: 'user', content: prompt },
      ]);
    } catch {
      return this.ui.t('ai.thinking');
    }
  }

  private async hydrate(slugs: string[]): Promise<ProductListItem[]> {
    if (!slugs.length) return [];
    const page = await firstValueFrom(this.catalog.list({ page: 1, pageSize: 1000 }));
    const map = new Map(page.items.map((p) => [p.slug, p]));
    return slugs.map((s) => map.get(s)).filter((p): p is ProductListItem => !!p);
  }

  private async builderExcerpt(): Promise<string> {
    const cat = this.builder.parts() ?? (await firstValueFrom(this.catalog.builder()));
    const slots: BuilderSlot[] = ['cpu', 'gpu', 'motherboard', 'ram'];
    return slots
      .map((s) => `${s}: ${cat[s].slice(0, 8).map((p) => p.slug).join(', ')}`)
      .join('\n');
  }

  private errText(e: unknown): string {
    if (e instanceof AiClientError) {
      if (e.code === '401') return this.ui.t('ai.error401');
      if (e.code === '429') return this.ui.t('ai.error429');
      if (e.code === 'net') return this.ui.t('ai.errorNet');
    }
    return this.ui.t('error.text');
  }
}
