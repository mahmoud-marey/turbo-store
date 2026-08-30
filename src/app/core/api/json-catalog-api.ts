import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { delay, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import {
  API_BASE_URL,
  API_LATENCY_MS,
  CatalogApi,
} from './catalog-api';
import {
  BlogPost,
  Brand,
  BuilderCatalog,
  CatalogQuery,
  Category,
  ContentPage,
  FilterMeta,
  HomeData,
  Page,
  ProductDetail,
  ProductListItem,
} from '../models/catalog.models';
import { CatalogQueryService } from '../services/catalog-query.service';

@Injectable({ providedIn: 'root' })
export class JsonCatalogApi implements CatalogApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private readonly latency = inject(API_LATENCY_MS);
  private readonly queryService = inject(CatalogQueryService);

  private readonly products$ = this.http
    .get<ProductListItem[]>(`${this.base}/products.json`)
    .pipe(shareReplay(1));
  private readonly categories$ = this.http.get<Category[]>(`${this.base}/categories.json`).pipe(shareReplay(1));
  private readonly brands$ = this.http.get<Brand[]>(`${this.base}/brands.json`).pipe(shareReplay(1));
  private readonly home$ = this.http.get<HomeData>(`${this.base}/home.json`).pipe(shareReplay(1));
  private readonly builder$ = this.http.get<BuilderCatalog>(`${this.base}/builder.json`).pipe(shareReplay(1));
  private readonly filters$ = this.http.get<FilterMeta>(`${this.base}/filters.json`).pipe(shareReplay(1));
  private readonly blog$ = this.http.get<BlogPost[]>(`${this.base}/blog.json`).pipe(shareReplay(1));

  list(query: CatalogQuery): Observable<Page<ProductListItem>> {
    return this.products$.pipe(
      switchMap((products) =>
        this.filters$.pipe(map((filters) => this.queryService.query(products, query, filters))),
      ),
      this.lag(),
    );
  }

  detail(slug: string): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`${this.base}/products/${slug}.json`).pipe(this.lag());
  }

  categories(): Observable<Category[]> {
    return this.categories$.pipe(this.lag());
  }

  brands(): Observable<Brand[]> {
    return this.brands$.pipe(this.lag());
  }

  home(): Observable<HomeData> {
    return this.home$.pipe(this.lag());
  }

  builderCatalog(): Observable<BuilderCatalog> {
    return this.builder$.pipe(this.lag());
  }

  filters(): Observable<FilterMeta> {
    return this.filters$.pipe(this.lag());
  }

  blog(): Observable<BlogPost[]> {
    return this.blog$.pipe(this.lag());
  }

  post(slug: string): Observable<BlogPost> {
    return this.blog$.pipe(
      map((posts) => {
        const post = posts.find((p) => p.slug === slug);
        if (!post) throw new Error('Post not found');
        return post;
      }),
      this.lag(),
    );
  }

  page(id: string): Observable<ContentPage> {
    return this.http.get<ContentPage>(`${this.base}/pages/${id}.json`).pipe(this.lag());
  }

  suggestions(q: string): Observable<ProductListItem[]> {
    const term = q.trim().toLowerCase();
    if (!term) return of([]);
    return this.products$.pipe(
      map((items) =>
        items
          .filter((p) => p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term))
          .slice(0, 8),
      ),
    );
  }

  private lag<T>() {
    return delay<T>(this.latency);
  }
}
