import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, resource, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { CatalogFacade } from '../../core/facades/catalog.facade';
import { SeoService } from '../../core/services/seo.service';
import { CartStore } from '../../core/stores/cart.store';
import { CompareStore, WishlistStore } from '../../core/stores/lists.store';
import { RecentlyViewedStore } from '../../core/stores/recently-viewed.store';
import { ToastService } from '../../core/services/toast.service';
import { UiStore } from '../../core/stores/ui.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { EgpPipe } from '../../core/i18n/egp.pipe';
import { QtyStepper } from '../../shared/qty-stepper';
import { ProductRail } from '../../shared/product-rail';
import { ProductListItem } from '../../core/models/catalog.models';
import { SkeletonGrid } from '../../shared/skeleton';
import { ErrorState } from '../../shared/error-state';
import { OverlayDirective } from '../../shared/overlay';
import { dealLabel } from '../../shared/deal';

const GOVS = [
  'Cairo',
  'Giza',
  'Alexandria',
  'Dakahlia',
  'Sharqia',
  'Qalyubia',
  'Monufia',
  'Beheira',
  'Gharbia',
  'Port Said',
  'Suez',
  'Ismailia',
  'Fayoum',
  'Minya',
  'Assiut',
  'Sohag',
  'Qena',
  'Luxor',
  'Aswan',
];

