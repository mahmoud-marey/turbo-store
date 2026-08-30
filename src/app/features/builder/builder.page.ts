import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BUILDER_PRESETS, BUILDER_SLOTS, BuilderStore } from '../../core/stores/builder.store';
import { CartStore } from '../../core/stores/cart.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { EgpPipe } from '../../core/i18n/egp.pipe';
import { BuilderSlot, ProductListItem } from '../../core/models/catalog.models';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { UiStore } from '../../core/stores/ui.store';
import { CatalogFacade } from '../../core/facades/catalog.facade';

@Component({
  selector: 'app-builder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, EgpPipe, RouterLink],
  template: `
    <div class="container-page py-10">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="font-display text-4xl font-bold">{{ 'builder.title' | t }}</h1>
          <p class="mt-2 text-[var(--text-muted)]">{{ 'builder.subtitle' | t }}</p>
        </div>
        <button type="button" class="rounded-xl border border-[var(--accent)] px-4 py-2 font-bold text-[var(--accent)]" (click)="help()">
          {{ 'builder.help' | t }}
        </button>
      </div>

      <div class="mt-6">
        <p class="text-sm text-[var(--text-muted)]">{{ ui.t('builder.step', { n: step() + 1, total: slots.length + 1 }) }}</p>
        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
          <div class="h-full bg-[var(--accent)]" [style.width.%]="((step() + 1) / (slots.length + 1)) * 100"></div>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap gap-2">
        <p class="w-full text-sm font-medium">{{ 'builder.presets' | t }}</p>
        @for (pre of presets; track pre.id) {
          <button type="button" class="rounded-full border border-[var(--border)] px-3 py-1 text-sm" (click)="applyPreset(pre.parts)">{{ pre.labelKey | t }}</button>
        }
      </div>
      @if (bundles().items.length) {
        <div class="mt-4">
          <p class="mb-2 text-sm font-medium">{{ 'builder.bundles' | t }}</p>
          <div class="flex gap-3 overflow-auto pb-2">
            @for (b of bundles().items; track b.slug) {
              <a [routerLink]="['/p', b.slug]" class="w-48 shrink-0 rounded-2xl border border-[var(--border)] p-3">
                <img [src]="b.image" alt="" class="h-20 w-full object-contain" />
                <p class="mt-2 line-clamp-2 text-xs">{{ b.name }}</p>
                <p class="text-sm text-[var(--accent)]">{{ b.price | egp }}</p>
              </a>
            }
          </div>
        </div>
      }

      <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          @if (step() < slots.length) {
            <h2 class="mb-3 font-display text-xl">{{ 'builder.' + slot() | t }}</h2>
            <div class="mb-4 flex flex-wrap gap-2">
              <input class="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm" [placeholder]="'builder.search' | t" [value]="slotQ()" (input)="slotQ.set(($any($event.target)).value)" />
              <select class="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-2 text-sm" [value]="slotBrand()" (change)="slotBrand.set(($any($event.target)).value)">
                <option value="">{{ 'filters.brand' | t }}</option>
                @for (b of slotBrands(); track b) {
                  <option [value]="b">{{ b }}</option>
                }
              </select>
              <select class="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-2 text-sm" [value]="slotSort()" (change)="slotSort.set($any($event.target).value)">
                <option value="price-asc">{{ 'sort.priceAsc' | t }}</option>
                <option value="price-desc">{{ 'sort.priceDesc' | t }}</option>
                <option value="name-asc">{{ 'sort.nameAsc' | t }}</option>
              </select>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              @for (part of visibleParts(); track part.slug) {
                <button type="button" class="flex gap-3 rounded-2xl border p-3 text-start" [class.border-[var(--accent)]]="builder.selected()[slot()] === part.slug" [class.border-[var(--border)]]="builder.selected()[slot()] !== part.slug" (click)="builder.choose(slot(), part.slug)">
                  <img [src]="part.image" alt="" class="h-16 w-16 object-contain" />
                  <span class="min-w-0">
                    <span class="line-clamp-2 text-sm font-medium">{{ part.name }}</span>
                    <span class="text-[var(--accent)]">{{ part.price | egp }}</span>
                  </span>
                </button>
              }
            </div>
          } @else {
            <h2 class="mb-3 font-display text-xl">{{ 'builder.summary' | t }}</h2>
            <ul class="space-y-3">
              @for (s of slots; track s) {
                <li class="flex items-center gap-3 rounded-2xl border border-[var(--border)] p-3">
                  <span class="w-28 text-sm text-[var(--text-muted)]">{{ 'builder.' + s | t }}</span>
                  @if (builder.selectedParts()[s]; as part) {
                    <img [src]="part.image" alt="" class="h-12 w-12 object-contain" />
                    <span class="min-w-0 flex-1 text-sm">{{ part.name }}</span>
                    <span class="text-[var(--accent)]">{{ part.price | egp }}</span>
                  } @else {
                    <span class="text-sm text-[var(--text-muted)]">—</span>
                  }
                </li>
              }
            </ul>
          }
          <div class="mt-6 flex gap-2">
            <button type="button" class="rounded-xl border border-[var(--border)] px-4 py-2" [disabled]="step() === 0" (click)="back()">{{ 'builder.back' | t }}</button>
            @if (step() < slots.length) {
              <button type="button" class="rounded-xl border border-[var(--border)] px-4 py-2" (click)="skip()">{{ 'builder.skip' | t }}</button>
              <button type="button" class="rounded-xl bg-[var(--accent)] px-4 py-2 font-bold text-[var(--accent-ink)]" (click)="next()">{{ 'builder.next' | t }}</button>
            }
          </div>
        </div>
        <aside class="h-fit rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 lg:sticky lg:top-24">
          <p class="text-sm text-[var(--text-muted)]">{{ 'builder.compat' | t }}</p>
          @if (!builder.warnings().length) {
            <p class="mt-2 text-[var(--color-success)]">{{ 'builder.ok' | t }}</p>
          } @else {
            @for (w of builder.warnings(); track w) {
              <p class="mt-2 text-sm text-[var(--color-danger)]">{{ w }}</p>
            }
          }
          <p class="mt-5 text-sm">{{ 'builder.tier' | t }}</p>
          <p class="font-display text-lg">{{ builder.tier().label }}</p>
          <div class="mt-1 h-2 overflow-hidden rounded-full bg-[var(--border)]">
            <div class="h-full bg-[var(--accent)]" [style.width.%]="builder.tier().pct"></div>
          </div>
          <p class="mt-1 text-[11px] text-[var(--text-muted)]">{{ 'builder.tierNote' | t }}</p>
          <p class="mt-6 text-sm">{{ 'builder.total' | t }}</p>
          <p class="price text-3xl font-bold text-[var(--accent)]">{{ builder.total() | egp }}</p>
          <button type="button" class="mt-5 w-full rounded-xl bg-[var(--accent)] py-3 font-bold text-[var(--accent-ink)]" (click)="addAll()">{{ 'builder.addAll' | t }}</button>
          <button type="button" class="mt-2 w-full rounded-xl border border-[var(--border)] py-2 text-sm" (click)="copyLink()">{{ 'builder.share' | t }}</button>
        </aside>
      </div>
    </div>
  `,
})
export class BuilderPage {
  readonly builder = inject(BuilderStore);
  readonly cart = inject(CartStore);
  readonly ui = inject(UiStore);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly slots = BUILDER_SLOTS;
  readonly presets = BUILDER_PRESETS;
  readonly step = signal(0);
  readonly slotQ = signal('');
  readonly slotBrand = signal('');
  readonly slotSort = signal('price-asc');
  readonly slot = computed(() => this.slots[Math.min(this.step(), this.slots.length - 1)]);
  readonly bundles = toSignal(
    inject(CatalogFacade).list({ category: 'pc-bundle', page: 1, pageSize: 8 }),
    { initialValue: { items: [] as ProductListItem[], total: 0, page: 1, pageSize: 8, facets: {} } },
  );

