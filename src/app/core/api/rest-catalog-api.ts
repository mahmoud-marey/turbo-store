import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, CatalogApi } from './catalog-api';
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

/** Drop-in API client. Bind CATALOG_API to this class when the backend is ready. */
@Injectable({ providedIn: 'root' })
export class RestCatalogApi implements CatalogApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(query: CatalogQuery): Observable<Page<ProductListItem>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v == null || v === '') return;
      if (Array.isArray(v)) {
        v.forEach((item) => {
          if (item !== '') params = params.append(k, String(item));
        });
      } else {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<Page<ProductListItem>>(`${this.base}/products`, { params });
  }

  detail(slug: string): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`${this.base}/products/${slug}`);
  }

  categories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/categories`);
  }

  brands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.base}/brands`);
  }

  home(): Observable<HomeData> {
    return this.http.get<HomeData>(`${this.base}/home`);
  }

  builderCatalog(): Observable<BuilderCatalog> {
    return this.http.get<BuilderCatalog>(`${this.base}/builder`);
  }

  filters(): Observable<FilterMeta> {
    return this.http.get<FilterMeta>(`${this.base}/filters`);
  }

  blog(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>(`${this.base}/blog`);
  }

  post(slug: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.base}/blog/${slug}`);
  }

  page(id: string): Observable<ContentPage> {
    return this.http.get<ContentPage>(`${this.base}/pages/${id}`);
  }

  suggestions(q: string): Observable<ProductListItem[]> {
    return this.http.get<ProductListItem[]>(`${this.base}/products/suggest`, { params: { q } });
  }
}
