import { inject, Injectable } from '@angular/core';
import { CATALOG_API } from '../api/catalog-api';
import { CatalogQuery } from '../models/catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogFacade {
  private readonly api = inject(CATALOG_API);

  list(query: CatalogQuery) {
    return this.api.list(query);
  }

  detail(slug: string) {
    return this.api.detail(slug);
  }

  categories() {
    return this.api.categories();
  }

  brands() {
    return this.api.brands();
  }

  home() {
    return this.api.home();
  }

  builder() {
    return this.api.builderCatalog();
  }

  filters() {
    return this.api.filters();
  }

  blog() {
    return this.api.blog();
  }

  post(slug: string) {
    return this.api.post(slug);
  }

  page(id: string) {
    return this.api.page(id);
  }

  suggestions(q: string) {
    return this.api.suggestions(q);
  }
}