@Component({
  selector: 'app-product',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe, EgpPipe, QtyStepper, ProductRail, SkeletonGrid, ErrorState, OverlayDirective],
  template: `
    @if (detail.isLoading()) {
      <div class="container-page py-10"><app-skeleton [cols]="2" [count]="2" /></div>
    } @else if (detail.error()) {
      <div class="container-page py-10"><app-error (retry)="detail.reload()" /></div>
    } @else if (detail.value(); as p) {
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
            <div
              class="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-black/20"
              (mousemove)="onMag($event)"
              (mouseleave)="mag.set(false)"
            >
              <img
                [src]="activeImg()"
                [alt]="p.name"
                class="aspect-square w-full cursor-zoom-in object-contain p-6"
                [style.view-transition-name]="'img-' + p.slug"
                (click)="lightbox.set(true)"
              />
              @if (mag()) {
                <div
                  class="pointer-events-none absolute hidden h-40 w-40 rounded-full border-2 border-[var(--accent)] bg-no-repeat md:block"
                  [style.background-image]="'url(' + activeImg() + ')'"
                  [style.background-size]="'220%'"
                  [style.background-position]="magPos()"
                  [style.left.px]="magX() - 80"
                  [style.top.px]="magY() - 80"
                ></div>
              }
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
              @if (p.inStock && p.stock > 0 && p.stock <= 5) {
                <span class="text-[var(--color-danger)]">{{ ui.t('product.onlyLeft', { n: p.stock }) }}</span>
              } @else {
                <span [class.text-[var(--color-success)]]="p.inStock">{{ p.inStock ? ('product.in' | t) : ('product.out' | t) }} · {{ p.stock }}</span>
              }
            </div>
            <p class="price mt-6 text-4xl font-bold text-[var(--accent)]">{{ p.price | egp }}</p>
            @if (p.oldPrice) {
              <p class="text-[var(--text-muted)] line-through">{{ p.oldPrice | egp }}</p>
              @if (deal()) {
                <p class="text-sm text-[var(--color-danger)]">⏱ {{ deal() }}</p>
              }
            }
            <div class="mt-4 flex flex-wrap gap-2">
              @for (s of keySpecs(); track s.label) {
                <span class="rounded-full border border-[var(--border)] px-3 py-1 text-xs">{{ s.label }}: {{ s.value }}</span>
              }
            </div>
            <ul class="mt-4 space-y-1 text-sm text-[var(--text-muted)]">
              <li>{{ 'product.brand' | t }}: <a [routerLink]="['/brand', p.brandSlug]" class="text-[var(--text)]">{{ p.brand }}</a></li>
              <li>{{ 'product.model' | t }}: {{ p.model }}</li>
            </ul>
            <div class="mt-4">
              <label class="text-sm">{{ 'product.gov' | t }}
                <select class="ms-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1" [value]="gov()" (change)="gov.set(($any($event.target)).value)">
                  @for (g of govs; track g) {
                    <option [value]="g">{{ g }}</option>
                  }
                </select>
              </label>
              <p class="mt-2 text-sm text-[var(--text-muted)]">{{ 'product.etaLabel' | t }}: {{ eta() }}</p>
            </div>
            <div #cta class="mt-6 flex flex-wrap items-center gap-3">
              <app-qty [(qty)]="qty" />
              <button type="button" class="rounded-xl bg-[var(--accent)] px-6 py-3 font-bold text-[var(--accent-ink)]" (click)="cart.add(p.slug, qty())">{{ 'cart.add' | t }}</button>
              <button type="button" class="rounded-xl border border-[var(--border)] px-4 py-3" (click)="wish.toggle(p.slug)">♡</button>
              <button type="button" class="rounded-xl border border-[var(--border)] px-4 py-3" (click)="compare.toggle(p.slug)">{{ 'compare.add' | t }}</button>
              <button type="button" class="rounded-xl border border-[var(--border)] px-4 py-3 text-sm" (click)="share(p.name)">{{ 'product.share' | t }}</button>
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
            <div class="mt-4 space-y-1">
              @for (h of histogram(); track h.star) {
                <div class="flex items-center gap-2 text-sm">
                  <span class="w-8">{{ h.star }}★</span>
                  <div class="h-2 flex-1 rounded bg-[var(--border)]">
                    <div class="h-2 rounded bg-[var(--accent)]" [style.width.%]="h.pct"></div>
                  </div>
                  <span class="w-8 text-[var(--text-muted)]">{{ h.count }}</span>
                </div>
              }
            </div>
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
            <app-rail [products]="related()" />
          </section>
        }
        @if (sameBrand().length) {
          <section class="mt-12">
            <h2 class="mb-4 font-display text-2xl">{{ 'product.sameBrand' | t }}</h2>
            <app-rail [products]="sameBrand()" />
          </section>
        }
        @if (recent.items().length) {
          <section class="mt-12">
            <h2 class="mb-4 font-display text-2xl">{{ 'product.recent' | t }}</h2>
            <app-rail [products]="recentOthers()" />
          </section>
        }
      </div>

      @if (sticky() && p.inStock) {
        <div class="fixed inset-x-0 z-20 border-t border-[var(--border)] bg-[var(--bg-elevated)] p-3 md:hidden" style="bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px))">
          <div class="flex items-center gap-3">
            <p class="price font-bold text-[var(--accent)]">{{ p.price | egp }}</p>
            <button type="button" class="ms-auto rounded-xl bg-[var(--accent)] px-5 py-2 font-bold text-[var(--accent-ink)]" (click)="cart.add(p.slug, qty())">{{ 'cart.add' | t }}</button>
          </div>
        </div>
      }

      @if (lightbox()) {
        <div class="fixed inset-0 z-[80] bg-black/90" (click)="lightbox.set(false)" (touchstart)="swipeStart($event)" (touchend)="swipeEnd($event)">
          <div appOverlay class="flex h-full flex-col items-center justify-center p-4" (closed)="lightbox.set(false)" (click)="$event.stopPropagation()" (keydown)="onLightKey($event)">
            <img [src]="activeImg()" [alt]="p.name" class="max-h-[80vh] max-w-full object-contain" />
            <div class="mt-4 flex gap-4">
              <button type="button" class="rounded-lg border border-white/30 px-4 py-2 text-white" (click)="shift(-1)">←</button>
              <button type="button" class="rounded-lg border border-white/30 px-4 py-2 text-white" (click)="lightbox.set(false)">✕</button>
              <button type="button" class="rounded-lg border border-white/30 px-4 py-2 text-white" (click)="shift(1)">→</button>
            </div>
          </div>
        </div>
      }
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
  readonly recent = inject(RecentlyViewedStore);
  readonly toast = inject(ToastService);
  readonly ui = inject(UiStore);
  readonly qty = signal(1);
  readonly imgIndex = signal(0);
  readonly activeTab = signal('product.description');
  readonly tabs = ['product.description', 'product.specs', 'product.reviews'];
  readonly lightbox = signal(false);
  readonly mag = signal(false);
  readonly magX = signal(0);
  readonly magY = signal(0);
  readonly magPos = signal('50% 50%');
  readonly gov = signal('Cairo');
  readonly govs = GOVS;
  readonly sticky = signal(false);
  readonly cta = viewChild<ElementRef>('cta');
  private touchX = 0;

  readonly detail = resource({
    params: () => this.slug(),
    loader: async ({ params }) => {
      const p = await firstValueFrom(this.catalog.detail(params));
      this.seo.set(p.name, p.shortDescription);
      this.imgIndex.set(0);
      this.recent.push(p.slug);
      return p;
    },
  });
  readonly all = toSignal(this.catalog.list({ page: 1, pageSize: 400 }), {
    initialValue: { items: [], total: 0, page: 1, pageSize: 400, facets: {} },
  });
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
  readonly recentOthers = computed(() => this.recent.items().filter((x) => x.slug !== this.slug()).slice(0, 4));
  readonly keySpecs = computed(() => {
    const p = this.detail.value();
    if (!p) return [];
    const want = [
      { re: /cpu|processor/i, label: 'CPU' },
      { re: /gpu|graphics|vga/i, label: 'GPU' },
      { re: /ram|memory/i, label: 'RAM' },
      { re: /storage|ssd|hdd/i, label: 'Storage' },
      { re: /display|screen|inch/i, label: 'Display' },
    ];
    const out: { label: string; value: string }[] = [];
    for (const w of want) {
      const hit = p.specs.find((s) => w.re.test(s.label) || w.re.test(s.value));
      if (hit) out.push({ label: w.label, value: hit.value });
    }
    return out;
  });
  readonly histogram = computed(() => {
    const reviews = this.detail.value()?.reviews ?? [];
    return [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => Math.round(r.rating) === star).length;
      const pct = reviews.length ? (count / reviews.length) * 100 : 0;
      return { star, count, pct };
    });
  });
  readonly deal = computed(() => {
    const p = this.detail.value();
    return p?.oldPrice ? dealLabel(p.slug) : null;
  });
  readonly eta = computed(() => {
    const g = this.gov().toLowerCase();
    return g === 'cairo' || g === 'giza' ? this.ui.t('product.etaCairo') : this.ui.t('product.etaOther');
  });

  constructor() {
    effect((onCleanup) => {
      this.detail.value();
      const el = this.cta()?.nativeElement as HTMLElement | undefined;
      if (!el || typeof IntersectionObserver === 'undefined') return;
      const io = new IntersectionObserver((entries) => this.sticky.set(!entries[0]?.isIntersecting), { threshold: 0 });
      io.observe(el);
      onCleanup(() => io.disconnect());
    });
  }

  safeHtml() {
    return this.sanitizer.bypassSecurityTrustHtml(this.detail.value()?.descriptionHtml || '');
  }

  wa(name: string): string {
    return `https://api.whatsapp.com/send/?phone=201144413879&text=${encodeURIComponent('جاي من الويب سايت بسأل عن ' + name)}`;
  }

  onMag(ev: MouseEvent): void {
    if (window.innerWidth < 768) return;
    const box = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ev.clientX - box.left;
    const y = ev.clientY - box.top;
    this.mag.set(true);
    this.magX.set(x);
    this.magY.set(y);
    this.magPos.set(`${(x / box.width) * 100}% ${(y / box.height) * 100}%`);
  }

  shift(d: number): void {
    const n = this.detail.value()?.images?.length || 1;
    this.imgIndex.update((i) => (i + d + n) % n);
  }

  onLightKey(ev: KeyboardEvent): void {
    if (ev.key === 'ArrowRight') this.shift(1);
    if (ev.key === 'ArrowLeft') this.shift(-1);
  }

  swipeStart(ev: TouchEvent): void {
    this.touchX = ev.changedTouches[0]?.clientX ?? 0;
  }

  swipeEnd(ev: TouchEvent): void {
    const x = ev.changedTouches[0]?.clientX ?? 0;
    const d = x - this.touchX;
    if (d > 40) this.shift(-1);
    if (d < -40) this.shift(1);
  }

  async share(name: string): Promise<void> {
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
        return;
      }
    } catch {
      /* fall through */
    }
    await navigator.clipboard.writeText(url);
    this.toast.show(this.ui.t('product.copied'));
  }
}
