import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, resource, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { CatalogFacade } from '../../core/facades/catalog.facade';
import { CatalogQuery, FilterMeta, ProductListItem } from '../../core/models/catalog.models';
import { asList } from '../../core/services/catalog-query.service';
import { SeoService } from '../../core/services/seo.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ProductCard } from '../../shared/product-card';
import { SkeletonGrid } from '../../shared/skeleton';
import { EmptyState } from '../../shared/empty-state';
import { QuickView } from '../../shared/quick-view';
import { ErrorState } from '../../shared/error-state';
import { OverlayDirective } from '../../shared/overlay';
import { UiStore } from '../../core/stores/ui.store';
import { looksLikeNaturalLanguage } from '../../core/ai/nl';

@Component({
  selector: 'app-catalog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe, ProductCard, SkeletonGrid, EmptyState, QuickView, ErrorState, OverlayDirective, NgTemplateOutlet],
  template: `
    @if (heroImg()) {
      <div class="relative h-36 overflow-hidden border-b border-[var(--border)] md:h-48">
        <img [src]="heroImg()" alt="" class="h-full w-full object-cover opacity-70" />
        <div class="absolute inset-0 bg-gradient-to-t from-[var(--bg)] to-transparent"></div>
      </div>
    }
    <div class="container-page py-6">
      <nav class="mb-3 text-sm text-[var(--text-muted)]">
        <a routerLink="/">{{ 'nav.home' | t }}</a>
        @if (parentCat(); as parent) {
          <span> / </span>
          <a [routerLink]="['/c', parent.slug]">{{ labelOf(parent) }}</a>
        }
        @if (heading()) {
          <span> / </span>
          <span>{{ heading() }}</span>
        }
      </nav>
      <div class="mb-4 flex flex-wrap items-end gap-3">
        <h1 class="font-display text-3xl font-bold">{{ heading() }}</h1>
        <span class="text-sm text-[var(--text-muted)]">{{ page.value()?.total ?? 0 }} {{ 'products' | t }}</span>
        @if (searchTerm()) {
          <button type="button" class="rounded-full border border-[var(--border)] px-3 py-1 text-sm" (click)="setParam('q', null)">
            {{ 'search.for' | t }} “{{ searchTerm() }}” ✕
          </button>
        }
        @if (nlQuery()) {
          <button type="button" class="rounded-full border border-[var(--accent)] px-3 py-1 text-sm text-[var(--accent)]" (click)="ask()">
            {{ 'search.ask' | t }}
          </button>
        }
      </div>
      @if (chips().length) {
        <div class="mb-4 flex flex-wrap items-center gap-2">
          @for (c of chips(); track c.key + c.value) {
            <button type="button" class="rounded-full border border-[var(--border)] px-3 py-1 text-xs" (click)="removeChip(c.key, c.value)">
              {{ c.label }} ✕
            </button>
          }
          <button type="button" class="text-xs text-[var(--accent)]" (click)="clear()">{{ 'filters.clear' | t }}</button>
        </div>
      }
    </div>
    <div class="container-page grid gap-8 pb-10 lg:grid-cols-[260px_1fr]">
      <button
        type="button"
        class="rounded-xl border border-[var(--border)] px-4 py-3 text-sm lg:hidden"
        (click)="ui.filtersOpen.set(true)"
      >
        {{ 'filters.title' | t }} ({{ chips().length }})
      </button>
      <aside class="hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 lg:block">
        <ng-container *ngTemplateOutlet="filtersTpl" />
      </aside>
      <section>
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <select class="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-2 text-sm" [value]="sortValue()" (change)="onSort($event)">
            <option value="default-asc">{{ 'sort.default' | t }}</option>
            <option value="name-asc">{{ 'sort.nameAsc' | t }}</option>
            <option value="name-desc">{{ 'sort.nameDesc' | t }}</option>
            <option value="price-asc">{{ 'sort.priceAsc' | t }}</option>
            <option value="price-desc">{{ 'sort.priceDesc' | t }}</option>
            <option value="rating-desc">{{ 'sort.ratingDesc' | t }}</option>
          </select>
          <label class="text-sm">{{ 'show' | t }}
            <select class="ms-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-2 text-sm" [value]="pageSize()" (change)="onShow($event)">
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
            </select>
          </label>
          <button type="button" class="ms-auto rounded-lg border border-[var(--border)] px-3 py-2 text-sm" (click)="ui.viewMode.set(ui.viewMode() === 'grid' ? 'list' : 'grid')">
            {{ ui.viewMode() === 'grid' ? ('view.list' | t) : ('view.grid' | t) }}
          </button>
        </div>
        @if (page.isLoading()) {
          <app-skeleton />
        } @else if (page.error()) {
          <app-error (retry)="page.reload()" />
        } @else if (isEmpty()) {
          <app-empty />
        } @else {
          <div class="grid gap-4" [class.sm:grid-cols-2]="ui.viewMode() === 'grid'" [class.lg:grid-cols-3]="ui.viewMode() === 'grid'">
            @for (p of page.value()!.items; track p.slug) {
              <app-product-card [product]="p" [layout]="ui.viewMode()" (quick)="quick.set($event)" />
            }
          </div>
          <div class="mt-8 flex items-center justify-center gap-2">
            <button type="button" class="rounded-lg border border-[var(--border)] px-3 py-2 text-sm" [disabled]="(page.value()?.page ?? 1) <= 1" (click)="goPage((page.value()?.page ?? 1) - 1)">{{ 'pagination.prev' | t }}</button>
            @for (n of pages(); track n) {
              <button type="button" class="h-9 w-9 rounded-lg border border-[var(--border)]" [class.bg-[var(--accent)]]="n === (page.value()?.page ?? 1)" (click)="goPage(n)">{{ n }}</button>
            }
            <button type="button" class="rounded-lg border border-[var(--border)] px-3 py-2 text-sm" [disabled]="(page.value()?.page ?? 1) >= totalPages()" (click)="goPage((page.value()?.page ?? 1) + 1)">{{ 'pagination.next' | t }}</button>
          </div>
        }
      </section>
    </div>

    @if (ui.filtersOpen()) {
      <div class="fixed inset-0 z-50 bg-black/60 lg:hidden" (click)="ui.filtersOpen.set(false)">
        <div
          appOverlay
          class="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-3xl bg-[var(--bg-elevated)] p-5"
          (click)="$event.stopPropagation()"
          (closed)="ui.filtersOpen.set(false)"
        >
          <div class="mb-3 flex items-center justify-between">
            <h2 class="font-display font-bold">{{ 'filters.title' | t }}</h2>
            <button type="button" (click)="ui.filtersOpen.set(false)">✕</button>
          </div>
          <ng-container *ngTemplateOutlet="filtersTpl" />
          <button type="button" class="mt-4 w-full rounded-xl bg-[var(--accent)] py-3 font-bold text-[var(--accent-ink)]" (click)="ui.filtersOpen.set(false)">{{ 'filters.apply' | t }}</button>
        </div>
      </div>
    }

    <ng-template #filtersTpl>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-display font-bold">{{ 'filters.title' | t }}</h2>
        <button type="button" class="text-xs text-[var(--accent)]" (click)="clear()">{{ 'filters.clear' | t }}</button>
      </div>
      @if (filters.value(); as meta) {
        <p class="mb-2 text-sm font-medium">{{ 'filters.price' | t }}</p>
        <div class="mb-3 flex flex-wrap gap-1">
          @for (b of meta.priceBuckets; track b.id) {
            <button
              type="button"
              class="rounded-full border px-2 py-1 text-xs"
              [class.border-[var(--accent)]]="isBucket(b)"
              [class.border-[var(--border)]]="!isBucket(b)"
              (click)="applyBucket(b)"
            >
              {{ b.label }}
            </button>
          }
        </div>
        <div class="mb-4 flex gap-2">
          <input class="w-1/2 rounded-lg border border-[var(--border)] bg-transparent px-2 py-1 text-sm" type="number" [placeholder]="'filters.min' | t" [value]="query().minPrice ?? ''" (change)="setParam('minPrice', numOrNull($event))" />
          <input class="w-1/2 rounded-lg border border-[var(--border)] bg-transparent px-2 py-1 text-sm" type="number" [placeholder]="'filters.max' | t" [value]="query().maxPrice ?? ''" (change)="setParam('maxPrice', numOrNull($event))" />
        </div>
      }
      @if (page.value(); as data) {
        @for (group of facetGroups(); track group.key) {
          @if (data.facets[group.key]?.length) {
            <details open class="mb-3">
              <summary class="cursor-pointer font-medium">{{ group.labelKey | t }}</summary>
              <div class="mt-2 max-h-48 space-y-1 overflow-auto text-sm">
                @for (f of data.facets[group.key]; track f.value) {
                  <label class="flex items-center gap-2">
                    <input type="checkbox" [checked]="isOn(group.param, f.value)" (change)="toggle(group.param, f.value)" />
                    <span>{{ f.value }}</span>
                    <span class="ms-auto text-[var(--text-muted)]">{{ f.count }}</span>
                  </label>
                }
              </div>
            </details>
          }
        }
        <label class="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" [checked]="inStock()" (change)="setParam('inStock', inStock() ? null : '1')" />
          {{ 'filters.inStock' | t }}
        </label>
      }
    </ng-template>
    <app-quick-view [product]="quick()" (closed)="quick.set(null)" />
  `,
})
export class CatalogPage {
  readonly categorySlug = input<string | undefined>();
  readonly brandSlug = input<string | undefined>();
  private readonly catalog = inject(CatalogFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  readonly ui = inject(UiStore);
  readonly quick = signal<ProductListItem | null>(null);
  readonly cats = toSignal(this.catalog.categories(), { initialValue: [] });
  readonly brands = toSignal(this.catalog.brands(), { initialValue: [] });
  readonly home = toSignal(this.catalog.home(), { initialValue: null });
  readonly filters = resource({ loader: () => firstValueFrom(this.catalog.filters()) });

  readonly query = computed((): CatalogQuery => {
    const qp = this.route.snapshot.queryParamMap;
    const [sort, order] = (qp.get('sort') || 'default-asc').split('-') as [CatalogQuery['sort'], CatalogQuery['order']];
    const show = Number(qp.get('show') || 12);
    const pathBrand = this.brandSlug();
    const brands = asList(qp.get('brand') || undefined);
    if (pathBrand && !brands.includes(pathBrand)) brands.unshift(pathBrand);
    return {
      category: this.categorySlug(),
      brand: brands.length ? brands : undefined,
      q: qp.get('q') || undefined,
      cpu: asList(qp.get('cpu') || undefined),
      gpu: asList(qp.get('gpu') || undefined),
      ram: asList(qp.get('ram') || undefined),
      storage: asList(qp.get('storage') || undefined),
      refresh: asList(qp.get('refresh') || undefined),
      minPrice: qp.get('minPrice') ? Number(qp.get('minPrice')) : undefined,
      maxPrice: qp.get('maxPrice') ? Number(qp.get('maxPrice')) : undefined,
      inStock: qp.get('inStock') === '1',
      sort: sort || 'default',
      order: order || 'asc',
      page: Number(qp.get('page') || 1),
      pageSize: [12, 24, 48].includes(show) ? show : 12,
    };
  });

  readonly page = resource({
    params: () => ({ ...this.query(), _url: this.route.snapshot.toString() }),
    loader: ({ params }) => {
      const { _url, ...q } = params;
      return firstValueFrom(this.catalog.list(q));
    },
  });

  readonly catRecord = computed(() => this.cats().find((c) => c.slug === this.categorySlug()));
  readonly parentCat = computed(() => {
    const cat = this.catRecord();
    if (!cat?.parentSlug) return null;
    return this.cats().find((c) => c.slug === cat.parentSlug) ?? null;
  });
  readonly heading = computed(() => {
    const cat = this.catRecord();
    if (cat) return this.labelOf(cat);
    const brand = this.brands().find((b) => b.slug === this.brandSlug());
    if (brand) return brand.name;
    if (this.searchTerm()) return this.ui.t('search.results');
    return this.ui.t('nav.shop');
  });
  readonly heroImg = computed(() => this.home()?.categoryTiles.find((t) => t.slug === this.categorySlug())?.image);
  readonly searchTerm = computed(() => this.query().q || '');
  readonly nlQuery = computed(() => looksLikeNaturalLanguage(this.searchTerm()));
  readonly pageSize = computed(() => this.query().pageSize ?? 12);

  readonly chips = computed(() => {
    const q = this.query();
    const out: { key: string; value: string; label: string }[] = [];
    const push = (key: string, vals: string | string[] | undefined) => {
      for (const v of asList(vals)) {
        if (key === 'brand' && v === this.brandSlug()) continue;
        out.push({ key, value: v, label: v });
      }
    };
    push('brand', q.brand);
    push('cpu', q.cpu);
    push('gpu', q.gpu);
    push('ram', q.ram);
    push('storage', q.storage);
    push('refresh', q.refresh);
    if (q.minPrice != null) out.push({ key: 'minPrice', value: String(q.minPrice), label: `≥ ${q.minPrice}` });
    if (q.maxPrice != null) out.push({ key: 'maxPrice', value: String(q.maxPrice), label: `≤ ${q.maxPrice}` });
    if (q.inStock) out.push({ key: 'inStock', value: '1', label: this.ui.t('filters.inStock') });
    if (q.q) out.push({ key: 'q', value: q.q, label: `“${q.q}”` });
    return out;
  });

  readonly facetGroups = () => [
    { key: 'brands', param: 'brand', labelKey: 'filters.brand' },
    { key: 'cpu', param: 'cpu', labelKey: 'filters.cpu' },
    { key: 'gpu', param: 'gpu', labelKey: 'filters.gpu' },
    { key: 'ram', param: 'ram', labelKey: 'filters.ram' },
    { key: 'storage', param: 'storage', labelKey: 'filters.storage' },
    { key: 'refresh', param: 'refresh', labelKey: 'filters.refresh' },
  ];

  constructor() {
    this.seo.set('Shop');
    this.route.queryParamMap.subscribe(() => this.page.reload());
    this.route.paramMap.subscribe(() => this.page.reload());
  }

  labelOf(cat: { name: string; nameAr: string }): string {
    return this.ui.lang() === 'ar' ? cat.nameAr || cat.name : cat.name;
  }

  sortValue(): string {
    const q = this.query();
    return `${q.sort}-${q.order}`;
  }

  inStock(): boolean {
    return this.query().inStock === true;
  }

  isOn(param: string, value: string): boolean {
    return asList(this.route.snapshot.queryParamMap.get(param)).includes(value);
  }

  toggle(param: string, value: string): void {
    const cur = asList(this.route.snapshot.queryParamMap.get(param));
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    this.setParam(param, next.length ? next.join(',') : null);
  }

  removeChip(key: string, value: string): void {
    if (key === 'minPrice' || key === 'maxPrice' || key === 'q' || key === 'inStock') {
      this.setParam(key, null);
      return;
    }
    this.toggle(key, value);
  }

  isBucket(b: FilterMeta['priceBuckets'][number]): boolean {
    const q = this.query();
    return q.minPrice === b.min && (q.maxPrice ?? null) === (b.max ?? null);
  }

  applyBucket(b: FilterMeta['priceBuckets'][number]): void {
    void this.router.navigate([], {
      queryParams: { minPrice: b.min, maxPrice: b.max, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  onSort(ev: Event): void {
    this.setParam('sort', (ev.target as HTMLSelectElement).value);
  }

  onShow(ev: Event): void {
    this.setParam('show', (ev.target as HTMLSelectElement).value);
  }

  numOrNull(ev: Event): string | null {
    const v = (ev.target as HTMLInputElement).value;
    return v === '' ? null : v;
  }

  clear(): void {
    void this.router.navigate([], { queryParams: {} });
  }

  setParam(key: string, value: string | null): void {
    void this.router.navigate([], {
      queryParams: { [key]: value, page: key === 'page' ? value : 1 },
      queryParamsHandling: 'merge',
    });
  }

  goPage(n: number): void {
    this.setParam('page', `${n}`);
  }

  isEmpty(): boolean {
    return (this.page.value()?.items.length ?? 0) === 0;
  }

  totalPages(): number {
    const p = this.page.value();
    if (!p) return 1;
    return Math.max(1, Math.ceil(p.total / p.pageSize));
  }

  pages(): number[] {
    const cur = this.page.value()?.page ?? 1;
    const total = this.totalPages();
    const start = Math.max(1, cur - 2);
    const end = Math.min(total, cur + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  ask(): void {
    this.ui.assistantOpen.set(true);
    this.ui.assistantSeed.set(this.searchTerm());
  }
}
