import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CatalogFacade } from '../../core/facades/catalog.facade';
import { ProductListItem } from '../../core/models/catalog.models';
import { SeoService } from '../../core/services/seo.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ProductCard } from '../../shared/product-card';
import { SkeletonGrid } from '../../shared/skeleton';
import { QuickView } from '../../shared/quick-view';
import { UiStore } from '../../core/stores/ui.store';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe, ProductCard, SkeletonGrid, QuickView],
  template: `
    @if (home.value(); as data) {
      <section class="relative overflow-hidden border-b border-[var(--border)]">
        <div class="container-page grid items-center gap-8 py-10 lg:grid-cols-2">
          @let slide = data.hero[heroIndex()] || data.hero[0];
          <div>
            <p class="mb-2 text-sm tracking-[0.2em] text-[var(--accent)]">TURBO STORE</p>
            <h1 class="font-display text-4xl font-bold leading-tight lg:text-6xl">{{ slide?.title || ('tagline' | t) }}</h1>
            <p class="mt-4 max-w-xl text-lg text-[var(--text-muted)]">{{ slide?.subtitle || data.slogans[1] }}</p>
            <div class="mt-6 flex gap-3">
              <a [routerLink]="slide?.href || '/c/laptops'" class="rounded-xl bg-[var(--accent)] px-5 py-3 font-bold text-[var(--accent-ink)]">{{ 'shop.now' | t }}</a>
              <a routerLink="/builder" class="rounded-xl border border-[var(--border)] px-5 py-3">{{ 'nav.builder' | t }}</a>
            </div>
            <div class="mt-6 flex gap-2">
              @for (s of data.hero; track s.title; let i = $index) {
                <button type="button" class="h-2 w-8 rounded-full" [class.bg-[var(--accent)]]="i === heroIndex()" [class.bg-[var(--border)]]="i !== heroIndex()" (click)="heroIndex.set(i)"></button>
              }
            </div>
          </div>
          <img [src]="slide?.image" [alt]="slide?.title" class="w-full rounded-3xl border border-[var(--border)] object-cover" />
        </div>
      </section>

      <section class="container-page grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        @for (tile of data.categoryTiles; track tile.slug) {
          <a [routerLink]="['/c', tile.slug]" class="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
            <img [src]="tile.image" [alt]="tile.name" class="h-36 w-full object-cover transition group-hover:scale-105" />
            <div class="p-4">
              <p class="font-display font-bold">{{ tile.name }}</p>
              <p class="text-sm text-[var(--accent)]">{{ tile.fromLabel }}</p>
            </div>
          </a>
        }
      </section>

      <section class="container-page grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (t of data.trust; track t.id) {
          <div class="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <p class="font-display font-bold">{{ ui.lang() === 'ar' ? t.titleAr : t.title }}</p>
            <p class="mt-1 text-sm text-[var(--text-muted)]">{{ ui.lang() === 'ar' ? t.textAr : t.text }}</p>
          </div>
        }
      </section>

      @for (rail of rails(); track rail.id) {
        <section class="container-page py-10">
          <div class="mb-4 flex items-end justify-between">
            <h2 class="font-display text-2xl font-bold">{{ rail.title }}</h2>
            <a routerLink="/c/laptops" class="text-sm text-[var(--accent)]">{{ 'shop.now' | t }}</a>
          </div>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            @for (p of rail.products; track p.slug) {
              <app-product-card [product]="p" (quick)="quick.set($event)" />
            }
          </div>
        </section>
      }

      <section class="container-page my-8 overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(135deg,var(--color-navy),#07111f)] p-8 lg:p-12">
        <p class="text-[var(--accent)]">{{ 'home.builderTitle' | t }}</p>
        <h2 class="mt-2 font-display text-3xl font-bold">{{ 'home.builderText' | t }}</h2>
        <a routerLink="/builder" class="mt-6 inline-block rounded-xl bg-[var(--accent)] px-5 py-3 font-bold text-[var(--accent-ink)]">{{ 'home.builderCta' | t }}</a>
      </section>

      <section class="container-page py-10">
        <h2 class="mb-6 font-display text-2xl font-bold">{{ 'home.brands' | t }}</h2>
        <div class="flex gap-4 overflow-auto pb-2">
          @for (b of brands.value(); track b.slug) {
            <a [routerLink]="['/brand', b.slug]" class="grid h-24 w-32 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-white p-3">
              <img [src]="b.logo" [alt]="b.name" class="max-h-16 object-contain" />
            </a>
          }
        </div>
      </section>
    } @else {
      <div class="container-page py-10"><app-skeleton /></div>
    }
    <app-quick-view [product]="quick()" (closed)="quick.set(null)" />
  `,
})
export class HomePage {
  private readonly catalog = inject(CatalogFacade);
  private readonly seo = inject(SeoService);
  readonly ui = inject(UiStore);
  readonly heroIndex = signal(0);
  readonly quick = signal<ProductListItem | null>(null);
  readonly home = resource({ loader: () => firstValueFrom(this.catalog.home()) });
  readonly products = resource({ loader: () => firstValueFrom(this.catalog.list({ page: 1, pageSize: 400 })) });
  readonly brands = resource({ loader: () => firstValueFrom(this.catalog.brands()) });

  readonly rails = computed(() => {
    const home = this.home.value();
    const items = this.products.value()?.items ?? [];
    const map = new Map(items.map((p) => [p.slug, p]));
    return (home?.rails ?? [])
      .map((r) => ({ ...r, products: r.productSlugs.map((s) => map.get(s)).filter((p): p is ProductListItem => !!p) }))
      .filter((r) => r.products.length);
  });

  constructor() {
    this.seo.set('Turbo Store', 'Gaming PCs, laptops and accessories — the Turbo upgrade.');
  }
}
