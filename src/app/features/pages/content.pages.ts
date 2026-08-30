import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { CatalogFacade } from '../../core/facades/catalog.facade';
import { SeoService } from '../../core/services/seo.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="container-page max-w-3xl py-10">
      <h1 class="font-display text-3xl font-bold">{{ page.value()?.title }}</h1>
      <div class="mt-6 text-sm leading-7" [innerHTML]="html()"></div>
    </article>
  `,
})
export class ContentPage {
  readonly id = input.required<string>();
  private readonly catalog = inject(CatalogFacade);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly seo = inject(SeoService);
  readonly page = resource({
    params: () => this.id(),
    loader: async ({ params }) => {
      const p = await firstValueFrom(this.catalog.page(params));
      this.seo.set(p.title);
      return p;
    },
  });
  html() {
    return this.sanitizer.bypassSecurityTrustHtml(this.page.value()?.html || '');
  }
}

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <div class="container-page max-w-xl py-16">
      <h1 class="font-display text-4xl font-bold">{{ 'contact.title' | t }}</h1>
      <p class="mt-3 text-[var(--text-muted)]">{{ 'contact.text' | t }}</p>
      <div class="mt-8 space-y-2">
        <p>📞 01144413879</p>
        <p>💬 WhatsApp 01144413879</p>
        <a class="inline-block text-[var(--accent)]" href="https://www.facebook.com/Turbo.eg/" target="_blank" rel="noopener">Facebook /Turbo.eg</a>
      </div>
    </div>
  `,
})
export class ContactPage {
  constructor() {
    inject(SeoService).set('Contact');
  }
}

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, RouterLink],
  template: `
    <div class="container-page py-24 text-center">
      <h1 class="font-display text-5xl font-bold">{{ '404.title' | t }}</h1>
      <p class="mt-3 text-[var(--text-muted)]">{{ '404.text' | t }}</p>
      <a routerLink="/" class="mt-6 inline-block rounded-xl bg-[var(--accent)] px-5 py-3 font-bold text-[var(--accent-ink)]">{{ '404.cta' | t }}</a>
    </div>
  `,
})
export class NotFoundPage {
  constructor() {
    inject(SeoService).set('Not found');
  }
}
