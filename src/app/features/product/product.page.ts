import { ChangeDetectionStrategy, Component, computed, inject, input, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CatalogFacade } from '../../core/facades/catalog.facade';
import { SeoService } from '../../core/services/seo.service';
import { CartStore } from '../../core/stores/cart.store';
import { CompareStore, WishlistStore } from '../../core/stores/lists.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { EgpPipe } from '../../core/i18n/egp.pipe';
import { QtyStepper } from '../../shared/qty-stepper';
import { ProductCard } from '../../shared/product-card';
import { ProductListItem } from '../../core/models/catalog.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-product',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe, EgpPipe, QtyStepper, ProductCard],
  template: `
    @if (detail.value(); as p) {
      <div class="container-page py-8">
        <nav class="mb-4 text-sm text-[var(--text-muted)]">
          <a routerLink="/">{{ 'nav.home' | t }}</a>
          @if (p.categorySlugs[0]) {
            <span> / </span>
            <a [routerLink]="['/c', p.categorySlugs[0]]">{{ p.categorySlugs[0] }}</a>
          }
        </nav>
        <div class="grid gap-10 lg:grid-cols-2">
          <div>
            <div class="overflow-hidden rounded-3xl border border-[var(--border)] bg-black/20">
              <img [src]="activeImg()" [alt]="p.name" class="aspect-square w-full object-contain p-6" [style.view-transition-name]="'img-' + p.slug" />
            </div>
            <div class="mt-3 flex gap-2 overflow-auto">
              @for (img of p.images; track img.medium; let i = $index) {
                <button type="button" class="h-16 w-16 rounded-lg border border-[var(--border)]" (click)="imgIndex.set(i)">
                  <img [src]="img.thumb" alt="" class="h-full w-full object-contain" />
                </button>
              }
            </div>
          </div>
          <div>
            <p class="text-sm uppercase tracking-wide text-[var(--text-muted)]">{{ p.brand }}</p>
            <h1 class="mt-2 font-display text-3xl font-bold leading-tight">{{ p.name }}</h1>
            <div class="mt-3 flex items-center gap-3 text-sm">
              <span class="text-[var(--color-yellow)]">★ {{ p.rating }}</span>
              <span class="text-[var(--text-muted)]">{{ p.reviewCount }} {{ 'product.reviews' | t }}</span>
              <span [class.text-[var(--color-success)]]="p.inStock">{{ p.inStock ? ('product.in' | t) : ('product.out' | t) }} · {{ p.stock }}</span>
            </div>
            <p class="price mt-6 text-4xl font-bold text-[var(--accent)]">{{ p.price | egp }}</p>
            @if (p.oldPrice) {
              <p class="text-[var(--text-muted)] line-through">{{ p.oldPrice | egp }}</p>
            }
            <ul class="mt-4 space-y-1 text-sm text-[var(--text-muted)]">
              <li>{{ 'product.brand' | t }}: <a [routerLink]="['/brand', p.brandSlug]" class="text-[var(--text)]">{{ p.brand }}</a></li>
              <li>{{ 'product.model' | t }}: {{ p.model }}</li>
              <li>{{ 'product.stock' | t }}: {{ p.stock }}</li>
            </ul>
            <div class="mt-6 flex flex-wrap items-center gap-3">
              <app-qty [(qty)]="qty" />
              <button type="button" class="rounded-xl bg-[var(--accent)] px-6 py-3 font-bold text-[var(--accent-ink)]" (click)="cart.add(p.slug, qty())">{{ 'cart.add' | t }}</button>
              <button type="button" class="rounded-xl border border-[var(--border)] px-4 py-3" (click)="wish.toggle(p.slug)">♡</button>
              <button type="button" class="rounded-xl border border-[var(--border)] px-4 py-3" (click)="compare.toggle(p.slug)">{{ 'compare.add' | t }}</button>
            </div>
            <a class="mt-4 inline-block text-sm text-[var(--accent)]" [href]="wa(p.name)" target="_blank" rel="noopener">{{ 'product.whatsapp' | t }}</a>
            <div class="mt-6 flex flex-wrap gap-2">
              @for (tag of p.tags; track tag) {
                <a [routerLink]="['/search']" [queryParams]="{ q: tag }" class="rounded-full border border-[var(--border)] px-3 py-1 text-xs">{{ tag }}</a>
              }
            </div>
          </div>
        </div>

        <div class="mt-10">
          <div class="flex gap-4 border-b border-[var(--border)]">
            @for (tab of tabs; track tab) {
              <button type="button" class="px-2 py-3" [class.border-b-2]="tab === activeTab()" [class.border-[var(--accent)]]="tab === activeTab()" (click)="activeTab.set(tab)">{{ tab | t }}</button>
            }
          </div>
          @if (activeTab() === 'product.description') {
            <div class="prose-invert mt-6 max-w-none text-sm leading-7" [innerHTML]="safeHtml()"></div>
          }
          @if (activeTab() === 'product.specs') {
            <table class="mt-6 w-full text-sm">
              @for (s of p.specs; track s.label) {
                <tr class="border-b border-[var(--border)]">
                  <th class="w-1/3 py-3 text-start text-[var(--text-muted)]">{{ s.label }}</th>
                  <td class="py-3">{{ s.value }}</td>
                </tr>
              }
            </table>
          }
          @if (activeTab() === 'product.reviews') {
            <p class="mt-4 text-xs text-[var(--text-muted)]">{{ 'product.demoReviews' | t }}</p>
            <div class="mt-4 grid gap-3 md:grid-cols-2">
              @for (r of p.reviews; track r.author + r.date) {
                <article class="rounded-2xl border border-[var(--border)] p-4">
                  <p class="font-semibold">{{ r.author }} · ★ {{ r.rating }}</p>
                  <p class="mt-1 text-sm text-[var(--text-muted)]">{{ r.comment }}</p>
                </article>
              }
            </div>
          }
        </div>

        @if (related().length) {
          <section class="mt-12">
            <h2 class="mb-4 font-display text-2xl">{{ 'product.related' | t }}</h2>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              @for (item of related(); track item.slug) {
                <app-product-card [product]="item" />
              }
            </div>
          </section>
        }
        @if (sameBrand().length) {
          <section class="mt-12">
            <h2 class="mb-4 font-display text-2xl">{{ 'product.sameBrand' | t }}</h2>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              @for (item of sameBrand(); track item.slug) {
                <app-product-card [product]="item" />
              }
            </div>
          </section>
        }
      </div>
    }
  `,
})
export class ProductPage {
  readonly slug = input.required<string>();
  private readonly catalog = inject(CatalogFacade);
  private readonly seo = inject(SeoService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly cart = inject(CartStore);
  readonly wish = inject(WishlistStore);
  readonly compare = inject(CompareStore);
  readonly qty = signal(1);
  readonly imgIndex = signal(0);
  readonly activeTab = signal('product.description');
  readonly tabs = ['product.description', 'product.specs', 'product.reviews'];
  readonly detail = resource({
    params: () => this.slug(),
    loader: async ({ params }) => {
      const p = await firstValueFrom(this.catalog.detail(params));
      this.seo.set(p.name, p.shortDescription);
      this.imgIndex.set(0);
      return p;
    },
  });
  readonly all = toSignal(this.catalog.list({ page: 1, pageSize: 400 }), { initialValue: { items: [], total: 0, page: 1, pageSize: 400, facets: {} } });
  readonly activeImg = computed(() => {
    const p = this.detail.value();
    return p?.images?.[this.imgIndex()]?.large || p?.images?.[this.imgIndex()]?.medium || p?.image || '';
  });
  readonly related = computed(() => {
    const p = this.detail.value();
    if (!p) return [] as ProductListItem[];
    return this.all()
      .items.filter((x) => x.slug !== p.slug && x.categorySlugs.some((c) => p.categorySlugs.includes(c)))
      .slice(0, 4);
  });
  readonly sameBrand = computed(() => {
    const p = this.detail.value();
    if (!p) return [] as ProductListItem[];
    return this.all()
      .items.filter((x) => x.slug !== p.slug && x.brandSlug === p.brandSlug)
      .slice(0, 4);
  });

  safeHtml() {
    return this.sanitizer.bypassSecurityTrustHtml(this.detail.value()?.descriptionHtml || '');
  }

  wa(name: string): string {
    return `https://api.whatsapp.com/send/?phone=201144413879&text=${encodeURIComponent('جاي من الويب سايت بسأل عن ' + name)}`;
  }
}
