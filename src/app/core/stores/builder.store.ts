import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BuilderCatalog, BuilderPart, BuilderSlot } from '../models/catalog.models';
import { CatalogFacade } from '../facades/catalog.facade';

const EMPTY: Record<BuilderSlot, string | null> = {
  cpu: null,
  motherboard: null,
  ram: null,
  gpu: null,
  storage: null,
  psu: null,
  case: null,
  cooler: null,
};

@Injectable({ providedIn: 'root' })
export class BuilderStore {
  private readonly catalog = inject(CatalogFacade);
  readonly selected = signal<Record<BuilderSlot, string | null>>(this.read());
  readonly parts = signal<BuilderCatalog | null>(null);

  readonly selectedParts = computed(() => {
    const cat = this.parts();
    const sel = this.selected();
    if (!cat) return {} as Partial<Record<BuilderSlot, BuilderPart>>;
    const out: Partial<Record<BuilderSlot, BuilderPart>> = {};
    (Object.keys(sel) as BuilderSlot[]).forEach((slot) => {
      const slug = sel[slot];
      if (!slug) return;
      out[slot] = cat[slot].find((p) => p.slug === slug);
    });
    return out;
  });

  readonly total = computed(() =>
    Object.values(this.selectedParts()).reduce((n, p) => n + (p?.price ?? 0), 0),
  );

  readonly warnings = computed(() => {
    const p = this.selectedParts();
    const warns: string[] = [];
    if (p.cpu?.socket && p.motherboard?.socket && p.cpu.socket !== p.motherboard.socket) {
      warns.push('builder.warnSocket');
    }
    if (p.ram?.ramType && p.motherboard?.ramType && p.ram.ramType !== p.motherboard.ramType) {
      warns.push('builder.warnRam');
    }
    if (p.gpu?.tdp && p.psu?.wattage && p.psu.wattage < p.gpu.tdp + 250) {
      warns.push('builder.warnPsu');
    }
    if (p.case?.form && p.motherboard?.form) {
      const rank = { ITX: 1, mATX: 2, ATX: 3, 'E-ATX': 4 } as Record<string, number>;
      if ((rank[p.case.form] ?? 3) < (rank[p.motherboard.form] ?? 3)) warns.push('builder.warnCase');
    }
    return warns;
  });

  constructor() {
    effect(() => localStorage.setItem('turbo.builder', JSON.stringify(this.selected())));
    void this.hydrate();
  }

  choose(slot: BuilderSlot, slug: string): void {
    this.selected.update((s) => ({ ...s, [slot]: s[slot] === slug ? null : slug }));
  }

  clear(): void {
    this.selected.set({ ...EMPTY });
  }

  private async hydrate(): Promise<void> {
    this.parts.set(await firstValueFrom(this.catalog.builder()));
  }

  private read(): Record<BuilderSlot, string | null> {
    try {
      return { ...EMPTY, ...(JSON.parse(localStorage.getItem('turbo.builder') || '{}') as object) };
    } catch {
      return { ...EMPTY };
    }
  }
}
