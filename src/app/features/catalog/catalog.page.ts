import { ChangeDetectionStrategy, Component, computed, inject, input, resource, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CatalogFacade } from '../../core/facades/catalog.facade';
import { CatalogQuery, ProductListItem } from '../../core/models/catalog.models';
import { SeoService } from '../../core/services/seo.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ProductCard } from '../../shared/product-card';
import { SkeletonGrid } from '../../shared/skeleton';
import { EmptyState } from '../../shared/empty-state';
import { QuickView } from '../../shared/quick-view';
import { UiStore } from '../../core/stores/ui.store';

@Component({
  selector: 'app-catalog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, ProductCard, SkeletonGrid, EmptyState, QuickView],
  template: `
    <div class="container-page grid gap-8 py-8 lg:grid-cols-[260px_1fr]">
      <aside class="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-display font-bold">{{ 'filters.title' | t }}</h2>
          <button type="button" class="text-xs text-[var(--accent)]" (click)="clear()">{{ 'filters.clear' | t }}</button>
        </div>
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
      </aside>
      <section>
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <h1 class="font-display text-2xl font-bold">{{ heading() }}</h1>
          <span class="text-sm text-[var(--text-muted)]">{{ page.value()?.total ?? 0 }} {{ 'products' | t }}</span>
          <select class="ms-auto rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-2 text-sm" [value]="sortValue()" (change)="onSort($event)">
            <option value="default-asc">{{ 'sort.default' | t }}</option>
            <option value="name-asc">{{ 'sort.nameAsc' | t }}</option>
            <option value="name-desc">{{ 'sort.nameDesc' | t }}</option>
            <option value="price-asc">{{ 'sort.priceAsc' | t }}</option>
            <option value="price-desc">{{ 'sort.priceDesc' | t }}</option>
            <option value="rating-desc">{{ 'sort.ratingDesc' | t }}</option>
          </select>
          <button type="button" class="rounded-lg border border-[var(--border)] px-3 py-2 text-sm" (click)="ui.viewMode.set(ui.viewMode() === 'grid' ? 'list' : 'grid')">
            {{ ui.viewMode() === 'grid' ? ('view.list' | t) : ('view.grid' | t) }}
          </button>
        </div>
        @if (page.isLoading()) {
          <app-skeleton />
        } @else if (isEmpty()) {
          <app-empty />
        } @else {
          <div class="grid gap-4" [class.sm:grid-cols-2]="ui.viewMode() === 'grid'" [class.lg:grid-cols-3]="ui.viewMode() === 'grid'">
            @for (p of page.value()!.items; track p.slug) {
              <app-product-card [product]="p" (quick)="quick.set($event)" />
            }
          </div>
          <div class="mt-8 flex justify-center gap-2">
            @for (n of pages(); track n) {
              <button type="button" class="h-9 w-9 rounded-lg border border-[var(--border)]" [class.bg-[var(--accent)]]="n === (page.value()?.page ?? 1)" (click)="goPage(n)">{{ n }}</button>
            }
          </div>
        }
      </section>
    </div>
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

  readonly query = computed((): CatalogQuery => {
    const qp = this.route.snapshot.queryParamMap;
    const [sort, order] = (qp.get('sort') || 'default-asc').split('-') as [CatalogQuery['sort'], CatalogQuery['order']];
    return {
      category: this.categorySlug(),
      brand: this.brandSlug() || qp.get('brand') || undefined,
      q: qp.get('q') || undefined,
      cpu: qp.get('cpu') || undefined,
      gpu: qp.get('gpu') || undefined,
      ram: qp.get('ram') || undefined,
      storage: qp.get('storage') || undefined,
      refresh: qp.get('refresh') || undefined,
      inStock: qp.get('inStock') === '1',
      sort: sort || 'default',
      order: order || 'asc',
      page: Number(qp.get('page') || 1),
      pageSize: 12,
    };
  });

  readonly page = resource({
    params: () => ({ ...this.query(), _url: this.route.snapshot.toString() }),
    loader: ({ params }) => firstValueFrom(this.catalog.list(params)),
  });

  readonly heading = computed(() => this.categorySlug() || this.brandSlug() || this.ui.t('nav.shop'));

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

  sortValue(): string {
    const q = this.query();
    return `${q.sort}-${q.order}`;
  }

  inStock(): boolean {
    return this.query().inStock === true;
  }

  isOn(param: string, value: string): boolean {
    return (this.route.snapshot.queryParamMap.get(param) || '') === value;
  }

  toggle(param: string, value: string): void {
    this.setParam(param, this.isOn(param, value) ? null : value);
  }

  onSort(ev: Event): void {
    this.setParam('sort', (ev.target as HTMLSelectElement).value);
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

  pages(): number[] {
    const p = this.page.value();
    if (!p) return [];
    const total = Math.ceil(p.total / p.pageSize);
    return Array.from({ length: Math.min(total, 8) }, (_, i) => i + 1);
  }
}