  readonly slotBrands = computed(() => {
    const list = this.builder.parts()?.[this.slot()] ?? [];
    return [...new Set(list.map((p) => p.brand))].sort();
  });

  readonly visibleParts = computed(() => {
    let list = (this.builder.parts()?.[this.slot()] ?? []).slice();
    const q = this.slotQ().trim().toLowerCase();
    const brand = this.slotBrand();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    if (brand) list = list.filter((p) => p.brand === brand);
    const [sort, dir] = this.slotSort().split('-');
    list.sort((a, b) => {
      const c = sort === 'name' ? a.name.localeCompare(b.name) : a.price - b.price;
      return dir === 'desc' ? -c : c;
    });
    return list;
  });

  constructor() {
    inject(SeoService).set('PC Builder');
    const qp = this.route.snapshot.queryParamMap;
    const fromUrl: Partial<Record<BuilderSlot, string>> = {};
    for (const s of BUILDER_SLOTS) {
      const v = qp.get(s);
      if (v) fromUrl[s] = v;
    }
    if (Object.keys(fromUrl).length) this.builder.applyParts(fromUrl);
  }

  applyPreset(parts: Partial<Record<BuilderSlot, string>>): void {
    this.builder.applyParts(parts);
    this.step.set(this.slots.length);
  }

  back(): void {
    this.step.update((n) => Math.max(0, n - 1));
  }

  skip(): void {
    this.step.update((n) => n + 1);
  }

  next(): void {
    this.step.update((n) => n + 1);
  }

  addAll(): void {
    const slugs = Object.values(this.builder.selectedParts())
      .map((p) => p?.slug)
      .filter((s): s is string => !!s);
    this.cart.addMany(slugs);
    this.ui.cartOpen.set(true);
  }

  help(): void {
    this.ui.assistantOpen.set(true);
    this.ui.assistantSeed.set(
      this.ui.lang() === 'ar'
        ? 'ساعدني أختار تجميعة PC مناسبة للعب 1440p بميزانية واضحة'
        : 'Help me choose a 1440p gaming PC build from the real catalog, with compatible parts.',
    );
    this.ui.assistantMode.set('builder');
  }

  async copyLink(): Promise<void> {
    const sel = this.builder.selected();
    const queryParams: Record<string, string> = {};
    for (const s of BUILDER_SLOTS) {
      if (sel[s]) queryParams[s] = sel[s]!;
    }
    const path = this.router.serializeUrl(this.router.createUrlTree(['/builder'], { queryParams }));
    await navigator.clipboard.writeText(new URL(path.replace(/^\//, ''), document.baseURI).href);
    this.toast.show(this.ui.t('builder.copied'));
  }
}
