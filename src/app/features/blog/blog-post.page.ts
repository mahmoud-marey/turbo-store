import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { CatalogFacade } from '../../core/facades/catalog.facade';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-blog-post',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="container-page max-w-3xl py-10">
      <h1 class="font-display text-3xl font-bold">{{ post.value()?.title }}</h1>
      <div class="mt-6 text-sm leading-7" [innerHTML]="html()"></div>
    </article>
  `,
})
export class BlogPostPage {
  readonly slug = input.required<string>();
  private readonly catalog = inject(CatalogFacade);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly seo = inject(SeoService);
  readonly post = resource({
    params: () => this.slug(),
    loader: async ({ params }) => {
      const p = await firstValueFrom(this.catalog.post(params));
      this.seo.set(p.title);
      return p;
    },
  });
  html() {
    return this.sanitizer.bypassSecurityTrustHtml(this.post.value()?.html || '');
  }
}
