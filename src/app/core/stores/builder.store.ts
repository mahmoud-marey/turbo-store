import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BuilderCatalog, BuilderPart, BuilderSlot } from '../models/catalog.models';
import { CatalogFacade } from '../facades/catalog.facade';
import { UiStore } from './ui.store';

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

export const BUILDER_SLOTS: BuilderSlot[] = ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'psu', 'case', 'cooler'];

export const BUILDER_PRESETS: { id: string; labelKey: string; parts: Partial<Record<BuilderSlot, string>> }[] = [
  {
    id: '1080',
    labelKey: 'builder.preset1080',
    parts: {
      cpu: 'amd-ryzen-5-7600x-cpu',
      motherboard: 'asus-prime-a620am-k-amd-a620a-socket-am5-ddr5-micro-atx-motherboard',
      ram: 'corsair-vengeance-ddr5-16gb-1x16gb-6000mhz-cl38-black-single-ram',
      gpu: 'gigabyte-geforce-rtx-5060-eagle-oc-ice-8gb-gddr6',
      storage: 'crucial-e100-480gb',
      psu: 'aerocool-650w-80plus-bronze-power-supply',
      case: 'antec-c5-argb-7-fan-mid-tower-white-case',
      cooler: 'cooler-master-masterliquid-core-nex-360-digital-aio',
    },
  },
  {
    id: '1440',
    labelKey: 'builder.preset1440',
    parts: {
      cpu: 'amd-ryzen-5-7500x3d-6-core-12-thread-processor-3d-v-cache',
      motherboard: 'asus-prime-b650m-k-amd-b650-socket-am5-ddr5-micro-atx-motherboard',
      ram: 'corsair-vengeance-ddr5-32gb-2x16gb-6000mhz-cl38-black-memory-kit',
      gpu: 'msi-geforce-rtx-5070-12g-shadow-3x-oc-graphics-card',
      storage: 'crucial-e100-480gb',
      psu: 'msi-mag-a850gl-850w',
      case: 'antec-c8-argb-full-tower-black-case',
      cooler: 'cooler-master-masterliquid-core-nex-360-digital-aio',
    },
  },
  {
    id: 'stream',
    labelKey: 'builder.presetStream',
    parts: {
      cpu: 'intel-core-i7-14700kf',
      motherboard: 'asus-prime-b760m-r-d4-motherboard',
      ram: 'patriot-viper-steel-ddr4-16gb-3200mhz-cl16-desktop-gaming-ram',
      gpu: 'msi-geforce-rtx-5070-ti-16g-shadow-3x-oc-graphics-card',
      storage: 'crucial-x9-portable-ssd-2tb',
      psu: 'msi-mag-a850gl-850w',
      case: 'antec-flux-pro-6-fan-full-tower-case',
      cooler: 'cooler-master-masterliquid-core-nex-360-digital-aio',
    },
  },
];

@Injectable({ providedIn: 'root' })
export class BuilderStore {
  private readonly catalog = inject(CatalogFacade);
  private readonly ui = inject(UiStore);
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

  readonly filled = computed(() => BUILDER_SLOTS.filter((s) => this.selected()[s]).length);

  readonly warnings = computed(() => {
    const p = this.selectedParts();
    const t = this.ui.t.bind(this.ui);
    const warns: string[] = [];
    if (p.cpu?.socket && p.motherboard?.socket && p.cpu.socket !== p.motherboard.socket) {
      warns.push(t('builder.warnSocketPair', { cpu: p.cpu.name, mb: p.motherboard.name, a: p.cpu.socket, b: p.motherboard.socket }));
    }
    if (p.ram?.ramType && p.motherboard?.ramType && p.ram.ramType !== p.motherboard.ramType) {
      warns.push(t('builder.warnRamPair', { ram: p.ram.name, mb: p.motherboard.name, a: p.ram.ramType, b: p.motherboard.ramType }));
    }
    if (p.gpu?.tdp && p.psu?.wattage && p.psu.wattage < p.gpu.tdp + 250) {
      warns.push(t('builder.warnPsuPair', { psu: p.psu.name, gpu: p.gpu.name }));
    }
    if (p.case?.form && p.motherboard?.form) {
      const rank = { ITX: 1, mATX: 2, ATX: 3, 'E-ATX': 4 } as Record<string, number>;
      if ((rank[p.case.form] ?? 3) < (rank[p.motherboard.form] ?? 3)) {
        warns.push(t('builder.warnCasePair', { case: p.case.name, mb: p.motherboard.name }));
      }
    }
    return warns;
  });

  readonly tier = computed(() => {
    const blob = `${this.selectedParts().gpu?.name ?? ''} ${this.selectedParts().cpu?.name ?? ''}`;
    if (/5090|5080|4090|4080|5070\s*ti/i.test(blob)) return { label: '4K', pct: 95 };
    if (/5070|4070|7800\s*x3d|14700|14600|7500\s*x3d/i.test(blob)) return { label: '1440p', pct: 75 };
    if (/5060|4060|3060|7600|5500|8400/i.test(blob)) return { label: '1080p', pct: 50 };
    if (this.selectedParts().gpu) return { label: '1080p', pct: 40 };
    return { label: '—', pct: 0 };
  });

  constructor() {
    effect(() => localStorage.setItem('turbo.builder', JSON.stringify(this.selected())));
    void this.hydrate();
  }

  choose(slot: BuilderSlot, slug: string): void {
    this.selected.update((s) => ({ ...s, [slot]: s[slot] === slug ? null : slug }));
  }

  applyParts(parts: Partial<Record<BuilderSlot, string | null>>): void {
    this.selected.update((s) => {
      const next = { ...s };
      (Object.keys(parts) as BuilderSlot[]).forEach((slot) => {
        if (slot in next) next[slot] = parts[slot] ?? null;
      });
      return next;
    });
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
